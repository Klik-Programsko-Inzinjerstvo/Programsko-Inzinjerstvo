// Ulazna točka paketa: const db = require('../database/src');
const { pool, transakcija } = require('./db');
const upiti = require('./upiti');

module.exports = { pool, transakcija, ...upiti };
