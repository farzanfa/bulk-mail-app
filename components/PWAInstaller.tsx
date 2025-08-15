"use client";
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PWAInstaller() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed

    const dismissedAt = Number(localStorage.getItem('pwa_dismissed_at') || 0);
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const allowNag = Date.now() - dismissedAt > WEEK;

    // iOS cannot trigger prompt programmatically
    if (isIOS()) {
      if (allowNag) setIosHint(true);
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (allowNag) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show && !iosHint) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 rounded-lg border bg-white shadow-card p-3 flex items-center justify-between gap-3">
          {iosHint ? (
            <div className="text-sm text-gray-700">
              Install MailWeaver: Tap the Share button, then <span className="font-medium">Add to Home Screen</span>.
            </div>
          ) : (
            <div className="text-sm text-gray-700">Install MailWeaver as an app for a faster, app-like experience.</div>
          )}
          <div className="flex items-center gap-2">
            {!iosHint && (
              <button
                className="px-3 py-1.5 rounded text-sm bg-black text-white"
                onClick={async () => {
                  if (!deferred) return;
                  await deferred.prompt();
                  try {
                    const res = await deferred.userChoice;
                    if (res.outcome === 'accepted') {
                      setShow(false);
                    } else {
                      localStorage.setItem('pwa_dismissed_at', String(Date.now()));
                      setShow(false);
                    }
                  } catch {
                    // ignore
                  }
                }}
              >Install</button>
            )}
            <button
              className="px-3 py-1.5 rounded text-sm border"
              onClick={() => {
                localStorage.setItem('pwa_dismissed_at', String(Date.now()));
                setShow(false);
                setIosHint(false);
              }}
            >Not now</button>
          </div>
        </div>
      </div>
    </div>
  );
}


