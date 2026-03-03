const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { pool } = require('../db');
const { extractMetadata, getAudioMimeType } = require('../utils/metadata');

const CUENTOS_DIR = path.resolve(__dirname, '..', '..', process.env.CUENTOS_DIR || '../cuentos');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const audioTypes = /\.(flac|mp3|ogg|wav|m4a|aac)$/i;
    const imageTypes = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (audioTypes.test(file.originalname) || imageTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'));
    }
  },
});

// GET /api/cuentos - Listar todos los cuentos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, titulo, archivo, duracion, veces_reproducido, artista, album, descripcion, activo, created_at, updated_at, (portada IS NOT NULL) as tiene_portada FROM cuentos ORDER BY titulo ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener cuentos' });
  }
});

// GET /api/cuentos/:id - Obtener un cuento
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, titulo, archivo, duracion, veces_reproducido, artista, album, descripcion, activo, created_at, updated_at, (portada IS NOT NULL) as tiene_portada FROM cuentos WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cuento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuento' });
  }
});

// GET /api/cuentos/:id/cover - Obtener portada
router.get('/:id/cover', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT portada, archivo FROM cuentos WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cuento no encontrado' });

    const cuento = rows[0];

    if (cuento.portada) {
      const match = cuento.portada.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const imageData = Buffer.from(match[2], 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(imageData);
      }
    }

    // Portada por defecto
    res.status(404).json({ error: 'Sin portada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener portada' });
  }
});

// GET /api/cuentos/:id/audio - Stream de audio
router.get('/:id/audio', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT archivo FROM cuentos WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cuento no encontrado' });

    const filePath = path.join(CUENTOS_DIR, rows[0].archivo);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo de audio no encontrado' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath);
    const mimeType = getAudioMimeType(ext);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al transmitir audio' });
  }
});

// POST /api/cuentos/:id/play - Incrementar contador de reproducciones
router.post('/:id/play', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE cuentos SET veces_reproducido = veces_reproducido + 1 WHERE id = $1 RETURNING veces_reproducido',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cuento no encontrado' });
    res.json({ veces_reproducido: rows[0].veces_reproducido });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar contador' });
  }
});

// POST /api/cuentos/scan - Escanear carpeta e importar archivos
router.post('/scan', async (req, res) => {
  try {
    if (!fs.existsSync(CUENTOS_DIR)) {
      return res.status(400).json({ error: `Carpeta no encontrada: ${CUENTOS_DIR}` });
    }

    const audioExtensions = /\.(flac|mp3|ogg|wav|m4a|aac)$/i;
    const files = fs.readdirSync(CUENTOS_DIR).filter((f) => audioExtensions.test(f));

    const { rows: existing } = await pool.query('SELECT archivo FROM cuentos');
    const existingFiles = new Set(existing.map((r) => r.archivo));

    const importados = [];
    const omitidos = [];

    for (const file of files) {
      if (existingFiles.has(file)) {
        omitidos.push(file);
        continue;
      }

      const filePath = path.join(CUENTOS_DIR, file);
      const meta = await extractMetadata(filePath);

      const { rows } = await pool.query(
        `INSERT INTO cuentos (titulo, archivo, portada, duracion, artista, album)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [meta.titulo, file, meta.portada, meta.duracion, meta.artista, meta.album]
      );

      importados.push({ id: rows[0].id, titulo: meta.titulo, archivo: file });
    }

    res.json({
      mensaje: `Escaneo completado. ${importados.length} importados, ${omitidos.length} omitidos.`,
      importados,
      omitidos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al escanear carpeta' });
  }
});

// POST /api/cuentos - Crear nuevo cuento
router.post('/', upload.fields([{ name: 'audio' }, { name: 'portada' }]), async (req, res) => {
  try {
    const { titulo, artista, album, descripcion } = req.body;
    let portadaBase64 = null;
    let archivo = req.body.archivo || null;
    let duracion = 0;

    if (req.files?.audio?.[0]) {
      const audioFile = req.files.audio[0];
      archivo = audioFile.originalname;
      const dest = path.join(CUENTOS_DIR, archivo);
      fs.writeFileSync(dest, audioFile.buffer);

      const meta = await extractMetadata(dest);
      duracion = meta.duracion;
      if (!portadaBase64 && meta.portada) portadaBase64 = meta.portada;
    }

    if (req.files?.portada?.[0]) {
      const imgFile = req.files.portada[0];
      const base64 = imgFile.buffer.toString('base64');
      portadaBase64 = `data:${imgFile.mimetype};base64,${base64}`;
    }

    if (!titulo || !archivo) {
      return res.status(400).json({ error: 'Título y archivo son requeridos' });
    }

    const { rows } = await pool.query(
      `INSERT INTO cuentos (titulo, archivo, portada, duracion, artista, album, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [titulo, archivo, portadaBase64, duracion, artista, album, descripcion]
    );

    const cuento = rows[0];
    delete cuento.portada;
    cuento.tiene_portada = !!portadaBase64;
    res.status(201).json(cuento);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cuento' });
  }
});

// PUT /api/cuentos/:id - Actualizar cuento
router.put('/:id', upload.single('portada'), async (req, res) => {
  try {
    const { titulo, artista, album, descripcion, activo } = req.body;
    let portadaBase64 = undefined;

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      portadaBase64 = `data:${req.file.mimetype};base64,${base64}`;
    }

    if (req.body.limpiar_portada === 'true') {
      portadaBase64 = null;
    }

    const setClauses = [];
    const values = [];
    let idx = 1;

    if (titulo !== undefined) { setClauses.push(`titulo = $${idx++}`); values.push(titulo); }
    if (artista !== undefined) { setClauses.push(`artista = $${idx++}`); values.push(artista); }
    if (album !== undefined) { setClauses.push(`album = $${idx++}`); values.push(album); }
    if (descripcion !== undefined) { setClauses.push(`descripcion = $${idx++}`); values.push(descripcion); }
    if (activo !== undefined) { setClauses.push(`activo = $${idx++}`); values.push(activo === 'true' || activo === true); }
    if (portadaBase64 !== undefined) { setClauses.push(`portada = $${idx++}`); values.push(portadaBase64); }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE cuentos SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id, titulo, archivo, duracion, veces_reproducido, artista, album, descripcion, activo, created_at, updated_at, (portada IS NOT NULL) as tiene_portada`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Cuento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar cuento' });
  }
});

// DELETE /api/cuentos/:id - Eliminar cuento
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM cuentos WHERE id = $1 RETURNING id, titulo', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cuento no encontrado' });
    res.json({ mensaje: 'Cuento eliminado', ...rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cuento' });
  }
});

module.exports = router;
