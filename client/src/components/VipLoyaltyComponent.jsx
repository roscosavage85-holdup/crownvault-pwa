10. REACT VIP LOYALTY & MILESTONES (vip-loyalty-component-v2.jsx)
 * FILE: vip-loyalty-component-v2.jsx
 ******************************************************************************/

import React, { useState, useEffect } from 'react';

const VIP_TIERS = [
  { name: 'BRONZE', minPts: 0, mult: '1.0x', crown: '🥉' },
  { name: 'SILVER', minPts: 1000, mult: '1.25x', crown: '🥈' },
  { name: 'GOLD', minPts: 5000, mult: '1.5x', crown: '🥇' },
  { name: 'PLATINUM', minPts: 20000, mult: '2.0x', crown: '💎' },
  { name: 'DIAMOND', minPts: 50000, mult: '3.0x', crown: '👑' },
  { name: 'CROWN', minPts: 150000, mult: '5.0x', crown: '🔥' },
];

const MILESTONES = [
  { id: 1, targetSc: 225, scReward: 1.0, gcReward: '10,000' },
  { id: 2, targetSc: 1000, scReward: 5.0, gcReward: '50,000' },
  { id: 3, targetSc: 3000, scReward: 15.0, gcReward: '150,000' },
  { id: 4, targetSc: 10000, scReward: 50.0, gcReward: '500,000' },
];

export default function VipLoyaltySystem({ userId, onBalanceUpdate }) {
  const [vipPts, setVipPts] = useState(0);
  const [vipTier, setVipTier] = useState('BRONZE');
  const [totalSpinsSc, setTotalSpinsSc] = useState(0);
  const [claimedIds, setClaimedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchVipStatus();
  }, [userId]);

  const fetchVipStatus = async () => {
    try {
      const res = await fetch(`/api/vip/status?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setVipPts(data.vipPoints);
        setVipTier(data.vipTier);
        setTotalSpinsSc(data.totalSpinsSC);
        setClaimedIds(data.claimedMilestoneIds || []);
      }
    } catch (err) {
      console.error('VIP status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimMilestone = async (mId) => {
    try {
      const res = await fetch('/api/vip/claim-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, milestoneId: mId }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimedIds(prev => [...prev, mId]);
        if (onBalanceUpdate) onBalanceUpdate(null, data.newScBalance);
        alert(`Milestone claimed! Received ${data.scGranted} SC`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Milestone claim error:', err);
    }
  };

  const currentTierObj = VIP_TIERS.find(t => t.name === vipTier) || VIP_TIERS[0];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#0F172A', color: '#FFF', borderRadius: '16px', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Tier Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B, #312E81)', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '32px' }}>{currentTierObj.crown}</span>
          <h2 style={{ margin: '4px 0', fontSize: '24px', color: '#F59E0B' }}>{vipTier} VIP TIER</h2>
          <p style={{ margin: 0, color: '#A5B4FC', fontSize: '14px' }}>Daily Reward Multiplier: {currentTierObj.mult}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{vipPts.toLocaleString()} XP</div>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>Total SC Wagered: ${totalSpinsSc.toFixed(2)}</div>
        </div>
      </div>

      {/* Milestones Card Grid */}
      <h3 style={{ color: '#F59E0B', margin: '0 0 16px 0' }}>⭐ Stars & Milestones Spin Rewards</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
        {MILESTONES.map(m => {
          const isClaimed = claimedIds.includes(m.id);
          const isUnlocked = totalSpinsSc >= m.targetSc;
          return (
            <div key={m.id} style={{ background: '#1E293B', borderRadius: '10px', padding: '16px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>Wager ${m.targetSc} SC</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10B981', margin: '8px 0' }}>+${m.scReward} SC</div>
              <button
                onClick={() => handleClaimMilestone(m.id)}
                disabled={isClaimed || !isUnlocked}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isClaimed ? '#475569' : isUnlocked ? '#10B981' : '#334155',
                  color: isUnlocked && !isClaimed ? '#000' : '#94A3B8',
                  fontWeight: 'bold',
                  cursor: isUnlocked && !isClaimed ? 'pointer' : 'not-allowed',
                }}
              >
                {isClaimed ? 'Claimed' : isUnlocked ? 'Claim Bonus' : 'Locked'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
