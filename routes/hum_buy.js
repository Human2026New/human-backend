// =========================================
// HUMAN — HUM Buy Prepare Endpoint
// (Interface layer — no credit here)
// =========================================

import express from "express";
import { dbRun, dbGet } from "../db.js";

const router = express.Router();
const WALLET = process.env.TON_WALLET;

// GET phase --> prevent buy if too early
function canBuy(phase) {
  return phase >= 1;
}

router.post("/buy", async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) {
      return res.status(400).json({ ok: false, error: "missing_id" });
    }

    // garantir user registo
    await dbRun(
      `
      INSERT OR IGNORE INTO users (telegram_id, created_at)
      VALUES (?, datetime('now'))
      `,
      [telegram_id]
    );

    const status = await dbGet(
      "SELECT phase FROM hum_status WHERE id = 1"
    );

    if (!canBuy(status.phase)) {
      return res.json({
        ok: false,
        error: "buy_not_available_yet"
      });
    }

    const payload = `HUM:${telegram_id}:${Date.now()}`;

    return res.json({
      ok: true,
      wallet: WALLET,
      payload,
      note: "Envia TON para este endereço com o payload acima.\nHUM será creditado automaticamente quando a transação for verificada."
    });

  } catch (err) {
    console.error("❌ /hum/buy erro:", err.message);
    return res.status(500).json({ ok: false });
  }
});

export default router;
