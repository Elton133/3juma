// OneSignal expects this filename at the site root. Loads SW logic from same origin (avoids blocked CDN in SW).
importScripts(new URL('vendor-os-sw.js', self.location.href).href);
