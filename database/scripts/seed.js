// Upisuje testne podatke iz seed/seed.sql u bazu iz DATABASE_URL.
// Briše postojeće korisnike, postaje, mjerenja, upozorenja i prijave!
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

if (process.env.NODE_ENV === 'production') {
  console.error('Seed se ne pokreće u produkciji (NODE_ENV=production).');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'seed', 'seed.sql'), 'utf8');

pool.query(sql)
  .then(() => console.log('Testni podaci upisani.'))
  .catch((e) => { console.error('Greška pri upisu testnih podataka:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());
