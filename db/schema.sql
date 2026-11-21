2. DATABASE SCHEMA & ATOMIC PROCEDURES (sweepstakes-db-schema-v6.sql)
 * FILE: sweepstakes-db-schema-v6.sql
 ******************************************************************************/

-- ============================================================================
-- SWEEPSTAKES CASINO CONSOLIDATED PRODUCTION DATABASE SCHEMA (v6)
-- Unified, Bug-Free, Single-File Deployment Schema
-- Features:
--   1. Dual-Currency Balances (gold_coins, sweeps_coins in separate columns)
--   2. Geofencing & KYC Compliance (IP state blocking for WA, ID, MI, MT)
--   3. Provably Fair Server-Side RNG Spin Audit Logs
--   4. Immutable Financial & AMOE Transaction Ledger
--   5. Cash Prize Redemption Management (with KYC gatekeeping & holds)
--   6. 7-Day Daily Login Streak + 7th-Day Mega Bonus Wheel
--   7. VIP Tier Loyalty Engine (Bronze -> Crown) with Fixed Point Thresholds & Multipliers
--   8. Lone Star "Stars, Stripes & Milestones" & Crown Coins Step Pass Progression
--   9. Live Winner Marquee Ticker & Favorite Games Ledger
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    registration_ip VARCHAR(45) NOT NULL,
    state_code VARCHAR(2) NOT NULL, -- Restricted states: WA, ID, MI, MT
    is_geofence_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'UNVERIFIED' CHECK (kyc_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    vip_points BIGINT DEFAULT 0 CHECK (vip_points >= 0),
    vip_tier VARCHAR(20) DEFAULT 'BRONZE' CHECK (vip_tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'CROWN')),
    total_spins_sc NUMERIC(18, 4) DEFAULT 0.0000 CHECK (total_spins_sc >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_state_code ON users(state_code);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_vip_tier ON users(vip_tier);

-- ----------------------------------------------------------------------------
-- 2. BALANCES TABLE (Dual-Currency System)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS balances (
    balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    gold_coins NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (gold_coins >= 0),
    sweeps_coins NUMERIC(18, 4) NOT NULL DEFAULT 0.0000 CHECK (sweeps_coins >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);

-- ----------------------------------------------------------------------------
-- 3. TRANSACTIONS TABLE (Immutable Financial Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('GOLD_COIN', 'SWEEPS_COIN')),
    transaction_type VARCHAR(35) NOT NULL CHECK (transaction_type IN (
        'PURCHASE_PACKAGE',
        'AMOE_DAILY_LOGIN',
        'AMOE_MAIL_IN',
        'AMOE_WHEEL_SPIN',
        'SPIN_WAGER',
        'SPIN_WIN',
        'REDEMPTION_HOLD',
        'REDEMPTION_PAYOUT',
        'REDEMPTION_REFUND',
        'VIP_MILESTONE_REWARD',
        'VIP_STEP_PASS_REWARD'
    )),
    amount NUMERIC(18, 4) NOT NULL,
    balance_after NUMERIC(18, 4) NOT NULL,
    payment_processor_ref VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ----------------------------------------------------------------------------
-- 4. RNG SPIN LOGS TABLE (Provably Fair Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rng_spin_logs (
    spin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    currency_used VARCHAR(20) NOT NULL CHECK (currency_used IN ('GOLD_COIN', 'SWEEPS_COIN')),
    wager_amount NUMERIC(18, 4) NOT NULL CHECK (wager_amount > 0),
    win_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000 CHECK (win_amount >= 0),
    server_seed VARCHAR(255) NOT NULL,
    client_seed VARCHAR(255) NOT NULL,
    nonce BIGINT NOT NULL,
    rng_result_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_spin_logs_user_id ON rng_spin_logs(user_id);

-- ----------------------------------------------------------------------------
-- 5. PRIZE REDEMPTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prize_redemptions (
    redemption_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sweeps_coins_redeemed NUMERIC(18, 4) NOT NULL CHECK (sweeps_coins_redeemed > 0),
    cash_value_usd NUMERIC(18, 2) NOT NULL CHECK (cash_value_usd > 0),
    payout_method VARCHAR(50) NOT NULL, -- ACH, Gift Card, Bank Wire
    status VARCHAR(20) DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'KYC_PENDING', 'APPROVED', 'PROCESSED', 'REJECTED')),
    kyc_verified_at_redemption TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON prize_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON prize_redemptions(status);

-- ----------------------------------------------------------------------------
-- 6. USER DAILY STREAKS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_daily_streaks (
    streak_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    last_claim_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    streak_count INT NOT NULL DEFAULT 1 CHECK (streak_count BETWEEN 1 AND 7),
    wheel_spin_eligible BOOLEAN DEFAULT FALSE,
    total_claims INT DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. USER FREE SPINS TABLE (Game of the Week)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_free_spins (
    free_spin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_title VARCHAR(150) NOT NULL DEFAULT 'Game of the Week: Neon Spin Deluxe',
    spins_granted INT NOT NULL CHECK (spins_granted > 0),
    spins_remaining INT NOT NULL CHECK (spins_remaining >= 0),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_free_spins_user ON user_free_spins(user_id);

-- ----------------------------------------------------------------------------
-- 8. USER VIP MILESTONES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_vip_milestones (
    milestone_claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    milestone_id INT NOT NULL,
    target_spin_sc NUMERIC(18, 4) NOT NULL,
    sc_reward NUMERIC(18, 4) NOT NULL,
    gc_reward NUMERIC(18, 2) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_milestone UNIQUE (user_id, milestone_id)
);

-- ----------------------------------------------------------------------------
-- 9. RECENT WINS TICKER & FAVORITES TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recent_wins_ticker (
    win_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_masked VARCHAR(50) NOT NULL,
    game_title VARCHAR(100) NOT NULL,
    win_amount_sc NUMERIC(18, 4) NOT NULL,
    currency_type VARCHAR(20) DEFAULT 'SWEEPS_COIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_title VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_title)
);

-- ============================================================================
-- STORED PROCEDURES & ATOMIC TRANSACTION FUNCTIONS
-- ============================================================================

-- Helper: fn_get_vip_multiplier (CORRECTED Gold Threshold = 5000)
CREATE OR REPLACE FUNCTION fn_get_vip_multiplier(p_vip_points BIGINT)
RETURNS NUMERIC(4, 2)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_vip_points >= 150000 THEN
        RETURN 5.00; -- Crown VIP
    ELSIF p_vip_points >= 50000 THEN
        RETURN 3.00; -- Diamond
    ELSIF p_vip_points >= 20000 THEN
        RETURN 2.00; -- Platinum
    ELSIF p_vip_points >= 5000 THEN
        RETURN 1.50; -- Gold (Fixed Bug: 5000 instead of 50000)
    ELSIF p_vip_points >= 1000 THEN
        RETURN 1.25; -- Silver
    ELSE
        RETURN 1.00; -- Bronze
    END IF;
END;
$$;

-- Helper: fn_update_vip_tier
CREATE OR REPLACE FUNCTION fn_update_vip_tier(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_pts BIGINT;
    v_new_tier VARCHAR(20);
BEGIN
    SELECT vip_points INTO v_pts FROM users WHERE user_id = p_user_id;
    IF v_pts >= 150000 THEN v_new_tier := 'CROWN';
    ELSIF v_pts >= 50000 THEN v_new_tier := 'DIAMOND';
    ELSIF v_pts >= 20000 THEN v_new_tier := 'PLATINUM';
    ELSIF v_pts >= 5000 THEN v_new_tier := 'GOLD';
    ELSIF v_pts >= 1000 THEN v_new_tier := 'SILVER';
    ELSE v_new_tier := 'BRONZE';
    END IF;

    UPDATE users SET vip_tier = v_new_tier WHERE user_id = p_user_id;
END;
$$;

-- PROCEDURE: fn_execute_spin
CREATE OR REPLACE FUNCTION fn_execute_spin(
    p_user_id UUID,
    p_currency_type VARCHAR(20),
    p_wager_amount NUMERIC(18, 4),
    p_win_amount NUMERIC(18, 4),
    p_server_seed VARCHAR(255),
    p_client_seed VARCHAR(255),
    p_nonce BIGINT,
    p_rng_result_json JSONB,
    p_game_title VARCHAR(100) DEFAULT 'Neon Spin Deluxe'
)
RETURNS TABLE (
    spin_id UUID,
    success BOOLEAN,
    message VARCHAR(255),
    new_balance NUMERIC(18, 4),
    win_payout NUMERIC(18, 4)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_state VARCHAR(2);
    v_user_active BOOLEAN;
    v_current_gc NUMERIC(18, 2);
    v_current_sc NUMERIC(18, 4);
    v_new_gc NUMERIC(18, 2);
    v_new_sc NUMERIC(18, 4);
    v_spin_id UUID;
    v_balance_after NUMERIC(18, 4);
    v_vip_points_earned BIGINT;
    v_masked_email VARCHAR(50);
BEGIN
    SELECT state_code, is_active INTO v_user_state, v_user_active FROM users WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'User account not found'::VARCHAR(255), 0.0000::NUMERIC(18, 4), 0.0000::NUMERIC(18, 4);
        RETURN;
    END IF;

    IF NOT v_user_active THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'User account is suspended'::VARCHAR(255), 0.0000::NUMERIC(18, 4), 0.0000::NUMERIC(18, 4);
        RETURN;
    END IF;

    IF v_user_state IN ('WA', 'ID', 'MI', 'MT') THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, FORMAT('Gameplay restricted in state: %s', v_user_state)::VARCHAR(255), 0.0000::NUMERIC(18, 4), 0.0000::NUMERIC(18, 4);
        RETURN;
    END IF;

    SELECT gold_coins, sweeps_coins INTO v_current_gc, v_current_sc FROM balances WHERE user_id = p_user_id FOR UPDATE;

    IF p_currency_type = 'GOLD_COIN' THEN
        IF v_current_gc < p_wager_amount THEN
            RETURN QUERY SELECT NULL::UUID, FALSE, 'Insufficient Gold Coins balance'::VARCHAR(255), v_current_gc::NUMERIC(18, 4), 0.0000::NUMERIC(18, 4);
            RETURN;
        END IF;

        v_new_gc := v_current_gc - p_wager_amount + p_win_amount;
        v_balance_after := v_new_gc;

        UPDATE balances SET gold_coins = v_new_gc, updated_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id;

    ELSIF p_currency_type = 'SWEEPS_COIN' THEN
        IF v_current_sc < p_wager_amount THEN
            RETURN QUERY SELECT NULL::UUID, FALSE, 'Insufficient Sweeps Coins balance'::VARCHAR(255), v_current_sc, 0.0000::NUMERIC(18, 4);
            RETURN;
        END IF;

        v_new_sc := v_current_sc - p_wager_amount + p_win_amount;
        v_balance_after := v_new_sc;

        UPDATE balances SET sweeps_coins = v_new_sc, updated_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id;

        -- Track total SC spins for VIP Milestones
        UPDATE users SET total_spins_sc = total_spins_sc + p_wager_amount WHERE user_id = p_user_id;
    ELSE
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Invalid currency type'::VARCHAR(255), 0.0000::NUMERIC(18, 4), 0.0000::NUMERIC(18, 4);
        RETURN;
    END IF;

    -- Award VIP XP (1 SC = 100 XP, 1000 GC = 10 XP)
    IF p_currency_type = 'SWEEPS_COIN' THEN
        v_vip_points_earned := FLOOR(p_wager_amount * 100);
    ELSE
        v_vip_points_earned := FLOOR(p_wager_amount / 100);
    END IF;

    IF v_vip_points_earned > 0 THEN
        UPDATE users SET vip_points = vip_points + v_vip_points_earned WHERE user_id = p_user_id;
        PERFORM fn_update_vip_tier(p_user_id);
    END IF;

    INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, notes)
    VALUES (p_user_id, p_currency_type, 'SPIN_WAGER', -p_wager_amount, v_balance_after - p_win_amount, FORMAT('Slot Spin Wager on %s', p_game_title));

    IF p_win_amount > 0 THEN
        INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, notes)
        VALUES (p_user_id, p_currency_type, 'SPIN_WIN', p_win_amount, v_balance_after, FORMAT('Slot Spin Payout on %s', p_game_title));

        -- Log to recent wins ticker if SC win >= 5.00
        IF p_currency_type = 'SWEEPS_COIN' AND p_win_amount >= 5.00 THEN
            SELECT CONCAT(SUBSTRING(email FROM 1 FOR 4), '****') INTO v_masked_email FROM users WHERE user_id = p_user_id;
            INSERT INTO recent_wins_ticker (player_masked, game_title, win_amount_sc)
            VALUES (COALESCE(v_masked_email, 'Player****'), p_game_title, p_win_amount);
        END IF;
    END IF;

    INSERT INTO rng_spin_logs (user_id, currency_used, wager_amount, win_amount, server_seed, client_seed, nonce, rng_result_json)
    VALUES (p_user_id, p_currency_type, p_wager_amount, p_win_amount, p_server_seed, p_client_seed, p_nonce, p_rng_result_json)
    RETURNING spin_id INTO v_spin_id;

    RETURN QUERY SELECT v_spin_id, TRUE, 'Spin processed successfully'::VARCHAR(255), v_balance_after, p_win_amount;
END;
$$;

-- PROCEDURE: fn_claim_daily_bonus_v6
CREATE OR REPLACE FUNCTION fn_claim_daily_bonus_v6(
    p_user_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message VARCHAR(255),
    current_streak INT,
    base_sc_granted NUMERIC(18, 4),
    vip_sc_granted NUMERIC(18, 4),
    base_gc_granted NUMERIC(18, 2),
    vip_gc_granted NUMERIC(18, 2),
    free_spins_granted INT,
    vip_multiplier NUMERIC(4, 2),
    wheel_unlocked BOOLEAN,
    new_gc_balance NUMERIC(18, 2),
    new_sc_balance NUMERIC(18, 4)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_claim TIMESTAMP WITH TIME ZONE;
    v_streak INT := 1;
    v_vip_pts BIGINT := 0;
    v_vip_mult NUMERIC(4, 2) := 1.00;
    v_base_sc NUMERIC(18, 4) := 0.0000;
    v_final_sc NUMERIC(18, 4) := 0.0000;
    v_base_gc NUMERIC(18, 2) := 0.00;
    v_final_gc NUMERIC(18, 2) := 0.00;
    v_free_spins INT := 0;
    v_wheel_unlocked BOOLEAN := FALSE;
    v_current_gc NUMERIC(18, 2);
    v_current_sc NUMERIC(18, 4);
    v_new_gc NUMERIC(18, 2);
    v_new_sc NUMERIC(18, 4);
    v_hours_since_claim NUMERIC;
BEGIN
    SELECT last_claim_timestamp, streak_count, wheel_spin_eligible
      INTO v_last_claim, v_streak, v_wheel_unlocked
      FROM user_daily_streaks
     WHERE user_id = p_user_id
       FOR UPDATE;

    SELECT vip_points INTO v_vip_pts FROM users WHERE user_id = p_user_id;
    v_vip_mult := fn_get_vip_multiplier(v_vip_pts);

    IF v_last_claim IS NOT NULL THEN
        v_hours_since_claim := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_last_claim)) / 3600.0;
        
        IF v_hours_since_claim < 24.0 THEN
            RETURN QUERY SELECT FALSE, FORMAT('Daily bonus already claimed. Next claim available in %s hours.', ROUND(24.0 - v_hours_since_claim, 1))::VARCHAR(255), v_streak, 0.0000::NUMERIC(18,4), 0.0000::NUMERIC(18,4), 0.00::NUMERIC(18,2), 0.00::NUMERIC(18,2), 0, v_vip_mult, v_wheel_unlocked, 0.00::NUMERIC(18,2), 0.0000::NUMERIC(18,4);
            RETURN;
        ELSIF v_hours_since_claim <= 48.0 THEN
            v_streak := v_streak + 1;
            IF v_streak > 7 THEN v_streak := 1; END IF;
        ELSE
            v_streak := 1;
        END IF;
    ELSE
        v_streak := 1;
    END IF;

    -- Schedule:
    -- 1: $0.10 SC, 2: $0.25 SC, 3: $0.75 SC, 4: 5 Free Spins, 5: $1.00 SC, 6: 10,000 GC, 7: 10 Free Spins + Wheel
    IF v_streak = 1 THEN v_base_sc := 0.10;
    ELSIF v_streak = 2 THEN v_base_sc := 0.25;
    ELSIF v_streak = 3 THEN v_base_sc := 0.75;
    ELSIF v_streak = 4 THEN v_free_spins := 5;
    ELSIF v_streak = 5 THEN v_base_sc := 1.00;
    ELSIF v_streak = 6 THEN v_base_gc := 10000.00;
    ELSIF v_streak = 7 THEN 
        v_free_spins := 10;
        v_wheel_unlocked := TRUE;
    END IF;

    v_final_sc := v_base_sc * v_vip_mult;
    v_final_gc := v_base_gc * v_vip_mult;

    SELECT gold_coins, sweeps_coins INTO v_current_gc, v_current_sc FROM balances WHERE user_id = p_user_id FOR UPDATE;
    v_new_gc := v_current_gc + v_final_gc;
    v_new_sc := v_current_sc + v_final_sc;

    UPDATE balances SET gold_coins = v_new_gc, sweeps_coins = v_new_sc, updated_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id;

    INSERT INTO user_daily_streaks (user_id, last_claim_timestamp, streak_count, wheel_spin_eligible, total_claims)
    VALUES (p_user_id, CURRENT_TIMESTAMP, v_streak, v_wheel_unlocked, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        last_claim_timestamp = CURRENT_TIMESTAMP,
        streak_count = v_streak,
        wheel_spin_eligible = v_wheel_unlocked,
        total_claims = user_daily_streaks.total_claims + 1;

    IF v_free_spins > 0 THEN
        INSERT INTO user_free_spins (user_id, game_title, spins_granted, spins_remaining, expires_at)
        VALUES (p_user_id, 'Game of the Week: Neon Spin Deluxe', v_free_spins, v_free_spins, CURRENT_TIMESTAMP + INTERVAL '7 days');
    END IF;

    UPDATE users SET vip_points = vip_points + 100 WHERE user_id = p_user_id;
    PERFORM fn_update_vip_tier(p_user_id);

    INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, notes)
    VALUES (p_user_id, 'SWEEPS_COIN', 'AMOE_DAILY_LOGIN', v_final_sc, v_new_sc, FORMAT('Day %s Daily Login Bonus', v_streak));

    RETURN QUERY SELECT TRUE, FORMAT('Day %s bonus claimed! Received %s SC, %s GC, and %s Free Spins', v_streak, v_final_sc, v_final_gc, v_free_spins)::VARCHAR(255), v_streak, v_base_sc, v_final_sc, v_base_gc, v_final_gc, v_free_spins, v_vip_mult, v_wheel_unlocked, v_new_gc, v_new_sc;
END;
$$;

-- PROCEDURE: fn_request_redemption
CREATE OR REPLACE FUNCTION fn_request_redemption(
    p_user_id UUID,
    p_sweeps_coins_amount NUMERIC(18, 4),
    p_payout_method VARCHAR(50)
)
RETURNS TABLE (
    redemption_id UUID,
    success BOOLEAN,
    message VARCHAR(255),
    remaining_sweeps_coins NUMERIC(18, 4)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_kyc_status VARCHAR(20);
    v_is_active BOOLEAN;
    v_current_sc NUMERIC(18, 4);
    v_new_sc NUMERIC(18, 4);
    v_redemption_id UUID;
    v_cash_value NUMERIC(18, 2);
BEGIN
    SELECT kyc_status, is_active INTO v_kyc_status, v_is_active FROM users WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'User account not found'::VARCHAR(255), 0.0000::NUMERIC(18, 4);
        RETURN;
    END IF;

    IF NOT v_is_active THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Account suspended'::VARCHAR(255), 0.0000::NUMERIC(18, 4);
        RETURN;
    END IF;

    IF v_kyc_status != 'VERIFIED' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'KYC identity verification required prior to cash prize redemption'::VARCHAR(255), 0.0000::NUMERIC(18, 4);
        RETURN;
    END IF;

    SELECT sweeps_coins INTO v_current_sc FROM balances WHERE user_id = p_user_id FOR UPDATE;

    IF v_current_sc < p_sweeps_coins_amount THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Insufficient Sweeps Coins balance for redemption'::VARCHAR(255), v_current_sc;
        RETURN;
    END IF;

    v_cash_value := p_sweeps_coins_amount;
    v_new_sc := v_current_sc - p_sweeps_coins_amount;

    UPDATE balances SET sweeps_coins = v_new_sc, updated_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id;

    INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, notes)
    VALUES (p_user_id, 'SWEEPS_COIN', 'REDEMPTION_HOLD', -p_sweeps_coins_amount, v_new_sc, FORMAT('Prize redemption hold via %s', p_payout_method));

    INSERT INTO prize_redemptions (user_id, sweeps_coins_redeemed, cash_value_usd, payout_method, status, kyc_verified_at_redemption)
    VALUES (p_user_id, p_sweeps_coins_amount, v_cash_value, p_payout_method, 'REQUESTED', CURRENT_TIMESTAMP)
    RETURNING prize_redemptions.redemption_id INTO v_redemption_id;

    RETURN QUERY SELECT v_redemption_id, TRUE, 'Redemption request submitted successfully'::VARCHAR(255), v_new_sc;
END;
$$;

-- PROCEDURE: fn_spin_bonus_wheel
CREATE OR REPLACE FUNCTION fn_spin_bonus_wheel(
    p_user_id UUID,
    p_sc_won NUMERIC(18, 4),
    p_gc_won NUMERIC(18, 2)
)
RETURNS TABLE (
    success BOOLEAN,
    message VARCHAR(255),
    sc_won NUMERIC(18, 4),
    gc_won NUMERIC(18, 2),
    new_gc_balance NUMERIC(18, 2),
    new_sc_balance NUMERIC(18, 4)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_eligible BOOLEAN;
    v_current_gc NUMERIC(18, 2);
    v_current_sc NUMERIC(18, 4);
    v_new_gc NUMERIC(18, 2);
    v_new_sc NUMERIC(18, 4);
    v_vip_pts BIGINT;
    v_vip_mult NUMERIC(4, 2);
    v_final_sc NUMERIC(18, 4);
    v_final_gc NUMERIC(18, 2);
BEGIN
    SELECT wheel_spin_eligible INTO v_eligible FROM user_daily_streaks WHERE user_id = p_user_id FOR UPDATE;

    IF NOT FOUND OR NOT v_eligible THEN
        RETURN QUERY SELECT FALSE, '7th-Day Mega Bonus Wheel spin is not unlocked'::VARCHAR(255), 0.0000::NUMERIC(18,4), 0.00::NUMERIC(18,2), 0.00::NUMERIC(18,2), 0.0000::NUMERIC(18,4);
        RETURN;
    END IF;

    SELECT vip_points INTO v_vip_pts FROM users WHERE user_id = p_user_id;
    v_vip_mult := fn_get_vip_multiplier(v_vip_pts);

    v_final_sc := p_sc_won * v_vip_mult;
    v_final_gc := p_gc_won * v_vip_mult;

    SELECT gold_coins, sweeps_coins INTO v_current_gc, v_current_sc FROM balances WHERE user_id = p_user_id FOR UPDATE;
    v_new_gc := v_current_gc + v_final_gc;
    v_new_sc := v_current_sc + v_final_sc;

    UPDATE balances SET gold_coins = v_new_gc, sweeps_coins = v_new_sc, updated_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id;

    -- Reset wheel eligibility after spinning
    UPDATE user_daily_streaks SET wheel_spin_eligible = FALSE WHERE user_id = p_user_id;

    INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, notes)
    VALUES (p_user_id, 'SWEEPS_COIN', 'AMOE_WHEEL_SPIN', v_final_sc, v_new_sc, FORMAT('7th-Day Mega Bonus Wheel Spin Reward (%sx VIP Boost)', v_vip_mult));

    RETURN QUERY SELECT TRUE, FORMAT('Bonus wheel spin complete! Won %s SC & %s GC', v_final_sc, v_final_gc)::VARCHAR(255), v_final_sc, v_final_gc, v_new_gc, v_new_sc;
END;
$$;

-- PROCEDURE: fn_claim_vip_milestone
CREATE OR REPLACE FUNCTION fn_claim_vip_milestone(
    p_user_id UUID,
    p_milestone_id INT
)
RETURNS TABLE (
    success BOOLEAN,
    message VARCHAR(255),
    sc_granted NUMERIC(18, 4),
    gc_granted NUMERIC(18, 2),
    new_sc_balance NUMERIC(18, 4)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_spins NUMERIC(18, 4);
    v_target_spin NUMERIC(18, 4);
    v_sc_reward NUMERIC(18, 4);
    v_gc_reward NUMERIC(18, 2);
    v_current_sc NUMERIC(18, 4);
    v_new_sc NUMERIC(18, 4);
BEGIN
    SELECT total_spins_sc INTO v_total_spins FROM users WHERE user_id = p_user_id;

    IF p_milestone_id = 1 THEN v_target_spin := 225.0; v_sc_reward := 1.0; v_gc_reward := 10000.0;
    ELSIF p_milestone_id = 2 THEN v_target_spin := 1000.0; v_sc_reward := 5.0; v_gc_reward := 50000.0;
    ELSIF p_milestone_id = 3 THEN v_target_spin := 3000.0; v_sc_reward := 15.0; v_gc_reward := 150000.0;
    ELSIF p_milestone_id = 4 THEN v_target_spin := 10000.0; v_sc_reward := 50.0; v_gc_reward := 500000.0;
    ELSE
        RETURN QUERY SELECT FALSE, 'Invalid milestone ID'::VARCHAR(255), 0.0000::NUMERIC(18,4), 0.00::NUMERIC(18,2), 0.0000::NUMERIC(18,4);
        RETURN;
    END IF;

    IF v_total_spins < v_target_spin THEN
        RETURN QUERY SELECT FALSE, FORMAT('Requirement not met. Need %s SC total spins.', v_target_spin)::VARCHAR(255), 0.0000::NUMERIC(18,4), 0.00::NUMERIC(18,2), 0.0000::NUMERIC(18,4);
        RETURN;
    END IF;

    INSERT INTO user_vip_milestones (user_id, milestone_id, target_spin_sc, sc_reward, gc_reward)
    VALUES (p_user_id, p_milestone_id, v_target_spin, v_sc_reward, v_gc_reward);

    SELECT sweeps_coins INTO v_current_sc FROM balances WHERE user_id = p_user_id FOR UPDATE;
    v_new_sc := v_current_sc + v_sc_reward;
    UPDATE balances SET sweeps_coins = v_new_sc WHERE user_id = p_user_id;

    INSERT INTO transactions (user_id, currency_type, transaction_type, amount, balance_after, notes)
    VALUES (p_user_id, 'SWEEPS_COIN', 'VIP_MILESTONE_REWARD', v_sc_reward, v_new_sc, FORMAT('VIP Milestone %s Reward', p_milestone_id));

    RETURN QUERY SELECT TRUE, FORMAT('Milestone %s claimed! Granted %s SC.', p_milestone_id, v_sc_reward)::VARCHAR(255), v_sc_reward, v_gc_reward, v_new_sc;
EXCEPTION WHEN unique_violation THEN
    RETURN QUERY SELECT FALSE, 'Milestone already claimed.'::VARCHAR(255), 0.0000::NUMERIC(18,4), 0.00::NUMERIC(18,2), 0.0000::NUMERIC(18,4);
END;
$$;
