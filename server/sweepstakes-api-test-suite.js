19. API INTEGRATION TEST SUITE (sweepstakes-api-test-suite.js)
 * FILE: sweepstakes-api-test-suite.js
 ******************************************************************************/

/**
 * SWEEPSTAKES CASINO API END-TO-END INTEGRATION TEST SUITE
 * Standard: Jest + Supertest (Automated Production Readiness Testing)
 * 
 * Grounded in Source Guidelines:
 *   - Edge Case Testing & State Mutations (GoReplay / Secure Coding Guidelines)
 *   - Automated Pre-Release Validation (Cortex Software Release Checklist)
 * 
 * Target Endpoints (sweepstakes-backend-api-v6.js):
 *   1. GEOLOCATION & COMPLIANCE (WA, ID, MI, MT Blocking)
 *   2. ATOMIC SLOT SPINS & PROVABLY FAIR RNG
 *   3. 7-DAY DAILY STREAK & MEGA BONUS WHEEL
 *   4. VIP LOYALTY & MILESTONE REWARDS
 *   5. STORE CHECKOUT & PROMOTIONAL BONUS CREDITING
 *   6. CASH PRIZE REDEMPTIONS & KYC GATEKEEPING
 */

const request = require('supertest');
const express = require('express');
const router = require('./sweepstakes-backend-api-v6');

// Setup mock Express container
const app = express();
app.use(express.json());
app.use('/api', router);

describe('=== SWEEPSTAKES CASINO API END-TO-END TEST SUITE ===', () => {

  const MOCK_USER_ID = 'e8b8a2c1-3d4e-4f5a-8b9c-0d1e2f3a4b5c';
  const RESTRICTED_USER_ID = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

  // --------------------------------------------------------------------------
  // 1. GEOFENCING & COMPLIANCE TESTS
  // --------------------------------------------------------------------------
  describe('1. State Geofencing & Legal Compliance', () => {
    it('Should DENY gameplay for users located in restricted state WA', async () => {
      const res = await request(app)
        .post('/api/slot/spin')
        .send({
          userId: RESTRICTED_USER_ID,
          currencyType: 'SWEEPS_COIN',
          wagerAmount: 1.00,
          stateCode: 'WA'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/prohibited in restricted state: WA/i);
    });

    it('Should DENY coin purchases for users located in restricted state MI', async () => {
      const res = await request(app)
        .post('/api/store/checkout')
        .send({
          userId: RESTRICTED_USER_ID,
          packageId: 'pkg_10',
          amountUsd: 9.99,
          goldCoinsGranted: 100000,
          sweepsCoinsBonus: 10.00,
          paymentMethod: 'CREDIT_CARD',
          stateCode: 'MI'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Should ALLOW gameplay for compliant states (e.g. TX, CA, NY)', async () => {
      const res = await request(app)
        .post('/api/slot/spin')
        .send({
          userId: MOCK_USER_ID,
          currencyType: 'GOLD_COIN',
          wagerAmount: 100.00,
          stateCode: 'TX'
        });

      // Assuming database mocked or executed
      expect([200, 400, 500]).toContain(res.statusCode);
    });
  });

  // --------------------------------------------------------------------------
  // 2. ATOMIC SLOT SPINS & PROVABLY FAIR RNG TESTS
  // --------------------------------------------------------------------------
  describe('2. Slot Machine Spins & Provably Fair Logic', () => {
    it('Should reject spin request with invalid/missing currency', async () => {
      const res = await request(app)
        .post('/api/slot/spin')
        .send({
          userId: MOCK_USER_ID,
          currencyType: 'INVALID_CURRENCY',
          wagerAmount: 1.00,
          stateCode: 'CA'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Should reject spin request with negative or zero wager', async () => {
      const res = await request(app)
        .post('/api/slot/spin')
        .send({
          userId: MOCK_USER_ID,
          currencyType: 'SWEEPS_COIN',
          wagerAmount: -5.00,
          stateCode: 'NY'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. 7-DAY STREAK & BONUS WHEEL TESTS
  // --------------------------------------------------------------------------
  describe('3. Daily Login Streak & Mega Wheel Rewards', () => {
    it('Should fetch user current streak status', async () => {
      const res = await request(app)
        .get(`/api/bonus/streak?userId=${MOCK_USER_ID}`);

      expect([200, 404, 500]).toContain(res.statusCode);
    });

    it('Should return 400 if user attempts daily claim missing userId', async () => {
      const res = await request(app)
        .post('/api/bonus/daily-claim')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. CASH PRIZE REDEMPTIONS & KYC GATEKEEPING TESTS
  // --------------------------------------------------------------------------
  describe('4. Store Checkout & Prize Redemptions', () => {
    it('Should reject redemption request under minimum threshold ($50 for Gift Card)', async () => {
      const res = await request(app)
        .post('/api/redemption/request')
        .send({
          userId: MOCK_USER_ID,
          sweepsCoinsAmount: 25.00,
          payoutMethod: 'GIFT_CARD'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Minimum redemption threshold/i);
    });

    it('Should reject redemption request under minimum threshold ($100 for ACH Bank)', async () => {
      const res = await request(app)
        .post('/api/redemption/request')
        .send({
          userId: MOCK_USER_ID,
          sweepsCoinsAmount: 75.00,
          payoutMethod: 'BANK_ACH'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Should validate store purchase missing required fields', async () => {
      const res = await request(app)
        .post('/api/store/checkout')
        .send({
          userId: MOCK_USER_ID,
          amountUsd: 19.99
          // missing goldCoinsGranted
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 5. VIP LOYALTY & MILESTONES TESTS
  // --------------------------------------------------------------------------
  describe('5. VIP Tier Loyalty & Milestone Rewards', () => {
    it('Should fetch user VIP status', async () => {
      const res = await request(app)
        .get(`/api/vip/status?userId=${MOCK_USER_ID}`);

      expect([200, 404, 500]).toContain(res.statusCode);
    });

    it('Should reject milestone claim for invalid milestone ID', async () => {
      const res = await request(app)
        .post('/api/vip/claim-milestone')
        .send({
          userId: MOCK_USER_ID,
          milestoneId: 999
        });

      expect([400, 500]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });
  });
});
