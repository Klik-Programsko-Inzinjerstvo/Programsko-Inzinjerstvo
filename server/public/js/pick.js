const map = L.map('pick').setView([45.4, 16.3], 7);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
let marker;
function set(lat, lng) {
  marker ? marker.setLatLng([lat, lng]) : (marker = L.marker([lat, lng]).addTo(map));
  document.querySelector('[name=lat]').value = lat; document.querySelector('[name=lng]').value = lng;
  document.getElementById('coords').textContent = `Odabrano: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
map.on('click', e => set(e.latlng.lat, e.latlng.lng));
document.getElementById('gps').addEventListener('click', () => navigator.geolocation?.getCurrentPosition(
  pos => { set(pos.coords.latitude, pos.coords.longitude); map.setView([pos.coords.latitude, pos.coords.longitude], 12); },
  () => { document.getElementById('coords').textContent = 'GPS nije dostupan. Odaberite lokaciju na karti.'; }));
