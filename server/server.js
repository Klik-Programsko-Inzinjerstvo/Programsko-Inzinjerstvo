const express = require('express');
const path = require('path');
const mock = require('./data/mock');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const kolacici = (req) =>
  Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((c) => {
    const [k, ...v] = c.trim().split('=');
    return [k, decodeURIComponent(v.join('='))];
  }));

// DEMO prijava preko kolačića; zamijeniti OAuth 2.0 tokenima.
app.use((req, res, next) => {
  const c = kolacici(req);
  res.locals.user = c.sw_user ? { ime: c.sw_user, uloga: c.sw_uloga || 'korisnik' } : null;
  res.locals.path = req.path;
  res.locals.neprocitane = mock.obavijesti.filter((o) => !o.procitano).length;
  next();
});

const trebaPrijavu = (req, res, next) =>
  res.locals.user ? next() : res.redirect('/prijava?povratak=' + encodeURIComponent(req.originalUrl));
const trebaUlogu = (...uloge) => (req, res, next) =>
  uloge.includes(res.locals.user.uloga) ? next() : res.status(403).render('greska', { title: 'Nema pristupa', poruka: 'Za ovu stranicu potrebna je druga uloga.' });

app.get('/', (req, res) =>
  res.render('index', { title: 'Pregled', ...mock, potvrdene: mock.prijave.filter((p) => p.status === 'potvrđena') }));
app.get('/prognoza', (req, res) => res.render('prognoza', { title: 'Prognoza', ...mock }));

app.get('/prijava', (req, res) => res.render('prijava', { title: 'Prijava', povratak: req.query.povratak || '/' }));
app.post('/prijava', (req, res) => {
  const { korisnik = 'gost', uloga = 'korisnik', povratak = '/' } = req.body;
  res.cookie('sw_user', korisnik, { httpOnly: true });
  res.cookie('sw_uloga', uloga, { httpOnly: true });
  res.redirect(povratak.startsWith('/') ? povratak : '/');
});
app.get('/registracija', (req, res) => res.render('registracija', { title: 'Registracija' }));
app.post('/registracija', (req, res) => res.redirect('/prijava'));
app.get('/odjava', (req, res) => { res.clearCookie('sw_user'); res.clearCookie('sw_uloga'); res.redirect('/'); });

app.use(['/prijave', '/dogadaji', '/lokacije', '/obavijesti', '/profil', '/statistika', '/moderacija', '/admin'], trebaPrijavu);

app.get('/prijave', (req, res) =>
  res.render('prijave', { title: 'Prijave', prijave: mock.prijave.filter((p) => p.status !== 'odbijena'), vrste: req.query.vrsta || '' }));
app.get('/prijave/nova', (req, res) => res.render('prijava_nova', { title: 'Nova prijava' }));
app.post('/prijave/nova', (req, res) => res.redirect('/prijave'));
app.get('/dogadaji/:id', (req, res) => {
  const d = mock.dogadaji.find((x) => x.id === +req.params.id);
  if (!d) return res.status(404).render('greska', { title: 'Nije pronađeno', poruka: 'Događaj ne postoji.' });
  res.render('dogadaj', { title: d.naziv, d, prijave: mock.prijave.filter((p) => d.prijava.includes(p.id)) });
});
app.get('/lokacije', (req, res) => res.render('lokacije', { title: 'Lokacije', ...mock }));
app.get('/obavijesti', (req, res) => res.render('obavijesti', { title: 'Obavijesti', ...mock }));
app.get('/profil', (req, res) => res.render('profil', { title: 'Profil' }));
app.get('/statistika', (req, res) => res.render('statistika', { title: 'Statistika', ...mock }));
app.get('/statistika.csv', trebaPrijavu, (req, res) => {
  const red = mock.statistika.poRegijama.map(([r, n]) => `${r};${n}`).join('\n');
  res.type('text/csv').send('regija;broj_prijava\n' + red);
});
app.get('/moderacija', trebaUlogu('moderator', 'administrator'), (req, res) =>
  res.render('moderacija', { title: 'Moderacija', cekanje: mock.prijave.filter((p) => ['predana', 'na čekanju'].includes(p.status)) }));
app.get('/admin', trebaUlogu('administrator'), (req, res) => res.render('admin', { title: 'Administracija', ...mock }));

app.use((req, res) => res.status(404).render('greska', { title: 'Nije pronađeno', poruka: 'Stranica ne postoji.' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`StormWatch: http://localhost:${PORT}`));
