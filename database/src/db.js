// Zajednički pool konekcija prema PostgreSQL-u.
// Adresa baze dolazi iz varijable okoline DATABASE_URL (datoteka .env lokalno,
// postavke servisa na Renderu).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const { Pool, types } = require('pg');

// pg po defaultu vraća bigint i numeric kao tekst ('27.3'); naši id-evi i
// mjerenja stanu u JS broj, pa ih vraćamo kao brojeve.
types.setTypeParser(types.builtins.INT8, Number);
types.setTypeParser(types.builtins.NUMERIC, parseFloat);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nije postavljen. Kopiraj .env.example u .env i upiši adresu baze.');
}

const lokalna = /@(localhost|127\.0\.0\.1)(:|\/)/.test(process.env.DATABASE_URL);
const ssl = process.env.DATABASE_SSL === 'false' || lokalna ? false : { rejectUnauthorized: false };

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl, max: 10 });

// Pokreće funkciju unutar transakcije; ako baci grešku, sve se poništava.
async function transakcija(fn) {
  const klijent = await pool.connect();
  try {
    await klijent.query('BEGIN');
    const rezultat = await fn(klijent);
    await klijent.query('COMMIT');
    return rezultat;
  } catch (e) {
    await klijent.query('ROLLBACK');
    throw e;
  } finally {
    klijent.release();
  }
}

module.exports = { pool, transakcija };
