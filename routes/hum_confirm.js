// =========================================
// HUMAN — TON Payment Confirmation (optional)
// Somente se usarmos webhook TON
// =========================================

import express from "express";
import { dbRun } from "../db.js";
import verifyTonTx from "../services/tonVerify.js";

const router = express.Router();

/*
 POST /hum/buy/confirm
 Admin or webhook confirms a transaction hash
*/
router.post("/buy/confirm", async (req, res) => {
  try {
    const { telegram_id, tx_hash } = req.body;

    if (!telegram_id || !tx_hash) {
      return res.status(400).json({ ok: false, error: "missing_data" });
    }

    const result = await verifyTonTx(tx_hash);
    if (!result.valid) {
      return res.status(400).json({ ok: false, error: "invalid_tx" });
    }

    // Registrar pagamento (TON → HUM)
    const humAmount = result.ton / 0.05; // placeholder
    await dbRun(
      `
      INSERT OR IGNORE INTO ton_payments
      (tx_hash, from_address, amount_ton, hum_amount, telegram_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      `,
      [tx_hash, result.from || null, result.ton, humAmount, telegram_id]
    );

    return res.json({
      ok: true,
      credited_hum: humAmount
    });

  } catch (err) {
    console.error("❌ /hum/buy/confirm erro:", err.message);
    return res.status(500).json({ ok: false });
  }
});

export default router;
