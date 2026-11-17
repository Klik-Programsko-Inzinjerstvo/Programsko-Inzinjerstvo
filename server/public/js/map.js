// Tekst iz prijava upisuju korisnici, pa se escapea prije umetanja u HTML skočnog prozora.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const map = L.map('map').setView([45.4, 16.3], 7);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
const layers = {
  postaje: L.layerGroup(SW.postaje.map(p => L.marker([p.lat, p.lng]).bindPopup(
    `<b>${esc(p.ime)}</b><br>${esc(p.temp)} °C, vlaga ${esc(p.vlaga)} %<br>tlak ${esc(p.tlak)} hPa<br>vjetar ${esc(p.vjetarSmjer)} ${esc(p.vjetarBrzina)} km/h`))),
  prijave: L.layerGroup(SW.prijave.map(p => L.circleMarker([p.lat, p.lng], { radius: 9, color: '#9b1c1c', fillColor: '#e5484d', fillOpacity: .8 })
    .bindPopup(`<b>${esc(p.vrsta)}, ${esc(p.mjesto)}</b><br>${esc(p.vrijeme)}<br>vjerodostojnost ${esc(p.vjerodostojnost)} %`))),
};
Object.values(layers).forEach(l => l.addTo(map));
document.querySelectorAll('[data-layer]').forEach(cb => cb.addEventListener('change', () =>
  cb.checked ? layers[cb.dataset.layer].addTo(map) : map.removeLayer(layers[cb.dataset.layer])));
