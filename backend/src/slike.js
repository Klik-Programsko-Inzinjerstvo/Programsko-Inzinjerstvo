// Spremanje fotografija prijava na Cloudinary (u bazi ostaje samo poveznica).
// Ako CLOUDINARY_URL nije postavljen, prijave se spremaju bez fotografija.
const crypto = require('crypto');

const MAPA = 'stormwatch/prijave';

/** @param cloudinaryUrl oblik cloudinary://API_KEY:API_SECRET@CLOUD_NAME (Cloudinary → API Keys) */
function napraviPohranuSlika(cloudinaryUrl, fetchFn = fetch) {
  const m = /^cloudinary:\/\/(\d+):([^@]+)@([\w-]+)$/.exec(String(cloudinaryUrl || '').trim());
  if (!m) return { ukljuceno: false, spremi: async () => [] };
  const [, kljuc, tajna, oblak] = m;

  async function spremiJednu(datoteka) {
    const timestamp = Math.floor(Date.now() / 1000);
    // potpis zahtjeva po Cloudinaryjevim pravilima: parametri abecedno + tajni ključ
    const potpis = crypto.createHash('sha1').update(`folder=${MAPA}&timestamp=${timestamp}${tajna}`).digest('hex');
    const forma = new FormData();
    forma.append('file', new Blob([datoteka.buffer], { type: datoteka.mimetype }), datoteka.originalname);
    forma.append('api_key', kljuc);
    forma.append('timestamp', String(timestamp));
    forma.append('folder', MAPA);
    forma.append('signature', potpis);

    const odgovor = await fetchFn(`https://api.cloudinary.com/v1_1/${oblak}/image/upload`, {
      method: 'POST', body: forma, signal: AbortSignal.timeout(30_000),
    });
    const json = await odgovor.json().catch(() => ({}));
    if (!odgovor.ok) throw new Error(`Cloudinary: ${json.error?.message || `HTTP ${odgovor.status}`}`);
    return json.secure_url;
  }

  return {
    ukljuceno: true,
    /** Sprema datoteke redom i vraća njihove URL-ove. */
    async spremi(datoteke) {
      const urlovi = [];
      for (const d of datoteke) urlovi.push(await spremiJednu(d));
      return urlovi;
    },
  };
}

module.exports = { napraviPohranuSlika };
