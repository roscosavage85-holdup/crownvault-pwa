5. PUSH NOTIFICATION SERVICE (notification-service.js)
 * FILE: notification-service.js
 ******************************************************************************/

/**
 * Push Notification & Daily Streak Reminder Service (Node.js)
 * 
 * Features:
 * - Web Push (vapid) protocol driver
 * - Automated 23-hour cron job checker to alert players before daily streak resets
 * - VIP Milestone unlock notifications
 */

const webpush = require('web-push');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// VAPID keys setup for Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib...';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 's8d9fs8f7sd9f...';

webpush.setVapidDetails(
  'mailto:support@sweepstakescasino.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Send Streak Warning Push Notification
 */
async function sendDailyStreakReminders() {
  try {
    // Query users whose last claim was 21 to 23 hours ago (preventing streak break at 24h)
    const result = await pool.query(`
      SELECT s.user_id, s.streak_count, u.email, p.push_subscription_json
        FROM user_daily_streaks s
        JOIN users u ON s.user_id = u.user_id
        JOIN user_push_subscriptions p ON s.user_id = p.user_id
       WHERE s.last_claim_timestamp <= CURRENT_TIMESTAMP - INTERVAL '21 hours'
         AND s.last_claim_timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    `);

    console.log(`[Notification Service] Found ${result.rows.length} players needing daily streak reminders.`);

    for (const row of result.rows) {
      const pushSubscription = JSON.parse(row.push_subscription_json);
      const payload = JSON.stringify({
        title: `🔥 Don't lose your Day ${row.streak_count} Streak!`,
        body: `Your daily bonus is expiring in 2 hours. Claim now to keep progressing toward the Day 7 Mega Bonus Wheel!`,
        url: '/?action=daily-bonus'
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`[Notification Service] Streak reminder sent to user: ${row.user_id}`);
      } catch (err) {
        console.error(`[Notification Service] Failed to send push to ${row.user_id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Notification Service] Error querying streak reminders:', err);
  }
}

module.exports = { sendDailyStreakReminders, VAPID_PUBLIC_KEY };
