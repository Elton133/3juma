import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase — set VITE_FIREBASE_* in `.env` (do not commit real keys as fallbacks)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
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
