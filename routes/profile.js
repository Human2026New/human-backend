// =========================================
// HUMAN — User Profile + Friends + Invites
// =========================================

import express from "express";
import { dbGet, dbRun, dbAll } from "../db.js";

const router = express.Router();

/* GET /profile?telegram_id=123 */
router.get("/", async (req, res) => {
  try {
    const id = req.query.telegram_id;
    if (!id) return res.json({ ok: false });

    const user = await dbGet(
      `SELECT
        telegram_id,
        name,
        bio,
        referrals
      FROM users
      WHERE telegram_id = ?`,
      [id]
    );

    if (!user) return res.json({ ok: true, exists: false });

    return res.json({ ok: true, exists: true, user });
  } catch (err) {
    console.error("profile_GET", err.message);
    return res.status(500).json({ ok: false });
  }
});

/* POST /profile/update */
router.post("/update", async (req, res) => {
  try {
    const { telegram_id, name, bio } = req.body;

    if (!telegram_id)
      return res.json({ ok: false });

    await dbRun(
      `INSERT OR IGNORE INTO users (telegram_id, created_at)
       VALUES (?, datetime('now'))`,
      [telegram_id]
    );

    await dbRun(
      `UPDATE users SET name = ?, bio = ?
       WHERE telegram_id = ?`,
      [name || null, bio || null, telegram_id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("profile_update", err.message);
    return res.status(500).json({ ok: false });
  }
});

/* POST /invite */
router.post("/invite", async (req, res) => {
  try {
    const { referrer_id, new_id } = req.body;
    if (!referrer_id || !new_id || referrer_id === new_id)
      return res.json({ ok: false });

    // Add referral
    await dbRun(
      `UPDATE users SET referrals = referrals + 1 WHERE telegram_id = ?`,
      [referrer_id]
    );

    // Reward both (+1 HUM each)
    await dbRun(
      `INSERT INTO hum_transfers (sender_id, receiver_id, hum_change, created_at)
       VALUES ('SYSTEM', ?, 1, datetime('now'))`,
      [referrer_id]
    );
    await dbRun(
      `INSERT INTO hum_transfers (sender_id, receiver_id, hum_change, created_at)
       VALUES ('SYSTEM', ?, 1, datetime('now'))`,
      [new_id]
    );

    return res.json({ ok: true, bonus: 1 });
  } catch (err) {
    console.error("invite", err.message);
    return res.status(500).json({ ok: false });
  }
});

/* GET /friends?telegram_id=123 */
router.get("/friends", async (req, res) => {
  try {
    const id = req.query.telegram_id;
    if (!id) return res.json({ ok: false });

    const rows = await dbAll(
      `SELECT DISTINCT
         CASE WHEN sender_id = ?
              THEN receiver_id
              ELSE sender_id END AS friend
       FROM hum_transfers
       WHERE sender_id = ? OR receiver_id = ?`,
      [id, id, id]
    );

    return res.json({ ok: true, friends: rows.map(r => r.friend) });
  } catch (err) {
    console.error("friends", err.message);
    return res.status(500).json({ ok: false });
  }
});

export default router;
