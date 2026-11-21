8. REACT TOP AD BANNER CAROUSEL (top-ad-banner-component.jsx)
 * FILE: top-ad-banner-component.jsx
 ******************************************************************************/

import React, { useState, useEffect } from 'react';

/**
 * Top Scrolling Promotional Ad Banner Component
 * Guided by source screenshots (CrashDuel, Lone Star Casino, Crown Coins Casino)
 * 
 * Features:
 * - Auto-playing top carousel for promotional offers, partner deals, and timed events
 * - Touch swipe & manual dot indicator controls
 * - Dynamic Call-To-Action (CTA) triggers (Deposit Deals, Bonus Claims, GOTW)
 * - Provider Brand Logos ticker (BGaming, BetSoft, Pragmatic, etc.)
 */

const AD_BANNERS = [
  {
    id: 'banner-1',
    title: 'STARS, STRIPES & MILESTONES',
    subtitle: 'Wager on Slots & Unlock up to 15.00 Free Sweeps Coins!',
    tag: 'LIMITED TIME EVENT',
    ctaText: 'View Challenge',
    ctaLink: '/milestones',
    bgGradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    badgeColor: '#EF4444',
    icon: '⭐'
  },
  {
    id: 'banner-2',
    title: 'WEEKLY TOKEN PACKAGE DEAL',
    subtitle: 'Get 200,000 Gold Coins + 30 FREE Sweeps Coins for $19.99!',
    tag: '50% EXTRA BONUS',
    ctaText: 'Claim Deal',
    ctaLink: '/store',
    bgGradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
    badgeColor: '#F59E0B',
    icon: '🔥'
  },
  {
    id: 'banner-3',
    title: '7-DAY MEGA STREAK WHEEL',
    subtitle: 'Log in daily to unlock the $500.00 SC Jackpot Wheel on Day 7!',
    tag: 'DAILY AMOE BONUS',
    ctaText: 'Spin Wheel',
    ctaLink: '/daily-bonus',
    bgGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    badgeColor: '#10B981',
    icon: '🎡'
  },
  {
    id: 'banner-4',
    title: 'GAME OF THE WEEK: NEON SPIN DELUXE',
    subtitle: 'Play today and get 10 Free Spins + 2x VIP Multiplier points!',
    tag: 'FEATURED SLOT',
    ctaText: 'Play Now',
    ctaLink: '/game/neon-spin',
    bgGradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
    badgeColor: '#8B5CF6',
    icon: '🎰'
  }
];

const PROVIDER_LOGOS = [
  { name: 'BGaming', logo: 'BGAMING' },
  { name: 'BetSoft', logo: 'BETSOFT' },
  { name: 'Pragmatic Play', logo: 'PRAGMATIC' },
  { name: 'Hacksaw Gaming', logo: 'HACKSAW' },
  { name: 'Relax Gaming', logo: 'RELAX' },
  { name: 'Evoplay', logo: 'EVOPLAY' }
];

export default function TopAdBanner({ onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll banners every 4 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % AD_BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeBanner = AD_BANNERS[currentIndex];

  return (
    <div 
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto 20px auto',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Promotional Banner Carousel */}
      <div 
        style={{
          background: activeBanner.bgGradient,
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          transition: 'background 0.5s ease-in-out',
          minHeight: '140px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between'
        }}
      >
        {/* Decorative Background Glow */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Top Tag & Indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            backgroundColor: activeBanner.badgeColor,
            color: '#FFF',
            fontSize: '11px',
            fontWeight: '800',
            padding: '4px 10px',
            borderRadius: '20px',
            letterSpacing: '0.8px',
            textTransform: 'uppercase'
          }}>
            {activeBanner.icon} {activeBanner.tag}
          </span>

          {/* Slide Dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {AD_BANNERS.map((banner, index) => (
              <button
                key={banner.id}
                onClick={() => setCurrentIndex(index)}
                style={{
                  width: index === currentIndex ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Banner Main Content */}
        <div style={{ margin: '12px 0' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '900', letterSpacing: '0.5px' }}>
            {activeBanner.title}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', maxWidth: '80%' }}>
            {activeBanner.subtitle}
          </p>
        </div>

        {/* CTA Button */}
        <div>
          <button
            onClick={() => onNavigate && onNavigate(activeBanner.ctaLink)}
            style={{
              backgroundColor: '#FBBF24',
              color: '#1E293B',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {activeBanner.ctaText} →
          </button>
        </div>
      </div>

      {/* Provider Brand Logos Marquee Sub-Bar */}
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '8px',
        padding: '8px 16px',
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        overflowX: 'auto'
      }}>
        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', marginRight: '16px' }}>
          Official Game Providers:
        </span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {PROVIDER_LOGOS.map((provider) => (
            <span key={provider.name} style={{
              fontSize: '12px',
              fontWeight: '900',
              color: '#CBD5E1',
              letterSpacing: '1px',
              opacity: 0.85
            }}>
              {provider.logo}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
