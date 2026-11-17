// sw.js — "Service worker" de EcoCaneca: hace que la app abra aunque no haya internet.
//
// Guarda tres cosas en el dispositivo:
//   1. Los archivos de la app (HTML, estilos, JavaScript, catálogo de vectores, iconos).
//   2. La librería Transformers.js que se descarga de la CDN jsDelivr.
//   3. El modelo de IA lo guarda la propia librería en su caché "transformers-cache".
//
// Estrategia: para los archivos de la app se intenta primero la red (así siempre ves la última
// versión) y, si no hay conexión, se usa la copia guardada.

const VERSION = 'v2';
const CACHE_APP = 'ecocaneca-app-' + VERSION;
const CACHE_CDN = 'ecocaneca-cdn-' + VERSION;

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/estilos.css',
  './js/app.js',
  './js/camara.js',
  './js/clasificador.js',
  './js/config.js',
  './js/graficos.js',
  './js/memoria.js',
  './js/residuos.js',
  './js/voz.js',
  './datos/vectores-texto.json',
  './iconos/icono.svg',
  './iconos/icono-180.png',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-maskable-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_APP)
      .then((cache) => Promise.all(ARCHIVOS.map((archivo) => cache.add(archivo).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((nombre) => nombre.startsWith('ecocaneca-') && nombre !== CACHE_APP && nombre !== CACHE_CDN)
            .map((nombre) => caches.delete(nombre)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function primeroRed(peticion) {
  const cache = await caches.open(CACHE_APP);
  try {
    // 'no-cache' obliga a preguntarle al servidor si hay versión nueva (GitHub Pages guarda copias 10 min).
    const respuesta = await fetch(peticion, { cache: 'no-cache' });
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch (error) {
    const guardada = await cache.match(peticion, { ignoreSearch: true });
    if (guardada) return guardada;
    if (peticion.mode === 'navigate') {
      const inicio = await cache.match('./index.html');
      if (inicio) return inicio;
    }
    throw error;
  }
}

async function primeroCache(peticion) {
  const cache = await caches.open(CACHE_CDN);
  const guardada = await cache.match(peticion);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok) cache.put(peticion, respuesta.clone());
  return respuesta;
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin === self.location.origin) {
    evento.respondWith(primeroRed(peticion));
  } else if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('@huggingface/transformers')) {
    // La librería lleva la versión en la dirección, así que nunca cambia: basta con guardarla una vez.
    evento.respondWith(primeroCache(peticion));
  }
  // Todo lo demás (el modelo en huggingface.co) lo maneja y lo guarda Transformers.js.
});
