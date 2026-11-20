// Pokretanje poslužitelja: npm start (iz backend/) ili npm start (iz korijena repozitorija).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const db = require('../../database/src');
const { ucitajKonfig } = require('./konfig');
const { napraviAplikaciju } = require('./app');
const { napraviGoogleAuth } = require('./auth');
const { napraviPohranuSlika } = require('./slike');
const { pokreniUvoz } = require('./dhmz');

const konfig = ucitajKonfig();
const auth = napraviGoogleAuth(konfig.google);
const slike = napraviPohranuSlika(konfig.cloudinaryUrl);
const app = napraviAplikaciju({ db, auth, slike, konfig });

app.listen(konfig.port, () => {
  console.log(`StormWatch radi na ${konfig.javnaAdresa}`);
  if (!auth.ukljucen) console.warn('Google prijava nije postavljena (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).');
  if (!slike.ukljuceno) console.warn('Pohrana slika nije postavljena (CLOUDINARY_URL); prijave se spremaju bez fotografija.');
  if (konfig.demoPrijava) console.warn('Uključena je demo prijava (DEMO_PRIJAVA=true) – samo za lokalni razvoj.');
});

if (konfig.dhmz.ukljuceno) pokreniUvoz({ db, adresa: konfig.dhmz.adresa, intervalMin: konfig.dhmz.intervalMin });
