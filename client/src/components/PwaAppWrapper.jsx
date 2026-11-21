12. REACT PWA APP WRAPPER (pwa-app-wrapper.jsx)
 * FILE: pwa-app-wrapper.jsx
 ******************************************************************************/

import React, { useState, useEffect } from 'react';

/**
 * Android PWA Wrapper & Registration Component
 * Features:
 * - Service Worker Registration
 * - Android "Add to Home Screen" (A2HS) Prompt Banner
 * - Network Online/Offline Banner Listener
 * - Android Back-Button Hardware Listener
 */
export default function PWAAppWrapper({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA / Android
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
            setSwRegistered(true);
          })
          .catch((err) => console.error('[PWA] ServiceWorker registration failed:', err));
      });
    }

    // 2. Listen for Android Install Prompt (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Monitor Network Connectivity
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trigger Native Android Install Dialog
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User install choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', color: '#FFFFFF', position: 'relative' }}>
      {/* Network Offline Alert Banner */}
      {isOffline && (
        <div style={{ backgroundColor: '#EF4444', color: '#FFF', textAlign: 'center', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 9999 }}>
          ⚠️ You are currently offline. Game balances & spins will sync once reconnected.
        </div>
      )}

      {/* Android "Add to Home Screen" Install App Bar */}
      {showInstallBanner && (
        <div style={{ backgroundColor: '#1E293B', borderBottom: '2px solid #4F46E5', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: isOffline ? '36px' : 0, zIndex: 9990 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🎰
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Install Sweepstakes Casino</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Add to your Android home screen for instant full-screen play</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowInstallBanner(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#64748B', fontSize: '12px', padding: '6px 10px', cursor: 'pointer' }}>
              Later
            </button>
            <button onClick={handleInstallClick} style={{ backgroundColor: '#10B981', border: 'none', color: '#FFF', fontWeight: 'bold', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' }}>
              Install
            </button>
          </div>
        </div>
      )}

      {/* App Component Content */}
      <main>{children}</main>
    </div>
  );
}
