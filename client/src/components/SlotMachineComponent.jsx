6. REACT SLOT MACHINE COMPONENT (slot-machine-component-v2.jsx)
 * FILE: slot-machine-component-v2.jsx
 ******************************************************************************/

import React, { useState } from 'react';

/**
 * Mobile-First Slot Machine Interface (v2)
 * Connects directly to server-side Provably Fair RNG (/api/slot/spin)
 */
const SYMBOLS = ['CHERRY', 'LEMON', 'BELL', 'BAR', 'SEVEN'];
const SYMBOL_EMOJIS = {
  CHERRY: '🍒',
  LEMON: '🍋',
  BELL: '🔔',
  BAR: '💎',
  SEVEN: '7️⃣',
};

export default function SlotMachine({ userId, gcBalance = 10000, scBalance = 5.00, stateCode = 'TX', onBalanceUpdate }) {
  const [currency, setCurrency] = useState('SWEEPS_COIN'); // 'GOLD_COIN' or 'SWEEPS_COIN'
  const [wager, setWager] = useState(0.50);
  const [reels, setReels] = useState(['SEVEN', 'SEVEN', 'SEVEN']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('');
  const [currentGc, setCurrentGc] = useState(gcBalance);
  const [currentSc, setCurrentSc] = useState(scBalance);

  const isRestricted = ['WA', 'ID', 'MI', 'MT'].includes(stateCode.toUpperCase());

  const handleSpin = async () => {
    if (isSpinning) return;
    if (isRestricted) {
      alert(`Gameplay is restricted in state (${stateCode}).`);
      return;
    }

    const currentBal = currency === 'GOLD_COIN' ? currentGc : currentSc;
    if (currentBal < wager) {
      alert(`Insufficient ${currency === 'GOLD_COIN' ? 'Gold Coins' : 'Sweeps Coins'} balance!`);
      return;
    }

    setIsSpinning(true);
    setMessage('');
    setLastWin(0);

    // Reel spin animation effect
    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 100);

    try {
      const response = await fetch('/api/slot/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-state': stateCode,
        },
        body: JSON.stringify({
          userId,
          currencyType: currency,
          wagerAmount: wager,
          gameTitle: 'Neon Spin Deluxe',
        }),
      });

      const data = await response.json();
      clearInterval(spinInterval);

      if (data.success) {
        setReels(data.reels);
        setLastWin(data.winAmount);
        
        if (currency === 'GOLD_COIN') {
          setCurrentGc(data.newBalance);
        } else {
          setCurrentSc(data.newBalance);
        }

        if (onBalanceUpdate) {
          onBalanceUpdate(currency === 'GOLD_COIN' ? data.newBalance : currentGc, currency === 'SWEEPS_COIN' ? data.newBalance : currentSc);
        }

        if (data.winAmount > 0) {
          setMessage(`🎉 BIG WIN! Won ${currency === 'GOLD_COIN' ? data.winAmount + ' GC' : '$' + data.winAmount.toFixed(2) + ' SC'}!`);
        } else {
          setMessage('Try again!');
        }
      } else {
        setMessage(data.message || 'Spin failed.');
      }
    } catch (err) {
      clearInterval(spinInterval);
      console.error('Spin error:', err);
      setMessage('Network failure. Please try again.');
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '0 auto', background: '#0F172A', color: '#FFF', borderRadius: '16px', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Header & Balance Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#F59E0B' }}>🎰 Neon Spin Deluxe</h2>
        <div style={{ fontSize: '12px', background: isRestricted ? '#EF4444' : '#10B981', padding: '4px 8px', borderRadius: '4px' }}>
          State: {stateCode}
        </div>
      </div>

      {/* Currency Switcher */}
      <div style={{ display: 'flex', background: '#1E293B', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
        <button
          onClick={() => { setCurrency('GOLD_COIN'); setWager(100); }}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: currency === 'GOLD_COIN' ? '#F59E0B' : 'transparent', color: currency === 'GOLD_COIN' ? '#000' : '#94A3B8', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🟡 Gold Coins ({currentGc.toLocaleString()} GC)
        </button>
        <button
          onClick={() => { setCurrency('SWEEPS_COIN'); setWager(0.50); }}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: currency === 'SWEEPS_COIN' ? '#10B981' : 'transparent', color: currency === 'SWEEPS_COIN' ? '#FFF' : '#94A3B8', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🟢 Sweeps Coins (${currentSc.toFixed(2)} SC)
        </button>
      </div>

      {/* Reel Display Frame */}
      <div style={{ background: '#1E293B', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '2px solid #334155', marginBottom: '20px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
        {reels.map((symbol, idx) => (
          <div key={idx} style={{ width: '80px', height: '90px', background: '#0F172A', borderRadius: '8px', border: '1px solid #475569', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '42px' }}>
            {SYMBOL_EMOJIS[symbol]}
          </div>
        ))}
      </div>

      {/* Win & Message Callout */}
      {message && (
        <div style={{ textAlign: 'center', margin: '12px 0', padding: '10px', background: lastWin > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: lastWin > 0 ? '1px solid #10B981' : '1px solid #EF4444', borderRadius: '8px', color: lastWin > 0 ? '#10B981' : '#F87171', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* Controls & Wager Selection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', color: '#94A3B8' }}>Wager Amount:</span>
        <select
          value={wager}
          onChange={(e) => setWager(parseFloat(e.target.value))}
          style={{ background: '#1E293B', color: '#FFF', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' }}
        >
          {currency === 'GOLD_COIN' ? (
            <>
              <option value={100}>100 GC</option>
              <option value={500}>500 GC</option>
              <option value={1000}>1,000 GC</option>
              <option value={5000}>5,000 GC</option>
            </>
          ) : (
            <>
              <option value={0.20}>$0.20 SC</option>
              <option value={0.50}>$0.50 SC</option>
              <option value={1.00}>$1.00 SC</option>
              <option value={5.00}>$5.00 SC</option>
            </>
          )}
        </select>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || isRestricted}
        style={{ width: '100%', padding: '16px', background: isRestricted ? '#64748B' : 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: isRestricted || isSpinning ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}
      >
        {isSpinning ? 'SPINNING...' : isRestricted ? 'RESTRICTED STATE' : 'SPIN'}
      </button>
    </div>
  );
}
