// =========================================
// HUMAN — RANKING GLOBAL
// TOP 10 Humanos por presença (streak)
// =========================================

import express from "express";
import { dbAll } from "../db.js";

const router = express.Router();

/**
 * GET /rank/top
 * TOP 10 humanos com mais dias consecutivos
 */
router.get("/top", async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT telegram_id, streak_days
      FROM users
      WHERE streak_days > 0
      ORDER BY streak_days DESC
      LIMIT 10
    `);

    return res.json({
      ok: true,
      top: rows.map((u, i) => ({
        position: i + 1,
        telegram_id: u.telegram_id,
        streak_days: u.streak_days
      }))
    });

  } catch (err) {
    console.error("❌ /rank/top erro:", err.message);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;
