{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Nombre del cach\'e9 para esta versi\'f3n de la aplicaci\'f3n\
const CACHE_NAME = 'estadisticas-v1';\
\
// Lista de URLs que queremos cachear.\
// Aseg\'farate de incluir todos los archivos necesarios para que la app funcione offline.\
const urlsToCache = [\
  '/', // Importante para la ra\'edz del sitio\
  '/index.html',\
  '/style.css',\
  '/script.js',\
  '/manifest.json',\
  '/icon-192x192.png', // Aseg\'farate de que estos iconos existan en tu carpeta\
  '/icon-512x512.png'  // Aseg\'farate de que estos iconos existan en tu carpeta\
  // Si usas Google Fonts directamente en tu CSS, tambi\'e9n deber\'edas cachearlas.\
  // En tu caso, est\'e1s usando @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');\
  // Por lo tanto, tambi\'e9n deber\'edas a\'f1adir esta URL a la lista:\
  // 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'\
];\
\
// Evento 'install': se dispara cuando el Service Worker se instala por primera vez.\
// Aqu\'ed abrimos el cach\'e9 y a\'f1adimos todos los recursos esenciales.\
self.addEventListener('install', event => \{\
  console.log('Service Worker: Instalando...');\
  event.waitUntil(\
    caches.open(CACHE_NAME)\
      .then(cache => \{\
        console.log('Service Worker: Cache abierto, a\'f1adiendo URLs...');\
        return cache.addAll(urlsToCache);\
      \})\
      .catch(err => console.error('Service Worker: Fallo al cachear URLs', err))\
  );\
\});\
\
// Evento 'fetch': se dispara cada vez que el navegador solicita un recurso (red).\
// Aqu\'ed interceptamos las solicitudes y las servimos desde el cach\'e9 si est\'e1n disponibles,\
// o desde la red si no.\
self.addEventListener('fetch', event => \{\
  // Ignoramos solicitudes que no sean de tipo 'navigate' (por ejemplo, peticiones de extensi\'f3n, etc.)\
  // Esta condici\'f3n es importante para evitar errores con peticiones que no son de la app.\
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || event.request.destination === 'script' || event.request.destination === 'style' || event.request.destination === 'image') \{\
      event.respondWith(\
        caches.match(event.request)\
          .then(response => \{\
            // Si el recurso est\'e1 en cach\'e9, lo servimos desde ah\'ed.\
            if (response) \{\
              console.log('Service Worker: Sirviendo desde cach\'e9:', event.request.url);\
              return response;\
            \}\
            // Si no est\'e1 en cach\'e9, intentamos obtenerlo de la red.\
            console.log('Service Worker: Obteniendo de la red:', event.request.url);\
            return fetch(event.request)\
              .then(networkResponse => \{\
                // Si obtenemos una respuesta v\'e1lida de la red, la cacheamos para futuras visitas.\
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') \{\
                  return networkResponse;\
                \}\
                const responseToCache = networkResponse.clone();\
                caches.open(CACHE_NAME)\
                  .then(cache => \{\
                    cache.put(event.request, responseToCache);\
                  \});\
                return networkResponse;\
              \})\
              .catch(() => \{\
                // Si la red falla y no hay nada en cach\'e9, podemos servir una p\'e1gina offline.\
                // Aqu\'ed podr\'edas servir una p\'e1gina HTML simple de "offline" si la creas.\
                // return caches.match('/offline.html');\
                console.warn('Service Worker: Fallo en red y no hay cach\'e9 para', event.request.url);\
                // O simplemente retornar un error si no quieres una p\'e1gina offline espec\'edfica\
                return new Response('<h1>Aplicaci\'f3n Offline</h1><p>No tienes conexi\'f3n a internet y el contenido no est\'e1 disponible sin conexi\'f3n.</p>', \{\
                    headers: \{ 'Content-Type': 'text/html' \}\
                \});\
              \});\
          \})\
      );\
  \}\
\});\
\
// Evento 'activate': se dispara cuando un nuevo Service Worker toma el control.\
// Aqu\'ed limpiamos los cach\'e9s antiguos para asegurarnos de que solo se use la versi\'f3n actual.\
self.addEventListener('activate', event => \{\
  console.log('Service Worker: Activando...');\
  const cacheWhitelist = [CACHE_NAME]; // Solo queremos mantener el cach\'e9 actual\
\
  event.waitUntil(\
    caches.keys().then(cacheNames => \{\
      return Promise.all(\
        cacheNames.map(cacheName => \{\
          if (cacheWhitelist.indexOf(cacheName) === -1) \{\
            console.log('Service Worker: Borrando cach\'e9 antiguo:', cacheName);\
            return caches.delete(cacheName);\
          \}\
        \})\
      );\
    \})\
  );\
\});}