import React, { useCallback, useState } from 'react';
import './lobby.css';
import BonusWheelComponent from './components/BonusWheelComponent';
import BottomNav from './components/BottomNav';
import CrownVaultAppUpdateBanner from './components/CrownVaultAppUpdateBanner';
import PwaAppWrapper from './components/PwaAppWrapper';
import SlotMachineComponent from './components/SlotMachineComponent';
import StoreCashierRedemptionComponent from './components/StoreCashierRedemptionComponent';
import VipLoyaltyComponent from './components/VipLoyaltyComponent';
import WalletHeader from './components/WalletHeader';
import LobbyPage from './pages/LobbyPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('lobby');
  const [activeCurrency, setActiveCurrency] = useState('GC');
  const [userId] = useState('demo-user-123');
  const [lobbyCategory, setLobbyCategory] = useState('All');
  const [balances, setBalances] = useState(null);
  const [refreshBalance, setRefreshBalance] = useState(() => async () => null);

  const registerBalanceRefresh = useCallback((refresh) => {
    setRefreshBalance(() => refresh);
  }, []);

  const navigate = (target) => {
    if (target === 'favorites') {
      setLobbyCategory('Favorites');
      setActiveTab('lobby');
      return;
    }
    if (target === 'lobby') {
      setLobbyCategory('All');
      setActiveTab('lobby');
      return;
    }
    setActiveTab(target);
  };

  const activeNavItem = activeTab === 'lobby' && lobbyCategory === 'Favorites'
    ? 'favorites'
    : activeTab;

  return (
    <PwaAppWrapper>
      <CrownVaultAppUpdateBanner />
      <div className="crownvault-app">
        <WalletHeader
          userId={userId}
          activeCurrency={activeCurrency}
          onCurrencyChange={setActiveCurrency}
          onStoreClick={() => navigate('store')}
          onBonusClick={() => navigate('bonus')}
          onBalanceRefresh={registerBalanceRefresh}
          onBalancesChange={setBalances}
        />
        {activeTab === 'lobby' && (
          <LobbyPage
            userId={userId}
            activeCurrency={activeCurrency}
            balances={balances}
            onRefreshBalance={refreshBalance}
            initialCategory={lobbyCategory}
            onNavigate={navigate}
          />
        )}
        {activeTab === 'slot' && (
          <div className="legacy-page"><SlotMachineComponent userId={userId} /></div>
        )}
        {activeTab === 'bonus' && (
          <div className="legacy-page"><BonusWheelComponent userId={userId} /></div>
        )}
        {activeTab === 'vip' && (
          <div className="legacy-page"><VipLoyaltyComponent userId={userId} /></div>
        )}
        {(activeTab === 'store' || activeTab === 'redeem') && (
          <div className="legacy-page">
            <StoreCashierRedemptionComponent
              key={activeTab}
              userId={userId}
              initialTab={activeTab === 'redeem' ? 'REDEEM' : 'STORE'}
              onBalanceUpdate={refreshBalance}
            />
          </div>
        )}
        {activeTab === 'menu' && (
          <main className="app-menu">
            <span className="section-kicker">YOUR CROWNVAULT</span>
            <h1>More to explore</h1>
            <button type="button" onClick={() => navigate('bonus')}>Daily bonus <span>→</span></button>
            <button type="button" onClick={() => navigate('vip')}>VIP rewards <span>→</span></button>
            <button type="button" onClick={() => navigate('slot')}>Play a game <span>→</span></button>
          </main>
        )}
        <BottomNav activeItem={activeNavItem} onNavigate={navigate} />
      </div>
    </PwaAppWrapper>
  );
}
