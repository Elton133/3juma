/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONESIGNAL_APP_ID: string;
  readonly VITE_ONESIGNAL_SAFARI_WEB_ID?: string;
  /** Set to "true" to show OneSignal subscription bell (extra startup work). */
  readonly VITE_ONESIGNAL_NOTIFY_BELL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
