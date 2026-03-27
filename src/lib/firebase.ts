import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase configuration — replace with your project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBaJrzraUUmPt-OWwggTRswruE85Wsnhuo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'juma-de6c3.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'juma-de6c3',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'juma-de6c3.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '132268271024',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:132268271024:web:bf3b732b1c54cce629a275',
};

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

const isConfigured = () => !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

export const initFirebase = () => {
  if (!isConfigured()) {
    console.warn('[3juma] Firebase not configured — push notifications disabled. Set VITE_FIREBASE_* env vars.');
    return;
  }
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (err) {
    console.error('[3juma] Firebase init failed:', err);
  }
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
      });
      console.log('[3juma] FCM Token:', token);
      return token;
    }
    return null;
  } catch (err) {
    console.error('[3juma] Notification permission error:', err);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;
  onMessage(messaging, callback);
};
