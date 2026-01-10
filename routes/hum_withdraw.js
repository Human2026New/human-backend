// =========================================
// HUMAN — HUM → TON Withdraw System
// Fase 2 e apenas registando pedidos
// =========================================

import express from "express";
import { dbGet, dbRun } from "../db.js";
import { verifyTonTx } from "../services/tonVerify.js";

const router = express.Router();

const ADMIN_TON_WALLET = process.env.TON_WALLET;
const TON_PRICE_EUR = 2.5;

// Fase baseada em hum_status
function canWithdraw(phase) {
  return phase >= 2;
}

// Hum do user = depositos - gastos
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

// -------------------------------------------
// POST /hum/withdraw/prepare
// Cria pedido de levantamento
// -------------------------------------------
router.post("/prepare", async (req, res) => {
  try {
    const { telegram_id, hum_amount } = req.body;

    if (!telegram_id || !hum_amount || hum_amount <= 0)
      return res.status(400).json({ ok: false, error: "invalid_request" });

    const status = await dbGet(
      "SELECT phase FROM hum_status WHERE id = 1"
    );

    if (!canWithdraw(status.phase)) {
      return res.json({
        ok: false,
        error: "withdraw_not_available_yet"
      });
    }

    const userBalance = await getUserHum(telegram_id);
    if (userBalance < hum_amount) {
      return res.json({ ok: false, error: "insufficient_balance" });
    }

    const tonAmount = hum_amount * (0.05 / TON_PRICE_EUR); // estimativa
    const payload = `HUMWDR:${telegram_id}:${Date.now()}`;

    await dbRun(
      `
      INSERT INTO hum_withdrawals
      (telegram_id, hum_amount, ton_expected, payload, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      `,
      [telegram_id, hum_amount, tonAmount, payload]
    );

    return res.json({
      ok: true,
      admin_wallet: ADMIN_TON_WALLET,
      ton_amount: Number(tonAmount.toFixed(6)),
      payload,
      note: "Depois do admin enviar TON, o pedido será confirmado"
    });

  } catch (err) {
    console.error("❌ /withdraw/prepare", err.message);
    return res.status(500).json({ ok: false });
  }
});

// -------------------------------------------
// POST /hum/withdraw/confirm
// ADMIN confirma com tx hash
// -------------------------------------------
router.post("/confirm", async (req, res) => {
  try {
    const { telegram_id, withdrawal_id, tx_hash } = req.body;

    if (!telegram_id || !withdrawal_id || !tx_hash)
      return res.status(400).json({ ok: false, error: "invalid_request" });

    const withdrawal = await dbGet(
      `
      SELECT * FROM hum_withdrawals
      WHERE id = ? AND telegram_id = ?
      `,
      [withdrawal_id, telegram_id]
    );

    if (!withdrawal)
      return res.json({ ok: false, error: "not_found" });

    if (withdrawal.status !== "pending")
      return res.json({ ok: false, error: "already_processed" });

    const verify = await verifyTonTx(tx_hash);

    if (!verify.valid)
      return res.json({ ok: false, error: "tx_invalid" });

    await dbRun(
      `
      UPDATE hum_withdrawals
      SET status = 'confirmed', tx_hash = ?
      WHERE id = ?
      `,
      [tx_hash, withdrawal_id]
    );

    return res.json({
      ok: true,
      hum_spent: withdrawal.hum_amount
    });
  } catch (err) {
    console.error("❌ /withdraw/confirm", err.message);
    return res.status(500).json({ ok: false });
  }
});

export default router;
