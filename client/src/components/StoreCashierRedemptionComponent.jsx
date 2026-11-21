11. REACT STORE CASHIER & REDEMPTION (store-cashier-redemption-component-v2.jsx)
 * FILE: store-cashier-redemption-component-v2.jsx
 ******************************************************************************/

import React, { useState } from 'react';

const PACKAGES = [
  { id: 1, priceUsd: 4.99, gc: 50000, bonusSc: 5.0, popular: false },
  { id: 2, priceUsd: 19.99, gc: 200000, bonusSc: 21.0, popular: true },
  { id: 3, priceUsd: 49.99, gc: 500000, bonusSc: 53.0, popular: false },
  { id: 4, priceUsd: 99.99, gc: 1000000, bonusSc: 110.0, popular: false },
];

export default function StoreCashierRedemption({ userId, kycStatus = 'UNVERIFIED', stateCode = 'TX', onBalanceUpdate }) {
  const [activeTab, setActiveTab] = useState('STORE'); // STORE or REDEEM
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[1]);
  const [pm, setPm] = useState('CREDIT_CARD');
  const [redeemAmount, setRedeemAmount] = useState(50.0);
  const [redeemMethod, setRedeemMethod] = useState('GIFT_CARD');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          packageId: selectedPkg.id,
          amountUsd: selectedPkg.priceUsd,
          goldCoinsGranted: selectedPkg.gc,
          sweepsCoinsBonus: selectedPkg.bonusSc,
          paymentMethod: pm,
          stateCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (onBalanceUpdate) onBalanceUpdate(data.newGcBalance, data.newScBalance);
        alert(`Success! Purchased ${selectedPkg.gc.toLocaleString()} GC + $${selectedPkg.bonusSc} SC Free!`);
      } else {
        alert(data.message || 'Purchase failed.');
      }
    } catch (err) {
      console.error('Purchase error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (kycStatus !== 'VERIFIED') {
      alert('KYC verification is required prior to processing prize redemptions.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/redemption/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sweepsCoinsAmount: redeemAmount,
          payoutMethod: redeemMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (onBalanceUpdate) onBalanceUpdate(null, data.remainingSweepsCoins);
        alert('Redemption request submitted successfully!');
      } else {
        alert(data.message || 'Redemption failed.');
      }
    } catch (err) {
      console.error('Redemption error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#0F172A', color: '#FFF', borderRadius: '16px', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('STORE')}
          style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeTab === 'STORE' ? '3px solid #F59E0B' : 'none', color: activeTab === 'STORE' ? '#F59E0B' : '#94A3B8', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
        >
          🛒 Coin Store
        </button>
        <button
          onClick={() => setActiveTab('REDEEM')}
          style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeTab === 'REDEEM' ? '3px solid #10B981' : 'none', color: activeTab === 'REDEEM' ? '#10B981' : '#94A3B8', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
        >
          🏆 Prize Redemption
        </button>
      </div>

      {activeTab === 'STORE' ? (
        <div>
          <h4 style={{ color: '#F59E0B', margin: '0 0 12px 0' }}>Select Gold Coin Package</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                style={{ background: selectedPkg.id === pkg.id ? '#1E293B' : '#0F172A', border: selectedPkg.id === pkg.id ? '2px solid #F59E0B' : '1px solid #334155', borderRadius: '10px', padding: '16px', cursor: 'pointer', textAlign: 'center' }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>${pkg.priceUsd}</div>
                <div style={{ fontSize: '14px', color: '#F59E0B', margin: '4px 0' }}>{pkg.gc.toLocaleString()} GC</div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 'bold' }}>+ ${pkg.bonusSc} SC FREE</div>
              </div>
            ))}
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#F59E0B', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
          >
            {loading ? 'Processing...' : `Buy Package for $${selectedPkg.priceUsd}`}
          </button>
        </div>
      ) : (
        <div>
          <h4 style={{ color: '#10B981', margin: '0 0 12px 0' }}>Redeem Sweeps Coins for Cash Prizes</h4>
          <div style={{ background: '#1E293B', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>KYC Identity Status:</div>
            <div style={{ fontWeight: 'bold', color: kycStatus === 'VERIFIED' ? '#10B981' : '#EF4444' }}>
              {kycStatus === 'VERIFIED' ? '✅ VERIFIED' : '⚠️ UNVERIFIED (Verification Required)'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', color: '#94A3B8' }}>Sweeps Coins Amount to Redeem:</label>
            <input
              type="number"
              value={redeemAmount}
              onChange={e => setRedeemAmount(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '10px', background: '#1E293B', color: '#FFF', border: '1px solid #475569', borderRadius: '6px', marginTop: '6px' }}
            />
          </div>

          <button
            onClick={handleRedeem}
            disabled={loading || kycStatus !== 'VERIFIED'}
            style={{ width: '100%', padding: '14px', background: kycStatus === 'VERIFIED' ? '#10B981' : '#475569', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: kycStatus === 'VERIFIED' ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Submitting...' : 'Request Prize Redemption'}
          </button>
        </div>
      )}
    </div>
  );
}
