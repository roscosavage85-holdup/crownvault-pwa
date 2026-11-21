import React, { useState, useEffect } from 'react';

/**
 * CrownVault App Update Banner Component
 * Features:
 * - Listens for Service Worker 'updatefound' and 'waiting' states
 * - Displays an automated top notification bar when a new CrownVault deployment is live
 * - One-click 'Reload & Update' trigger sending SKIP_WAITING to sw.js
 */
export default function CrownVaultAppUpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        // Check if a new service worker is waiting
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowUpdate(true);
        }

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Reload window when new service worker takes over control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        borderBottom: '2px solid #d4af37',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>🚀</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#fef08a' }}>
            New CrownVault Update Available!
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            A new version with performance improvements and features is ready.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setShowUpdate(false)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '12px',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
        <button
          onClick={handleUpdate}
          style={{
            backgroundColor: '#d4af37',
            border: 'none',
            color: '#0b0e14',
            fontWeight: 'bold',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(212,175,55,0.4)',
          }}
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
