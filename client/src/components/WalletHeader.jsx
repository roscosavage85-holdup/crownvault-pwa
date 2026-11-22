import React, { useCallback, useEffect, useState } from 'react';

const formatBalance = (value) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '--';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function WalletHeader({
  userId,
  activeCurrency,
  onCurrencyChange,
  onStoreClick,
  onBonusClick,
  onBalanceRefresh,
  onBalancesChange,
}) {
  const [balances, setBalances] = useState(null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!userId) {
      setBalances(null);
      if (onBalancesChange) onBalancesChange(null);
      setError('Sign in to view your balance.');
      return;
    }

    try {
      const response = await fetch(`/api/wallet/balance?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load wallet balance.');
      setBalances(data);
      if (onBalancesChange) onBalancesChange(data);
      setError('');
      return data;
    } catch (fetchError) {
      setBalances(null);
      if (onBalancesChange) onBalancesChange(null);
      setError(fetchError.message);
      return null;
    }
  }, [onBalancesChange, userId]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    if (onBalanceRefresh) onBalanceRefresh(refreshBalance);
  }, [onBalanceRefresh, refreshBalance]);

  const balance = activeCurrency === 'SC' ? balances?.scBalance : balances?.gcBalance;

  return (
    <header className="wallet-header">
      <a className="brand-mark" href="/" aria-label="CrownVault lobby">
        <span className="brand-crown" aria-hidden="true">♛</span>
        <span>CROWN<span className="brand-gold">VAULT</span></span>
      </a>

      <div className="wallet-controls">
        <div className="wallet-balance-pill" title={error || `${activeCurrency} balance`}>
          <span className={`currency-badge ${activeCurrency === 'SC' ? 'currency-sc' : 'currency-gc'}`}>
            {activeCurrency}
          </span>
          <span className="wallet-amount" aria-live="polite">
            {formatBalance(balance)}
          </span>
          <button
            type="button"
            className="wallet-add-button"
            aria-label="Open store and bonus options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            +
          </button>
        </div>
        <div className="currency-toggle" role="group" aria-label="Active currency">
          {['GC', 'SC'].map((currency) => (
            <button
              type="button"
              key={currency}
              className={activeCurrency === currency ? `currency-choice is-${currency.toLowerCase()}` : 'currency-choice'}
              aria-pressed={activeCurrency === currency}
              onClick={() => onCurrencyChange(currency)}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className="wallet-popover">
          <p>Make the most of your play</p>
          <button type="button" onClick={() => { setMenuOpen(false); onStoreClick(); }}>
            <span aria-hidden="true">✦</span> Visit coin store
          </button>
          <button type="button" onClick={() => { setMenuOpen(false); onBonusClick(); }}>
            <span aria-hidden="true">◷</span> Daily bonus
          </button>
          {error && <span className="wallet-error" role="status">{error}</span>}
        </div>
      )}
    </header>
  );
}
