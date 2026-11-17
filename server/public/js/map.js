const map = L.map('map').setView([45.4, 16.3], 7);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
const layers = {
  postaje: L.layerGroup(SW.postaje.map(p => L.marker([p.lat, p.lng]).bindPopup(
    `<b>${p.ime}</b><br>${p.temp} °C, vlaga ${p.vlaga} %<br>tlak ${p.tlak} hPa<br>vjetar ${p.vjetarSmjer} ${p.vjetarBrzina} km/h`))),
  prijave: L.layerGroup(SW.prijave.map(p => L.circleMarker([p.lat, p.lng], { radius: 9, color: '#9b1c1c', fillColor: '#e5484d', fillOpacity: .8 })
    .bindPopup(`<b>${p.vrsta}, ${p.mjesto}</b><br>${p.vrijeme}<br>vjerodostojnost ${p.vjerodostojnost} %`))),
};
Object.values(layers).forEach(l => l.addTo(map));
document.querySelectorAll('[data-layer]').forEach(cb => cb.addEventListener('change', () =>
  cb.checked ? layers[cb.dataset.layer].addTo(map) : map.removeLayer(layers[cb.dataset.layer])));
