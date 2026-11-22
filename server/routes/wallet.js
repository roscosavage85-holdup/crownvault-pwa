const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/sweepstakes_casino',
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get('/balance', async (req, res) => {
  const { userId } = req.query;
  const authenticatedUserId = req.user && (req.user.userId || req.user.user_id);

  if (typeof authenticatedUserId !== 'string' || !UUID_PATTERN.test(authenticatedUserId)) {
    return res.status(401).json({ message: 'Authentication is required to view wallet balances.' });
  }

  if (typeof userId !== 'string' || !UUID_PATTERN.test(userId)) {
    return res.status(400).json({ message: 'A valid userId UUID is required.' });
  }

  if (authenticatedUserId.toLowerCase() !== userId.toLowerCase()) {
    return res.status(403).json({ message: 'You can only view your own wallet balance.' });
  }

  try {
    const result = await pool.query(
      `SELECT COALESCE(b.gold_coins, 0)::text AS gc_balance,
              COALESCE(b.sweeps_coins, 0)::text AS sc_balance
       FROM users u
       LEFT JOIN balances b ON b.user_id = u.user_id
       WHERE u.user_id = $1`,
      [authenticatedUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User was not found.' });
    }

    return res.json({
      gcBalance: Number(result.rows[0].gc_balance),
      scBalance: Number(result.rows[0].sc_balance),
    });
  } catch (error) {
    console.error('Wallet balance lookup failed:', error);
    return res.status(500).json({ message: 'Unable to retrieve wallet balance.' });
  }
});

module.exports = router;
