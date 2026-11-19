// service-worker.js — caché de la aplicación para funcionar sin internet
// (RNF-06, RNF-08). Estrategia: primero la red y, si falla, la copia en caché.
// Así, con internet la app siempre está al día, y sin internet sigue
// funcionando completa con la última versión descargada.

const VERSION = 'peh-toolkit-v2';

// Todo lo que la app necesita para funcionar sin conexión.
// Rutas relativas para que sirvan igual en local y en GitHub Pages.
const ARCHIVOS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './js/motor.js',
  './js/fisica.js',
  './js/tactil.js',
  './js/almacen.js',
  './js/banco.js',
  './js/exportar.js',
  './js/pantallas/crear-sesion.js',
  './js/pantallas/sesion.js',
  './js/pantallas/resultado.js',
  './js/pantallas/historial.js',
  './js/pantallas/acerca.js',
  './js/pantallas/banco-preguntas.js',
  './data/banco.json',
  './data/microguias.json',
  './manifest.webmanifest',
  './iconos/icono.svg',
];

// Al instalarse, guarda una copia de todos los archivos de la app.
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting()),
  );
});

// Al activarse, borra las cachés de versiones anteriores.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((clave) => clave !== VERSION).map((clave) => caches.delete(clave))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') {
    return;
  }

  evento.respondWith(
    // «no-cache» obliga a revalidar con el servidor: evita que el navegador
    // sirva módulos JS viejos de su caché HTTP (el problema anotado en PROGRESO.md).
    fetch(evento.request, { cache: 'no-cache' })
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(evento.request, copia));
        }
        return respuesta;
      })
      .catch(() => caches.match(evento.request, { ignoreSearch: true })),
  );
});
