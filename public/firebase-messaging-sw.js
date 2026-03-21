importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// To use this payload, you must pass the identical configs from .env
firebase.initializeApp({
  apiKey: "SET_VIA_ENV_OR_SERVER", 
  authDomain: "SET_VIA_ENV_OR_SERVER",
  projectId: "SET_VIA_ENV_OR_SERVER",
  storageBucket: "SET_VIA_ENV_OR_SERVER",
  messagingSenderId: "SET_VIA_ENV_OR_SERVER",
  appId: "SET_VIA_ENV_OR_SERVER"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// PWA Offline Caching
const CACHE_NAME = 'bus-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/login',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response; // Return strictly cached value if offline
        return fetch(event.request);
      })
  );
});
