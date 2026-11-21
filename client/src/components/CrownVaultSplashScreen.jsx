import React, { useState, useEffect } from 'react';

/**
 * CrownVault Splash Screen & Mobile Loading Component
 * Features:
 * - Royal Gold (#D4AF37) & Obsidian Vault (#0B0E14) Branding
 * - Animated Vault Lock Unlocking Effect
 * - Dynamic Loading Progress Bar
 * - Native Android PWA Launch Experience
 */

export default function CrownVaultSplashScreen({ onLoaded }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Securing Vault Connection...');

  useEffect(() => {
    const steps = [
      { p: 25, text: 'Verifying Geofence & Location...' },
      { p: 55, text: 'Loading VIP Rewards & Daily Streak...' },
      { p: 85, text: 'Initializing Provably Fair RNG Engine...' },
      { p: 100, text: 'Vault Unlocked!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusText(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (onLoaded) onLoaded();
        }, 600);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0b0e14',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: '24px',
        textAlign: 'center'
      }}
    >
      {/* CrownVault Animated Emblem */}
      <div
        style={{
          width: '140px',
          height: '140px',
          marginBottom: '24px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px stroke #d4af37',
            borderTop: '3px solid #d4af37',
            borderRight: '3px solid transparent',
            animation: 'spin 2s linear infinite'
          }}
        />
        <svg viewBox="0 0 512 512" width="100" height="100">
          <path d="M 185 280 L 185 215 L 215 250 L 256 175 L 297 250 L 327 215 L 327 280 Z" fill="#D4AF37"/>
          <path d="M 185 285 L 327 285 L 320 305 L 192 305 Z" fill="#F59E0B"/>
          <circle cx="256" cy="245" r="10" fill="#0B0E14" stroke="#D4AF37" strokeWidth="2"/>
        </svg>
      </div>

      {/* Brand Title */}
      <h1
        style={{
          fontSize: '28px',
          fontWeight: '900',
          letterSpacing: '2px',
          margin: '0 0 6px 0',
          background: 'linear-gradient(135deg, #FEF08A 0%, #D4AF37 50%, #B45309 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase'
        }}
      >
        CrownVault
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 32px 0', letterSpacing: '1px' }}>
        SOCIAL SWEEPSTAKES CASINO
      </p>

      {/* Progress Bar Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '280px',
          backgroundColor: '#1e293b',
          height: '8px',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '12px',
          border: '1px solid #334155'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #D4AF37, #F59E0B)',
            borderRadius: '20px',
            transition: 'width 0.4s ease-in-out'
          }}
        />
      </div>

      {/* Loading Status Text */}
      <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
        {statusText}
      </div>

      {/* Keyframe animation inline style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
