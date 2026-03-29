#!/usr/bin/env node
/**
 * Send a test notification using the `web-push` package (Node).
 *
 * 1. Subscribe in the app (worker dashboard → Enable alerts).
 * 2. Copy a row from Supabase `push_subscriptions` as JSON, or save PushSubscriptionJSON from DevTools.
 * 3. Run:
 *    VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... node scripts/send-web-push.mjs ./subscription.json
 *
 * subscription.json: Web Push JSON *or* one Supabase row export:
 *   { "endpoint", "keys": { "p256dh", "auth" } }  OR  { "endpoint", "p256dh", "auth" }
 */
import fs from 'node:fs';
import webPush from 'web-push';

const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@localhost';

const path = process.argv[2];
if (!publicKey || !privateKey || !path) {
  console.error('Usage: VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... node scripts/send-web-push.mjs <subscription.json>');
  process.exit(1);
}

const raw = fs.readFileSync(path, 'utf8');
const parsed = JSON.parse(raw);

/** Web Push shape, or a flat row from Supabase `push_subscriptions`. */
function toPushSubscription(obj) {
  if (obj?.endpoint && obj?.keys?.p256dh && obj?.keys?.auth) return obj;
  if (obj?.endpoint && obj?.p256dh && obj?.auth) {
    return { endpoint: obj.endpoint, keys: { p256dh: obj.p256dh, auth: obj.auth } };
  }
  throw new Error('Expected { endpoint, keys: { p256dh, auth } } or { endpoint, p256dh, auth }');
}

const subscription = toPushSubscription(parsed);

webPush.setVapidDetails(subject, publicKey, privateKey);

const payload = JSON.stringify({
  title: '3juma',
  body: 'Test push from web-push (Node)',
  url: '/',
});

webPush
  .sendNotification(subscription, payload, { TTL: 60, urgency: 'high' })
  .then(() => console.log('Sent OK'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
