// Inizializza la mappa
const map = L.map('map').setView([48.2082, 16.3738], 14);

// Layer OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Posizione utente in tempo reale
let userMarker;
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if (!userMarker) {
      userMarker = L.marker([lat, lng], {icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
        iconSize: [30, 30]
      })}).addTo(map).bindPopup("Sei qui");
      map.setView([lat, lng], 14);
    } else {
      userMarker.setLatLng([lat, lng]);
    }
  });
}

// Hotel
const hotel = {
  name: "Boutique Hotel Das Tigra",
  lat: 48.2120,
  lng: 16.3685
};
L.marker([hotel.lat, hotel.lng]).addTo(map)
  .bindPopup(`<b>${hotel.name}</b>`);

// Pulsante navigazione verso hotel
function goToHotel() {
  if (userMarker) {
    const coords = userMarker.getLatLng();
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${hotel.lat},${hotel.lng}`, "_blank");
  } else {
    alert("Posizione utente non trovata!");
  }
}

// --- Guida vocale ---
let utterance;
function speakText(text){
  speechSynthesis.cancel();
  utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}
function pauseSpeech(){ speechSynthesis.pause(); }
function resumeSpeech(){ speechSynthesis.resume(); }
function stopSpeech(){ speechSynthesis.cancel(); }

// --- Caricamento POI ---
fetch('poi.json')
  .then(r => r.json())
  .then(data => {
    data.forEach(poi => {
      const marker = L.marker([poi.lat, poi.lng]).addTo(map);
      marker.bindPopup(`
        <h3>${poi.name}</h3>
        <img src="${poi.image}" alt="${poi.name}" style="width:200px;">
        <p><b>Costo:</b> ${poi.ticket}</p>
        <p>
          <button onclick="navigateTo(${poi.lat},${poi.lng})">🧭 Vai qui</button>
          <button onclick="startGuide('${poi.wiki}')">🎤 Ascolta la guida</button>
        </p>
      `);
    });
  });

// --- Navigazione verso attrazione ---
function navigateTo(lat, lng) {
  if (userMarker) {
    const coords = userMarker.getLatLng();
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${lat},${lng}`, "_blank");
  } else {
    alert("Posizione utente non trovata!");
  }
}

// --- Descrizione da Wikipedia ---
function startGuide(wikiPage) {
  fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${wikiPage}`)
    .then(r => r.json())
    .then(data => {
      if (data.extract) {
        speakText(data.extract);
      } else {
        alert("Descrizione non trovata");
      }
    });
}
