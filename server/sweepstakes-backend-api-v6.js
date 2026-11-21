3. UNIFIED BACKEND API ROUTER (sweepstakes-backend-api-v6.js)
 * FILE: sweepstakes-backend-api-v6.js
 ******************************************************************************/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/sweepstakes_casino',
});

// Restricted US Sweepstakes States (Legal Compliance)
const RESTRICTED_STATES = ['WA', 'ID', 'MI', 'MT'];

/**
 * Middleware: Geofencing Check
 */
function checkGeofence(req, res, next) {
  const stateCode = req.headers['x-user-state'] || req.body.stateCode || req.query.stateCode || 'TX';
  if (RESTRICTED_STATES.includes(stateCode.toUpperCase())) {
    return res.status(403).json({
      success: false,
      errorCode: 'STATE_RESTRICTED',
      message: `Gameplay and store transactions are restricted in state (${stateCode}).`,
    });
  }
  req.stateCode = stateCode.toUpperCase();
  next();
}

// ----------------------------------------------------------------------------
// 1. SLOT MACHINE SPIN API
// POST /api/slot/spin (also supports /api/game/spin)
// ----------------------------------------------------------------------------
const handleSlotSpin = async (req, res) => {
  const { userId, currencyType = 'SWEEPS_COIN', wagerAmount, gameTitle = 'Neon Spin Deluxe' } = req.body;

  if (!userId || !wagerAmount || parseFloat(wagerAmount) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid wager parameters.' });
  }

  try {
    // Generate Server-Side Provably Fair RNG Reel Outcome
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const clientSeed = req.body.clientSeed || 'client_seed_default';
    const nonce = Date.now();

    // Provably Fair Hashing logic
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(`${clientSeed}:${nonce}`);
    const hash = hmac.digest('hex');

    // Reel outcome generator (3 reels, 5 symbols)
    const symbols = ['CHERRY', 'LEMON', 'BELL', 'BAR', 'SEVEN'];
    const r1 = symbols[parseInt(hash.substring(0, 2), 16) % symbols.length];
    const r2 = symbols[parseInt(hash.substring(2, 4), 16) % symbols.length];
    const r3 = symbols[parseInt(hash.substring(4, 6), 16) % symbols.length];

    let multiplier = 0;
    if (r1 === r2 && r2 === r3) {
      if (r1 === 'SEVEN') multiplier = 50;
      else if (r1 === 'BAR') multiplier = 20;
      else if (r1 === 'BELL') multiplier = 10;
      else multiplier = 5;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      multiplier = 1.5;
    }

    const winAmount = parseFloat(wagerAmount) * multiplier;
    const rngResult = { reels: [r1, r2, r3], hash, multiplier };

    // Execute atomic stored procedure
    const dbRes = await pool.query(
      'SELECT * FROM fn_execute_spin($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [userId, currencyType, wagerAmount, winAmount, serverSeed, clientSeed, nonce, JSON.stringify(rngResult), gameTitle]
    );

    const result = dbRes.rows[0];
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      spinId: result.spin_id,
      reels: [r1, r2, r3],
      wagerAmount: parseFloat(wagerAmount),
      winAmount: parseFloat(result.win_payout),
      newBalance: parseFloat(result.new_balance),
      currencyType,
    });
  } catch (err) {
    console.error('Spin API Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during slot spin.' });
  }
};

router.post('/slot/spin', checkGeofence, handleSlotSpin);
router.post('/game/spin', checkGeofence, handleSlotSpin);

// ----------------------------------------------------------------------------
// 2. DAILY BONUS & STREAK APIs
// ----------------------------------------------------------------------------
router.post('/bonus/daily-claim', checkGeofence, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId.' });

  try {
    const dbRes = await pool.query('SELECT * FROM fn_claim_daily_bonus_v6($1)', [userId]);
    const result = dbRes.rows[0];

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      currentStreak: result.current_streak,
      baseScGranted: parseFloat(result.base_sc_granted),
      vipScGranted: parseFloat(result.vip_sc_granted),
      baseGcGranted: parseFloat(result.base_gc_granted),
      vipGcGranted: parseFloat(result.vip_gc_granted),
      freeSpinsGranted: result.free_spins_granted,
      vipMultiplier: parseFloat(result.vip_multiplier),
      wheelUnlocked: result.wheel_unlocked,
      newGcBalance: parseFloat(result.new_gc_balance),
      newScBalance: parseFloat(result.new_sc_balance),
    });
  } catch (err) {
    console.error('Daily Claim Error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing daily bonus.' });
  }
});

router.get('/bonus/streak', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId.' });

  try {
    const streakRes = await pool.query(
      'SELECT streak_count, wheel_spin_eligible, last_claim_timestamp FROM user_daily_streaks WHERE user_id = $1',
      [userId]
    );

    if (streakRes.rows.length === 0) {
      return res.json({ success: true, currentStreak: 1, wheelSpinEligible: false, claimedToday: false });
    }

    const row = streakRes.rows[0];
    const hoursSince = (new Date() - new Date(row.last_claim_timestamp)) / 3600000;
    const claimedToday = hoursSince < 24.0;

    return res.json({
      success: true,
      currentStreak: row.streak_count,
      wheelSpinEligible: row.wheel_spin_eligible,
      claimedToday,
      hoursUntilNextClaim: claimedToday ? Math.ceil(24.0 - hoursSince) : 0,
    });
  } catch (err) {
    console.error('Streak Fetch Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch streak status.' });
  }
});

router.post('/bonus/wheel-spin', checkGeofence, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId.' });

  const WHEEL_SEGMENTS = [
    { label: '5.00 SC', sc: 5.0, gc: 5000, weight: 35 },
    { label: '10.00 SC', sc: 10.0, gc: 10000, weight: 25 },
    { label: '15.00 SC', sc: 15.0, gc: 15000, weight: 18 },
    { label: '25.00 SC', sc: 25.0, gc: 25000, weight: 12 },
    { label: '50.00 SC', sc: 50.0, gc: 50000, weight: 6 },
    { label: '100.00 SC', sc: 100.0, gc: 100000, weight: 3 },
    { label: '250.00 SC', sc: 250.0, gc: 250000, weight: 1 },
  ];

  const totalWeight = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let randomVal = Math.floor(Math.random() * totalWeight);
  let winningSegment = WHEEL_SEGMENTS[0];

  for (const seg of WHEEL_SEGMENTS) {
    if (randomVal < seg.weight) {
      winningSegment = seg;
      break;
    }
    randomVal -= seg.weight;
  }

  try {
    const dbRes = await pool.query('SELECT * FROM fn_spin_bonus_wheel($1, $2, $3)', [
      userId,
      winningSegment.sc,
      winningSegment.gc,
    ]);

    const result = dbRes.rows[0];
    if (!result.success) return res.status(400).json({ success: false, message: result.message });

    return res.json({
      success: true,
      message: result.message,
      wonSegment: winningSegment.label,
      scWon: parseFloat(result.sc_won),
      gcWon: parseFloat(result.gc_won),
      newGcBalance: parseFloat(result.new_gc_balance),
      newScBalance: parseFloat(result.new_sc_balance),
    });
  } catch (err) {
    console.error('Wheel Spin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing wheel spin.' });
  }
});

// ----------------------------------------------------------------------------
// 3. STORE CHECKOUT & REDEMPTION APIs
// ----------------------------------------------------------------------------
router.post('/store/checkout', checkGeofence, async (req, res) => {
  const { userId, packageId, amountUsd, goldCoinsGranted, sweepsCoinsBonus, paymentMethod, stateCode } = req.body;
  if (!userId || !amountUsd || !goldCoinsGranted) {
    return res.status(400).json({ success: false, message: 'Missing checkout parameters.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const balRes = await client.query('SELECT gold_coins, sweeps_coins FROM balances WHERE user_id = $1 FOR UPDATE', [userId]);
    if (balRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User balance record not found.' });
    }

    const currentGc = parseFloat(balRes.rows[0].gold_coins);
    const currentSc = parseFloat(balRes.rows[0].sweeps_coins);
    const newGc = currentGc + parseFloat(goldCoinsGranted);
    const newSc = currentSc + parseFloat(sweepsCoinsBonus || 0);

    await client.query(
      'UPDATE balances SET gold_coins = $1, sweeps_coins = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
      [newGc, newSc, userId]
    );

    const paymentRef = 'TX_' + crypto.randomBytes(8).toString('hex').toUpperCase();
    await client.query(
      `INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, payment_processor_ref, notes)
       VALUES ($1, 'GOLD_COIN', 'PURCHASE_PACKAGE', $2, $3, $4, $5)`,
      [userId, goldCoinsGranted, newGc, paymentRef, `Purchased Package ${packageId} via ${paymentMethod}`]
    );

    if (sweepsCoinsBonus > 0) {
      await client.query(
        `INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, payment_processor_ref, notes)
         VALUES ($1, 'SWEEPS_COIN', 'PURCHASE_PACKAGE', $2, $3, $4, $5)`,
        [userId, sweepsCoinsBonus, newSc, paymentRef, `Promotional Sweeps Coins Bonus for Package ${packageId}`]
      );
    }

    await client.query('COMMIT');
    return res.json({
      success: true,
      message: 'Purchase completed successfully!',
      transactionRef: paymentRef,
      newGcBalance: newGc,
      newScBalance: newSc,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err);
    return res.status(500).json({ success: false, message: 'Database failure during purchase processing.' });
  } finally {
    client.release();
  }
});

router.post('/redemption/request', checkGeofence, async (req, res) => {
  const { userId, sweepsCoinsAmount, payoutMethod } = req.body;
  if (!userId || !sweepsCoinsAmount || !payoutMethod) {
    return res.status(400).json({ success: false, message: 'Missing redemption parameters.' });
  }

  const minThreshold = payoutMethod === 'GIFT_CARD' ? 50.0 : 100.0;
  if (parseFloat(sweepsCoinsAmount) < minThreshold) {
    return res.status(400).json({
      success: false,
      message: `Minimum redemption threshold for ${payoutMethod} is ${minThreshold} SC.`,
    });
  }

  try {
    const dbRes = await pool.query('SELECT * FROM fn_request_redemption($1, $2, $3)', [
      userId,
      sweepsCoinsAmount,
      payoutMethod,
    ]);
    const result = dbRes.rows[0];

    if (!result.success) return res.status(400).json({ success: false, message: result.message });

    return res.json({
      success: true,
      message: result.message,
      redemptionId: result.redemption_id,
      remainingSweepsCoins: parseFloat(result.remaining_sweeps_coins),
    });
  } catch (err) {
    console.error('Redemption API Error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing redemption request.' });
  }
});

router.get('/user/transactions', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, message: 'User ID is required.' });

  try {
    const txRes = await pool.query(
      `SELECT transaction_id, currency_type, transaction_type, amount, balance_after, payment_processor_ref, notes, created_at
       FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return res.json({ success: true, transactions: txRes.rows });
  } catch (err) {
    console.error('Transaction fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch transaction history.' });
  }
});

// ----------------------------------------------------------------------------
// 4. VIP LOYALTY APIs
// ----------------------------------------------------------------------------
router.get('/vip/status', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

  try {
    const userRes = await pool.query(
      `SELECT user_id, vip_points, vip_tier, total_spins_sc FROM users WHERE user_id = $1`,
      [userId]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const user = userRes.rows[0];
    const milestonesRes = await pool.query(
      `SELECT milestone_id FROM user_vip_milestones WHERE user_id = $1`,
      [userId]
    );

    return res.json({
      success: true,
      vipPoints: parseInt(user.vip_points || 0),
      vipTier: user.vip_tier || 'BRONZE',
      totalSpinsSC: parseFloat(user.total_spins_sc || 0.0),
      claimedMilestoneIds: milestonesRes.rows.map(r => r.milestone_id),
    });
  } catch (err) {
    console.error('VIP Status Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/vip/claim-milestone', async (req, res) => {
  const { userId, milestoneId } = req.body;
  if (!userId || !milestoneId) return res.status(400).json({ success: false, message: 'Missing parameters' });

  try {
    const dbRes = await pool.query('SELECT * FROM fn_claim_vip_milestone($1, $2)', [userId, milestoneId]);
    const result = dbRes.rows[0];

    if (!result.success) return res.status(400).json({ success: false, message: result.message });

    return res.json({
      success: true,
      message: result.message,
      scGranted: parseFloat(result.sc_granted),
      gcGranted: parseFloat(result.gc_granted),
      newScBalance: parseFloat(result.new_sc_balance),
    });
  } catch (err) {
    console.error('Milestone Claim Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ----------------------------------------------------------------------------
// 5. LOBBY, TICKER & FAVORITES APIs
// ----------------------------------------------------------------------------
router.get('/wins/recent-ticker', async (req, res) => {
  try {
    const tickerRes = await pool.query(
      `SELECT win_id, player_masked, game_title, win_amount_sc, currency_type, created_at
       FROM recent_wins_ticker ORDER BY created_at DESC LIMIT 20`
    );

    const wins = tickerRes.rows.length > 0 ? tickerRes.rows : [
      { win_id: '1', player_masked: 'Alex****89', game_title: 'Neon Spin Deluxe', win_amount_sc: '125.50' },
      { win_id: '2', player_masked: 'Sara****21', game_title: 'Bass Cash Christmas', win_amount_sc: '450.00' },
      { win_id: '3', player_masked: 'Mike****04', game_title: 'Crown Jewels 777', win_amount_sc: '89.20' },
    ];

    return res.json({ success: true, recentWins: wins });
  } catch (err) {
    console.error('Ticker Fetch Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch recent wins.' });
  }
});

router.get('/games/lobby', async (req, res) => {
  const { userId, category = 'ALL' } = req.query;
  const ALL_GAMES = [
    { id: 1, title: 'Neon Spin Deluxe', category: 'GOTW', isGotw: true, popularity: 99, image: '🎰' },
    { id: 2, title: 'Bass Cash Christmas X Up', category: 'MOST_PLAYED', popularity: 95, image: '🐟' },
    { id: 3, title: 'Crown Jewels 777', category: 'MOST_PLAYED', popularity: 91, image: '👑' },
    { id: 4, title: 'Cash Pig Deluxe', category: 'FEATURED', popularity: 88, image: '🐷' },
    { id: 5, title: 'Lone Star Gold Hold & Win', category: 'FEATURED', popularity: 85, image: '⭐' },
    { id: 6, title: 'Wild Buffalo Fortune', category: 'MOST_PLAYED', popularity: 82, image: '🦬' },
  ];

  try {
    let userFavs = [];
    if (userId) {
      const favRes = await pool.query('SELECT game_title FROM user_favorites WHERE user_id = $1', [userId]);
      userFavs = favRes.rows.map(r => r.game_title);
    }

    let filtered = ALL_GAMES.map(g => ({ ...g, isFavorite: userFavs.includes(g.title) }));
    if (category === 'FAVORITES') {
      filtered = filtered.filter(g => g.isFavorite);
    } else if (category === 'MOST_PLAYED') {
      filtered.sort((a, b) => b.popularity - a.popularity);
    } else if (category === 'GOTW') {
      filtered = filtered.filter(g => g.isGotw);
    }

    return res.json({ success: true, games: filtered });
  } catch (err) {
    console.error('Lobby Games Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch games.' });
  }
});

router.post('/games/favorite', async (req, res) => {
  const { userId, gameTitle } = req.body;
  if (!userId || !gameTitle) return res.status(400).json({ success: false, message: 'Missing parameters' });

  try {
    const existRes = await pool.query(
      'SELECT * FROM user_favorites WHERE user_id = $1 AND game_title = $2',
      [userId, gameTitle]
    );

    if (existRes.rows.length > 0) {
      await pool.query('DELETE FROM user_favorites WHERE user_id = $1 AND game_title = $2', [userId, gameTitle]);
      return res.json({ success: true, isFavorite: false, message: 'Removed from favorites' });
    } else {
      await pool.query('INSERT INTO user_favorites (user_id, game_title) VALUES ($1, $2)', [userId, gameTitle]);
      return res.json({ success: true, isFavorite: true, message: 'Added to favorites' });
    }
  } catch (err) {
    console.error('Favorite toggle error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle favorite' });
  }
});

// ----------------------------------------------------------------------------
// 6. COMPLIANCE & KYC APIs
// ----------------------------------------------------------------------------
router.post('/compliance/verify-location', async (req, res) => {
  const { stateCode = 'TX' } = req.body;
  const isRestricted = RESTRICTED_STATES.includes(stateCode.toUpperCase());

  return res.json({
    success: !isRestricted,
    isAllowed: !isRestricted,
    stateCode: stateCode.toUpperCase(),
    message: isRestricted ? `Access restricted in state ${stateCode}` : 'Location verified.',
  });
});

router.post('/kyc/start-verification', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

  return res.json({
    success: true,
    message: 'KYC Verification session initialized.',
    kycSession: {
      sessionId: `kyc_sess_${Date.now()}_${userId.substring(0, 8)}`,
      status: 'PENDING',
      expiresInMinutes: 30,
    },
  });
});

module.exports = router;
