9. REACT DAILY STREAK & BONUS WHEEL (bonus-wheel-component-v3.jsx)
 * FILE: bonus-wheel-component-v3.jsx
 ******************************************************************************/

import React, { useState, useEffect } from 'react';

const DAILY_REWARDS_EXACT = [
  { day: 1, label: '$0.10 SC', sc: 0.10, gc: 0, desc: 'Day 1 Bonus' },
  { day: 2, label: '$0.25 SC', sc: 0.25, gc: 0, desc: 'Day 2 Bonus' },
  { day: 3, label: '$0.75 SC', sc: 0.75, gc: 0, desc: 'Day 3 Bonus' },
  { day: 4, label: '5 Free Spins', sc: 0.00, gc: 0, spins: 5, desc: 'Game of the Week' },
  { day: 5, label: '$1.00 SC', sc: 1.00, gc: 0, desc: 'Day 5 Bonus' },
  { day: 6, label: '10,000 GC', sc: 0.00, gc: 10000, desc: 'Game Coins' },
  { day: 7, label: '10 Spins + Mega Wheel', sc: 0.00, gc: 0, spins: 10, wheel: true, desc: 'Jackpot Wheel Unlock' },
];

export default function BonusWheelAndStreak({ userId, onBalanceUpdate }) {
  const [streak, setStreak] = useState(1);
  const [claimedToday, setClaimedToday] = useState(false);
  const [wheelEligible, setWheelEligible] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) fetchStreakStatus();
  }, [userId]);

  const fetchStreakStatus = async () => {
    try {
      const res = await fetch(`/api/bonus/streak?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setStreak(data.currentStreak || 1);
        setWheelEligible(data.wheelSpinEligible || false);
        setClaimedToday(data.claimedToday || false);
      }
    } catch (err) {
      console.error('Streak fetch error:', err);
    }
  };

  const handleClaimDaily = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bonus/daily-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (data.success) {
        setStreak(data.currentStreak);
        setClaimedToday(true);
        if (data.wheelUnlocked) setWheelEligible(true);
        if (onBalanceUpdate) onBalanceUpdate(data.newGcBalance, data.newScBalance);
        alert(`Success! ${data.message}`);
      } else {
        alert(data.message || 'Already claimed today!');
      }
    } catch (err) {
      console.error('Daily claim error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpinWheel = async () => {
    if (isSpinning || !wheelEligible) return;
    setIsSpinning(true);

    try {
      const res = await fetch('/api/bonus/wheel-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (data.success) {
        const extraTurns = 5 * 360;
        const targetDeg = extraTurns + Math.floor(Math.random() * 300);
        setWheelRotation(targetDeg);

        setTimeout(() => {
          setIsSpinning(false);
          setWheelEligible(false);
          setWonPrize(data.wonSegment);
          if (onBalanceUpdate) onBalanceUpdate(data.newGcBalance, data.newScBalance);
        }, 4000);
      } else {
        setIsSpinning(false);
        alert(data.message || 'Wheel spin failed.');
      }
    } catch (err) {
      setIsSpinning(false);
      console.error('Wheel spin error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', background: '#0F172A', color: '#FFF', borderRadius: '16px', padding: '24px', fontFamily: 'sans-serif' }}>
      <h3 style={{ textAlign: 'center', color: '#F59E0B', margin: '0 0 16px 0', fontSize: '22px' }}>
        📅 7-Day Daily Login Streak & Mega Bonus Wheel
      </h3>

      {/* 7-Day Reward Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '24px' }}>
        {DAILY_REWARDS_EXACT.map(item => {
          const isCurrent = streak === item.day;
          const isPassed = streak > item.day;
          return (
            <div
              key={item.day}
              style={{
                background: isCurrent ? 'linear-gradient(135deg, #F59E0B, #D97706)' : isPassed ? '#1E293B' : '#334155',
                color: isCurrent ? '#000' : '#FFF',
                borderRadius: '8px',
                padding: '10px 4px',
                textAlign: 'center',
                border: isCurrent ? '2px solid #FFF' : '1px solid #475569',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Day {item.day}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', margin: '6px 0' }}>{item.label}</div>
              {item.wheel && <div style={{ fontSize: '14px' }}>🎡</div>}
            </div>
          );
        })}
      </div>

      {/* Claim Button */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          onClick={handleClaimDaily}
          disabled={claimedToday || loading}
          style={{
            padding: '14px 32px',
            background: claimedToday ? '#475569' : 'linear-gradient(135deg, #10B981, #059669)',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: claimedToday || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Claiming...' : claimedToday ? 'Daily Bonus Claimed Today' : `Claim Day ${streak} Reward`}
        </button>
      </div>

      {/* 7th Day Wheel Trigger */}
      {wheelEligible && (
        <div style={{ background: '#1E293B', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '2px solid #F59E0B' }}>
          <h4 style={{ color: '#F59E0B', margin: '0 0 12px 0' }}>🎉 7th-Day Mega Bonus Wheel Unlocked!</h4>
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '6px solid #F59E0B', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '48px', transform: `rotate(${wheelRotation}deg)`, transition: 'transform 4s cubic-bezier(0.15, 0.99, 0.18, 0.99)' }}>
            🎡
          </div>
          <button
            onClick={handleSpinWheel}
            disabled={isSpinning}
            style={{ padding: '12px 24px', background: '#F59E0B', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL NOW!'}
          </button>
        </div>
      )}

      {wonPrize && (
        <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#10B981', color: '#000', borderRadius: '8px', fontWeight: 'bold' }}>
          🎁 Congratulations! You won {wonPrize}!
        </div>
      )}
    </div>
  );
}
