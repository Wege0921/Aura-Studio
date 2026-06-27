import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop' | null;

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
  const isAndroid = /android/i.test(ua);
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'desktop';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISS_KEY = 'pwa-install-dismissed-until';

function isDismissed(): boolean {
  const until = localStorage.getItem(DISMISS_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismissFor(days: number) {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
}

const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === 'ios') {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android & Desktop: wait for browser prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      dismissFor(365);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismissFor(365);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSModal(false);
    dismissFor(7); // ask again in 7 days
  };

  if (!isVisible) return null;

  // ── iOS: bottom sheet with step-by-step instructions ──────────────────────
  if (platform === 'ios') {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-[70] bg-black/50" onClick={handleDismiss} />

        {/* Bottom sheet */}
        <div
          className="fixed bottom-0 left-0 right-0 z-[80] bg-aura-ink rounded-t-2xl shadow-2xl"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-aura-sand/30" />
          </div>

          <div className="px-6 pb-2">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <img src="/web-app-manifest-192x192.png" alt="AURA" className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <div>
                <p className="text-base font-bold text-aura-cream">Add AURA to Home Screen</p>
                <p className="text-xs text-aura-sand/60">Install the app for the best experience</p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 bg-aura-bark/60 rounded-xl px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <div className="flex-1">
                  <span className="text-sm text-aura-cream">Tap the </span>
                  {/* iOS Share icon */}
                  <svg className="inline w-5 h-5 text-blue-400 mx-0.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-sm text-aura-cream"> Share button at the bottom of Safari</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-aura-bark/60 rounded-xl px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <div className="flex-1">
                  <span className="text-sm text-aura-cream">Scroll down and tap </span>
                  <span className="text-sm font-semibold text-aura-cream">"Add to Home Screen"</span>
                  <span className="ml-1 text-base">＋</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-aura-bark/60 rounded-xl px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <p className="text-sm text-aura-cream flex-1">Tap <span className="font-semibold">"Add"</span> in the top right — done!</p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl border border-aura-sand/20 text-sm text-aura-sand/60 hover:text-aura-sand active:bg-aura-sand/10 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Android / Desktop: standard install prompt ─────────────────────────────
  const isDesktop = platform === 'desktop';

  return (
    <>
      {/* Mobile (Android) — bottom banner */}
      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
          <div
            className="bg-aura-ink border-t border-aura-sand/10 shadow-lg px-4 py-3 flex items-center justify-between"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <img src="/web-app-manifest-192x192.png" alt="AURA" className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-aura-cream truncate">Install AURA App</p>
                <p className="text-xs text-aura-sand/50 truncate">Add to home screen for quick access</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <button onClick={handleDismiss} className="text-sm text-aura-sand/50 hover:text-aura-sand px-2 py-1 rounded min-h-[36px]">
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="text-sm font-semibold bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors min-h-[36px]"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop — top-right card */}
      {isDesktop && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className="bg-aura-ink border border-aura-sand/10 shadow-2xl rounded-2xl p-4 w-80">
            <div className="flex items-start gap-3">
              <img src="/web-app-manifest-192x192.png" alt="AURA" className="w-11 h-11 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-aura-cream">Install AURA App</p>
                <p className="text-xs text-aura-sand/50 mt-0.5 leading-relaxed">Install for a faster, app-like experience on your desktop.</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={handleDismiss} className="text-xs text-aura-sand/50 hover:text-aura-sand px-3 py-1.5 rounded-lg border border-aura-sand/20 min-h-[32px]">
                    Not now
                  </button>
                  <button
                    onClick={handleInstall}
                    className="text-xs font-semibold bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition-colors min-h-[32px] flex-1"
                  >
                    Install
                  </button>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-aura-sand/40 hover:text-aura-sand -mt-1 -mr-1 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
