// =========================================
// HUMAN — Transferência HUM entre utilizadores
// =========================================

import express from "express";
import { dbGet, dbRun } from "../db.js";

const router = express.Router();

// Hum total do user = deposits - gastos - enviados + recebidos
async function calculateBalance(telegramId) {
  const deposits = await dbGet(
    `
    SELECT SUM(hum_amount) AS total
    FROM ton_payments
    WHERE telegram_id = ?
    `,
    [telegramId]
  );

  const sent = await dbGet(
    `
    SELECT SUM(amount) AS total
    FROM hum_transfers
    WHERE sender_id = ?
    `,
    [telegramId]
  );

  const received = await dbGet(
    `
    SELECT SUM(amount) AS total
    FROM hum_transfers
    WHERE receiver_id = ?
    `,
    [telegramId]
  );

  const withdrew = await dbGet(
    `
    SELECT SUM(hum_amount) AS total
    FROM hum_withdrawals
    WHERE telegram_id = ? AND status = 'confirmed'
    `,
    [telegramId]
  );

  return (
    (deposits?.total || 0) -
    (sent?.total || 0) +
    (received?.total || 0) -
    (withdrew?.total || 0)
  );
}

/*
 POST /hum/send
 {
   sender_id: "123",
   receiver_id: "456",
   amount: 10
 }
*/
router.post("/send", async (req, res) => {
  try {
    const { sender_id, receiver_id, amount } = req.body;

    if (!sender_id || !receiver_id || !amount || amount <= 0) {
      return res.status(400).json({ status: "bad_request" });
    }

    if (sender_id === receiver_id) {
      return res.json({ status: "same_user" });
    }

    // Garantir que o recetor existe
    const recvUser = await dbGet(
      "SELECT telegram_id FROM users WHERE telegram_id = ?",
      [receiver_id]
    );

    if (!recvUser) {
      return res.json({ status: "receiver_not_found" });
    }

    const balance = await calculateBalance(sender_id);

    if (balance < amount) {
      return res.json({ status: "not_enough_balance" });
    }

    await dbRun(
      `
      INSERT INTO hum_transfers
      (sender_id, receiver_id, amount, created_at)
      VALUES (?, ?, ?, datetime('now'))
      `,
      [sender_id, receiver_id, amount]
    );

    return res.json({ status: "success", amount });
  } catch (err) {
    console.error("❌ hum/send:", err.message);
    return res.status(500).json({ status: "error" });
  }
});

export default router;
