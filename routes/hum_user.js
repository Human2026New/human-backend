// =========================================
// HUMAN — User Profile API
// Devolve estado completo do utilizador
// =========================================

import express from "express";
import { dbGet, dbAll, dbRun } from "../db.js";

const router = express.Router();

// Calcular saldo HUM efetivo
async function getUserHum(telegramId) {
  const deposits = await dbGet(
    `
    SELECT SUM(hum_amount) AS total
    FROM ton_payments
    WHERE telegram_id = ?
    `,
    [telegramId]
  );

  const spent = await dbGet(
    `
    SELECT SUM(hum_amount) AS total
    FROM hum_withdrawals
    WHERE telegram_id = ? AND status = 'confirmed'
    `,
    [telegramId]
  );

  return (deposits?.total || 0) - (spent?.total || 0);
}

/**
 * GET /hum/user/:telegram_id
 * Perfil do humano
 */
router.get("/:telegram_id", async (req, res) => {
  const telegramId = req.params.telegram_id;

  try {
    // Garantir user existe
    let user = await dbGet(
      `
      SELECT telegram_id, created_at, last_checkin, streak_days
      FROM users
      WHERE telegram_id = ?
      `,
      [telegramId]
    );

    if (!user) {
      await dbRun(
        `
        INSERT INTO users (telegram_id, created_at, streak_days)
        VALUES (?, datetime('now'), 0)
        `,
        [telegramId]
      );

      user = {
        telegram_id: telegramId,
        created_at: new Date().toISOString(),
        last_checkin: null,
        streak_days: 0
      };
    }

    // HUM total
    const humBalance = await getUserHum(telegramId);

    // NFTs ganhos
    const rewards = await dbAll(
      `
      SELECT type, source, created_at
      FROM rewards
      WHERE telegram_id = ?
      `,
      [telegramId]
    );

    return res.json({
      ok: true,
      telegram_id: telegramId,
      created_at: user.created_at,
      streak_days: user.streak_days,
      last_checkin: user.last_checkin,
      hum_balance: Number(humBalance.toFixed(6)),
      rewards
    });
  } catch (err) {
    console.error("❌ /hum/user erro:", err);
    return res.status(500).json({
      ok: false,
      error: "lookup_failed"
    });
  }
});

export default router;
