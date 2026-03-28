import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

const STORAGE_DISMISS = '3juma-pwa-install-dismiss';
const STORAGE_SNOOZE = '3juma-pwa-install-snooze';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 2200;

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
  const webkit = /WebKit/.test(ua);
  const noChrome = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && noChrome;
}

type BeforeInstallPromptOutcome = { outcome: 'accepted' | 'dismissed' };

interface UserInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptOutcome>;
}

/**
 * First-visit friendly prompt: native install where `beforeinstallprompt` exists,
 * otherwise short instructions (iOS Share → Add to Home Screen, Chrome Install, etc.).
 */
const InstallAppModal: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<UserInstallPromptEvent | null>(null);

  const canPrompt = useCallback(() => {
    if (typeof window === 'undefined') return false;
    if (isStandaloneDisplay()) return false;
    if (localStorage.getItem(STORAGE_DISMISS) === '1') return false;
    const snoozeUntil = Number(localStorage.getItem(STORAGE_SNOOZE) || '0');
    if (snoozeUntil > Date.now()) return false;
    return location.pathname === ROUTES.home;
  }, [location.pathname]);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as UserInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  useEffect(() => {
    if (!canPrompt()) {
      setOpen(false);
      return;
    }
    const t = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [canPrompt]);

  const dismissForever = () => {
    localStorage.setItem(STORAGE_DISMISS, '1');
    setOpen(false);
  };

  const remindLater = () => {
    localStorage.setItem(STORAGE_SNOOZE, String(Date.now() + SNOOZE_MS));
    setOpen(false);
  };

  const runInstall = async () => {
    if (!deferredPrompt?.prompt) {
      remindLater();
      return;
    }
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setOpen(false);
    }
  };

  if (!open) return null;

  const ios = isIosSafari();
  const hasNativePrompt = !!deferredPrompt;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-app-title"
    >
      <div className="w-full max-w-md glass rounded-[2rem] border border-white/50 shadow-2xl p-6 sm:p-8 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h2 id="install-app-title" className="text-lg font-black text-gray-900 tracking-tight">
                Install 3juma
              </h2>
              <p className="text-xs font-bold text-gray-500 mt-0.5 leading-snug">
                Add to your home screen for faster booking and updates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={remindLater}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-white/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIosSafari() ? (
          <ol className="space-y-3 text-sm font-bold text-gray-700">
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">1</span>
              <span className="pt-0.5 flex items-center gap-2">
                Tap <Share2 className="w-4 h-4 text-gray-900 inline" aria-hidden /> <strong>Share</strong> in Safari’s toolbar.
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">2</span>
              <span className="pt-0.5 flex items-center gap-2">
                Scroll and tap <PlusSquare className="w-4 h-4 text-gray-900 inline" aria-hidden /> <strong>Add to Home Screen</strong>, then confirm.
              </span>
            </li>
          </ol>
        ) : (
          <p className="text-sm font-bold text-gray-600 leading-relaxed">
            {hasNativePrompt
              ? 'Use the button below for a one-tap install. You can also use your browser menu → “Install app” or “Add to Home screen”.'
              : 'Use your browser menu (⋮ or ⋯) → “Install app”, “Add to Home screen”, or “Create shortcut”. If you don’t see it yet, browse a bit and we’ll offer again later.'}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {!ios && (
            <button
              type="button"
              onClick={() => void runInstall()}
              className="flex-1 h-12 rounded-2xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all"
            >
              {hasNativePrompt ? 'Add to home screen' : 'Got it'}
            </button>
          )}
          <button
            type="button"
            onClick={remindLater}
            className="flex-1 h-12 rounded-2xl bg-white/80 border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-white transition-all"
          >
            Later
          </button>
        </div>
        <button type="button" onClick={dismissForever} className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">
          Don’t show again
        </button>
      </div>
    </div>
  );
};

export default InstallAppModal;
