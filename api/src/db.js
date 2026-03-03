const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS cuentos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(500) NOT NULL,
        archivo VARCHAR(1000) NOT NULL,
        portada TEXT,
        duracion INTEGER DEFAULT 0,
        veces_reproducido INTEGER DEFAULT 0,
        artista VARCHAR(255),
        album VARCHAR(255),
        descripcion TEXT,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_cuentos_updated_at ON cuentos;
      CREATE TRIGGER update_cuentos_updated_at
        BEFORE UPDATE ON cuentos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Base de datos inicializada correctamente');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
