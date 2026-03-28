/* Self-hosted OneSignal loader — avoids ad blockers that block cdn.onesignal.com.
 * Pair with /vendor-os-page.es6.js (update both when bumping OneSignal web SDK v16). */
(function () {
  'use strict';
  function es6Url() {
    var el = document.getElementById('onesignal-sdk');
    if (el && el.src) {
      return el.src.replace(/[^/]+$/, 'vendor-os-page.es6.js');
    }
    return '/vendor-os-page.es6.js';
  }
  if (
    (typeof PushSubscriptionOptions !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(PushSubscriptionOptions.prototype, 'applicationServerKey')) ||
    (typeof window.safari !== 'undefined' && typeof window.safari.pushNotification !== 'undefined')
  ) {
    var n = document.createElement('script');
    n.src = es6Url();
    n.defer = true;
    document.head.appendChild(n);
  } else {
    var msg = 'Incompatible browser.';
    if (navigator.vendor === 'Apple Computer, Inc.' && navigator.maxTouchPoints > 0) {
      msg += ' Try these steps: https://tinyurl.com/bdh2j9f7';
    }
    console.info(msg);
  }
})();
