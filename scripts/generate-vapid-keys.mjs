#!/usr/bin/env node
/**
 * Uses the `web-push` package to generate a VAPID key pair.
 * Public key → VITE_VAPID_PUBLIC_KEY (browser)
 * Private key → server / Edge Function only (never VITE_*)
 */
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();
console.log('');
console.log('Add to .env (client-safe):');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log('');
console.log('Add to server / Supabase secrets only:');
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('');
console.log('Optional contact for push services (set in your sender):');
console.log('VAPID_SUBJECT=mailto:you@yourdomain.com');
console.log('');
