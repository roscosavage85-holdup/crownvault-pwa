import React, { useState } from 'react';
import SlotMachineComponent from './components/SlotMachineComponent';
import CasinoLobbyComponent from './components/CasinoLobbyComponent';
import TopAdBannerComponent from './components/TopAdBannerComponent';
import BonusWheelComponent from './components/BonusWheelComponent';
import VipLoyaltyComponent from './components/VipLoyaltyComponent';
import StoreCashierRedemptionComponent from './components/StoreCashierRedemptionComponent';
import PwaAppWrapper from './components/PwaAppWrapper';
import CrownVaultAppUpdateBanner from './components/CrownVaultAppUpdateBanner';

export default function App() {
  const [activeTab, setActiveTab] = useState('lobby');
  const [userId] = useState('demo-user-123');

  return (
    <PwaAppWrapper>
      <CrownVaultAppUpdateBanner />
      <div style={{ minHeight: '100vh', backgroundColor: '#0b0e14', color: '#fff', fontFamily: 'sans-serif' }}>
        <TopAdBannerComponent />
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
