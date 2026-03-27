// Firebase Cloud Messaging Service Worker
// Give this file to the public/ folder so it's served at the root.

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
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
