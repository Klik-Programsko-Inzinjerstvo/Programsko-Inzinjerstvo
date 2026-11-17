// Postavke iz varijabli okoline (lokalno backend/.env, na Renderu postavke servisa).
// Tajni ključevi nikad nisu u repozitoriju (NFZ-04).
function ucitajKonfig(env = process.env) {
  const produkcija = env.NODE_ENV === 'production';
  const port = Number(env.PORT) || 3000;
  // Render sam postavlja RENDER_EXTERNAL_URL (npr. https://stormwatch.onrender.com)
  const javnaAdresa = (env.JAVNA_ADRESA || env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).replace(/\/+$/, '');

  if (produkcija && !env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET mora biti postavljen u produkciji.');
  }

  return {
    produkcija,
    port,
    javnaAdresa,
    tajnaSesije: env.SESSION_SECRET || 'samo-za-lokalni-razvoj',
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      povratnaAdresa: `${javnaAdresa}/auth/google/povratak`,
    },
    cloudinaryUrl: env.CLOUDINARY_URL,
    dhmz: {
      ukljuceno: env.DHMZ_UVOZ !== 'false',
      adresa: env.DHMZ_ADRESA || 'https://vrijeme.hr/hrvatska_n.xml',
      intervalMin: Number(env.DHMZ_INTERVAL_MIN) || 30,
    },
    // brza prijava bez Googlea, samo za lokalni razvoj i testiranje uloga
    demoPrijava: !produkcija && env.DEMO_PRIJAVA === 'true',
  };
}

module.exports = { ucitajKonfig };
