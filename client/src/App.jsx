import React, { useState } from 'react';
import SlotMachineComponent from './components/SlotMachineComponent';
import CasinoLobbyComponent from './components/CasinoLobbyComponent';
import TopAdBannerComponent from './components/TopAdBannerComponent';
import BonusWheelComponent from './components/BonusWheelComponent';
import VipLoyaltyComponent from './components/VipLoyaltyComponent';
import StoreCashierRedemptionComponent from './components/StoreCashierRedemptionComponent';
import PwaAppWrapper from './components/PwaAppWrapper';
import CrownVaultAppUpdateBanner from './components/CrownVaultAppUpdateBanner';

const TAB_ROUTES = {
  lobby: 'lobby',
  slot: 'slot',
  wheel: 'wheel',
  vip: 'vip',
  store: 'store',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('lobby');
  const [userId] = useState('demo-user-123');

  const navigate = (target) => {
    if (typeof target === 'string' && target.startsWith('/')) {
      const route = target.split('/')[1];
      if (TAB_ROUTES[route]) setActiveTab(route);
      if (route === 'daily-bonus') setActiveTab('wheel');
      if (route === 'milestones') setActiveTab('vip');
      return;
    }
    setActiveTab('slot');
  };

  return (
    <PwaAppWrapper>
      <CrownVaultAppUpdateBanner />
      <div style={{ minHeight: '100vh', backgroundColor: '#0b0e14', color: '#fff', fontFamily: 'sans-serif' }}>
        <TopAdBannerComponent onNavigate={navigate} />
        <nav aria-label="App navigation" style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '0 16px 16px' }}>
          {[['lobby', 'Lobby'], ['slot', 'Slots'], ['wheel', 'Daily'], ['vip', 'VIP'], ['store', 'Store']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 12px', borderRadius: 8, border: 0, cursor: 'pointer', background: activeTab === tab ? '#f59e0b' : '#1e293b', color: activeTab === tab ? '#000' : '#fff' }}>{label}</button>
          ))}
        </nav>
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
          {activeTab === 'lobby' && <CasinoLobbyComponent userId={userId} onSelectGame={() => setActiveTab('slot')} />}
          {activeTab === 'slot' && <SlotMachineComponent userId={userId} />}
          {activeTab === 'wheel' && <BonusWheelComponent userId={userId} />}
          {activeTab === 'vip' && <VipLoyaltyComponent userId={userId} />}
          {activeTab === 'store' && <StoreCashierRedemptionComponent userId={userId} />}
        </div>
      </div>
    </PwaAppWrapper>
  );
}
