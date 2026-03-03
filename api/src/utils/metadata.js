const mm = require('music-metadata');
const path = require('path');
const fs = require('fs');

const extractMetadata = async (filePath) => {
  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    const common = metadata.common;
    const format = metadata.format;

    let portadaBase64 = null;

    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      const base64 = Buffer.from(pic.data).toString('base64');
      portadaBase64 = `data:${pic.format};base64,${base64}`;
    }

    return {
      titulo: common.title || path.basename(filePath, path.extname(filePath)),
      artista: common.artist || common.albumartist || null,
      album: common.album || null,
      duracion: Math.round(format.duration || 0),
      portada: portadaBase64,
    };
  } catch (err) {
    console.error(`Error leyendo metadata de ${filePath}:`, err.message);
    const name = path.basename(filePath, path.extname(filePath));
    return {
      titulo: name,
      artista: null,
      album: null,
      duracion: 0,
      portada: null,
    };
  }
};

const getAudioMimeType = (ext) => {
  const types = {
    '.flac': 'audio/flac',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
  };
  return types[ext.toLowerCase()] || 'audio/octet-stream';
};

module.exports = { extractMetadata, getAudioMimeType };
