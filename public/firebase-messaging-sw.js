// Firebase Cloud Messaging Service Worker
// Give this file to the public/ folder so it's served at the root.

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBaJrzraUUmPt-OWwggTRswruE85Wsnhuo",
  authDomain: "juma-de6c3.firebaseapp.com",
  projectId: "juma-de6c3",
  storageBucket: "juma-de6c3.firebasestorage.app",
  messagingSenderId: "132268271024",
  appId: "1:132268271024:web:bf3b732b1c54cce629a275",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '3juma Notification';
  const options = {
    body: payload.notification?.body || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  };
  self.registration.showNotification(title, options);
});
