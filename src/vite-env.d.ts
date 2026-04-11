/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Canonical origin for SEO meta, e.g. https://ejuma.com */
  readonly VITE_SITE_URL?: string;
  /** Absolute URL for default Open Graph / Twitter image */
  readonly VITE_OG_IMAGE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_RESEND_API_KEY?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  readonly VITE_ONESIGNAL_APP_ID?: string;
  readonly VITE_ONESIGNAL_SAFARI_WEB_ID?: string;
  readonly VITE_ONESIGNAL_NOTIFY_BELL?: string;
  /** VAPID public key for Web Push (pair from `npm run vapid:keys`; private key stays on server only). */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
