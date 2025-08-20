// --- Utili ---
function log(...args){ console.log('[APP]', ...args); }
function error(...args){ console.error('[APP]', ...args); }

// --- Mappa ---
let map, userMarker;

// Attendi che Leaflet sia disponibile
function initMap(){
  if (typeof L === 'undefined') {
    error('Leaflet non caricato: controlla la rete o il tag <script> di Leaflet.');
    return;
  }

  // Centro su Vienna
  map = L.map('map').setView([48.2082, 16.3738], 14);

  // Tile OSM
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Hotel
  const hotel = { name: 'Boutique Hotel Das Tigra', lat: 48.2120, lng: 16.3685 };
  L.marker([hotel.lat, hotel.lng]).addTo(map).bindPopup(`<b>${hotel.name}</b>`);

  // Geolocalizzazione (solo per il marker, la mappa si vede comunque)
  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(pos=>{
      const { latitude: lat, longitude: lng } = pos.coords;
      if (!userMarker) {
        userMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
            iconSize: [30, 30]
          })
        }).addTo(map).bindPopup('Sei qui');
        // centra all'inizio
        map.setView([lat, lng], 14);
      } else {
        userMarker.setLatLng([lat, lng]);
      }
    }, err=>{
      log('GPS non disponibile o negato:', err.message);
    }, { enableHighAccuracy:true });
  } else {
    log('Geolocalizzazione non supportata dal browser.');
  }

  // Espone funzioni globali usate dai pulsanti
  window.goToHotel = function(){
    if (!userMarker) { alert('Posizione utente non trovata!'); return; }
    const p = userMarker.getLatLng();
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${p.lat},${p.lng}&destination=48.2120,16.3685`, '_blank');
  };

  // TTS controls
  window.pauseSpeech = ()=> window.speechSynthesis.pause();
  window.resumeSpeech = ()=> window.speechSynthesis.resume();
  window.stopSpeech   = ()=> window.speechSynthesis.cancel();

  // Carica POI
  loadPOI();
}

// --- Guida vocale da Wikipedia ---
let utterance;
function speakText(text){
  try {
    window.speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    window.speechSynthesis.speak(utterance);
  } catch(e){
    error('TTS error:', e);
  }
}
function startGuide(wikiPage){
  fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiPage)}`)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
      if (data && data.extract) {
        speakText(data.extract);
      } else {
        alert('Descrizione non trovata su Wikipedia.');
      }
    })
    .catch(e => error('Wikipedia fetch error:', e));
}

// --- POI ---
function loadPOI(){
  fetch('poi.json', { cache: 'no-store' })
    .then(r=>{
      if(!r.ok) throw new Error(`poi.json HTTP ${r.status}`);
      return r.json();
    })
    .then(list=>{
      log(`POI caricati: ${list.length}`);
      list.forEach(poi=>{
        const m = L.marker([poi.lat, poi.lng]).addTo(map);
        m.bindPopup(`
          <h3 style="margin:4px 0">${poi.name}</h3>
          <img src="${poi.image}" alt="${poi.name}" style="width:200px;max-width:90%;border-radius:6px"><br>
          <small><b>Costo:</b> ${poi.ticket || '—'}</small>
          <p style="margin:6px 0;">
            <button onclick="navigateTo(${poi.lat},${poi.lng})">🧭 Vai qui</button>
            <button onclick="startGuide('${(poi.wiki||'').replace(/'/g, "\\'")}')">🎤 Ascolta la guida</button>
          </p>
          <p style="margin:4px 0;">
            <a href="https://it.wikipedia.org/wiki/${encodeURIComponent(poi.wiki)}" target="_blank" rel="noopener">Apri su Wikipedia</a>
          </p>
        `);
      });
    })
    .catch(e=>{
      error('Errore nel caricamento di poi.json:', e);
      // la mappa resta visibile; solo i POI mancano
    });
}

// navigazione verso singolo POI
window.navigateTo = function(lat, lng){
  if (!userMarker) { alert('Posizione utente non trovata!'); return; }
  const p = userMarker.getLatLng();
  window.open(`https://www.google.com/maps/dir/?api=1&origin=${p.lat},${p.lng}&destination=${lat},${lng}`, '_blank');
};

// Avvio
document.addEventListener('DOMContentLoaded', initMap);
