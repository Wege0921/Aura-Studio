import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-install-dismissed') === 'true') {
      return;
    }

    // Check if app is already installed (standalone or display-mode standalone)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      sessionStorage.setItem('pwa-install-dismissed', 'true');
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
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  // Mobile: bottom banner, Desktop: top-right banner
  return (
    <>
      {/* Mobile banner (bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
        <div
          className="bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-5.25m0 0a6.01 6.01 0 011.5-.189m-1.5.189a6.01 6.01 0 00-1.5-.189" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Install AURA Yoga</p>
              <p className="text-xs text-gray-500 truncate">Better experience on your home screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded min-h-[36px] min-w-[44px]"
            >
              Dismiss
            </button>
            <button
              onClick={handleInstall}
              className="text-sm font-medium bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors min-h-[36px] min-w-[44px]"
            >
              Install
            </button>
          </div>
        </div>
      </div>

      {/* Desktop banner (top-right) */}
      <div className="hidden md:block fixed top-4 right-4 z-[60]">
        <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-4 py-3 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-5.25m0 0a6.01 6.01 0 011.5-.189m-1.5.189a6.01 6.01 0 00-1.5-.189" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Install AURA Yoga</p>
              <p className="text-xs text-gray-500 mt-0.5">Get a better experience with the app on your device.</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleDismiss}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded min-h-[36px] min-w-[44px]"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleInstall}
                  className="text-xs font-medium bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors min-h-[36px] min-w-[44px]"
                >
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PWAInstallBanner;
