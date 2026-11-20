// Prijava putem Googlea: OpenID Connect, tok "authorization code" s PKCE-om (FZ-02).
// openid-client provjerava state, nonce, potpis i rok ID tokena.
const { Issuer, generators } = require('openid-client');

/**
 * @param google { clientId, clientSecret, povratnaAdresa }
 * @returns { ukljucen, adresaZaPrijavu(), obradiPovratak() } – rute ne ovise o biblioteci,
 *          pa se u testovima ovaj objekt lako zamijeni.
 */
function napraviGoogleAuth({ clientId, clientSecret, povratnaAdresa }) {
  if (!clientId || !clientSecret) return { ukljucen: false };

  let klijent; // Googleova konfiguracija se dohvaća jednom, pri prvoj prijavi
  async function dohvatiKlijenta() {
    if (!klijent) {
      const google = await Issuer.discover('https://accounts.google.com');
      klijent = new google.Client({
        client_id: clientId, client_secret: clientSecret,
        redirect_uris: [povratnaAdresa], response_types: ['code'],
      });
    }
    return klijent;
  }

  return {
    ukljucen: true,

    /**
     * Stvara jednokratne vrijednosti koje se čuvaju u sesiji do povratka s Googlea
     * i adresu na koju se korisnik preusmjerava.
     */
    async adresaZaPrijavu() {
      const k = await dohvatiKlijenta();
      const provjera = { state: generators.state(), nonce: generators.nonce(), codeVerifier: generators.codeVerifier() };
      const adresa = k.authorizationUrl({
        scope: 'openid email profile',
        state: provjera.state, nonce: provjera.nonce,
        code_challenge: generators.codeChallenge(provjera.codeVerifier), code_challenge_method: 'S256',
        prompt: 'select_account',
      });
      return { adresa, provjera };
    },

    /** Mijenja kod s povratne adrese za tokene i vraća podatke iz ID tokena (claims). */
    async obradiPovratak(req, provjera) {
      const k = await dohvatiKlijenta();
      const tokeni = await k.callback(povratnaAdresa, k.callbackParams(req), {
        state: provjera.state, nonce: provjera.nonce, code_verifier: provjera.codeVerifier,
      });
      return tokeni.claims();
    },
  };
}

module.exports = { napraviGoogleAuth };
