// =========================================
// HUMAN — HUM Status + Buy Request
// =========================================

import express from "express";
import { dbGet, dbRun } from "../db.js";

const router = express.Router();

function phaseFromPercent(p) {
  if (p < 20) return { id: 0, name: "Presença" };
  if (p < 40) return { id: 1, name: "Expansão" };
  return { id: 2, name: "Mercado" };
}

async function getUserHum(telegramId) {
  if (!telegramId) return 0;

  const row = await dbGet(
    `
    SELECT SUM(hum_amount) AS total
    FROM ton_payments
    WHERE telegram_id = ?
    `,
    [telegramId]
  );

  return row?.total || 0;
}

/* GET /hum/status */
router.get("/status", async (req, res) => {
  try {
    const telegramId = req.query.telegram_id || null;

    const global = await dbGet(
      "SELECT total_mined, mined_percent, phase FROM hum_status WHERE id = 1"
    );

    const phase = phaseFromPercent(global.mined_percent);

    const userHum = telegramId
      ? await getUserHum(telegramId)
      : 0;

    return res.json({
      ok: true,
      phase: phase.id,
      phase_name: phase.name,
      mined_percent: Number(global.mined_percent.toFixed(6)),
      can_buy: phase.id >= 1,
      can_convert: phase.id >= 2,
      can_withdraw: false,
      user_hum: Number(userHum.toFixed(6))
    });
  } catch (err) {
    console.error("❌ GET /hum/status", err);
    return res.status(500).json({ ok: false });
  }
});

/* POST /hum/buy */
router.post("/buy", async (req, res) => {
  try {
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ ok: false, error: "telegram_id obrigatório" });
    }

    const global = await dbGet(
      "SELECT phase FROM hum_status WHERE id = 1"
    );

    if (global.phase < 1) {
      return res.json({
        ok: false,
        error: "Fase insuficiente — HUM ainda não está pronto a ser comprado"
      });
    }

    // User é criado quando faz check-in
    await dbRun(
      `
      INSERT OR IGNORE INTO users (telegram_id, created_at)
      VALUES (?, datetime('now'))
      `,
      [telegram_id]
    );

    return res.json({
      ok: true,
      instruction: "Envia TON para o endereço do protocolo",
      wallet: process.env.TON_WALLET,
      note: "Após a transação ser confirmada, HUM será creditado automaticamente"
    });

  } catch (err) {
    console.error("❌ POST /hum/buy", err);
    return res.status(500).json({ ok: false });
  }
});

export default router;
