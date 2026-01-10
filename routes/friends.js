// =========================================
// HUMAN — Friends / Referrals Dashboard
// =========================================

import express from "express";
import { dbGet } from "../db.js";

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * GET /friends/:telegram_id
 * Retorna quantos amigos um humano trouxe,
 * e quantos estão ativos hoje.
 */
router.get("/:telegram_id", async (req, res) => {
  try {
    const inviterId = req.params.telegram_id;
    const todayStr = today();

    // Total de convidados
    const totalRow = await dbGet(
      `
      SELECT COUNT(*) AS c
      FROM users
      WHERE invited_by = ?
      `,
      [inviterId]
    );

    // Ativos hoje (checkin)
    const activeRow = await dbGet(
      `
      SELECT COUNT(DISTINCT c.telegram_id) AS c
      FROM checkins c
      WHERE c.date = ?
      AND c.telegram_id IN (
        SELECT telegram_id
        FROM users
        WHERE invited_by = ?
      )
      `,
      [todayStr, inviterId]
    );

    return res.json({
      ok: true,
      inviter: inviterId,
      total_friends: totalRow?.c || 0,
      active_today: activeRow?.c || 0
    });
  } catch (err) {
    console.error("❌ GET /friends erro:", err.message);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;
