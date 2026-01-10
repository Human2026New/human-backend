// =========================================
// HUMAN 2026 — TON Scanner
// Lê depósitos TON, converte em HUM e atualiza supply
// =========================================

import fetch from "node-fetch";
import { dbGet, dbRun } from "../db.js";
import { HUM_CONFIG } from "../config/hum_config.js";

const TON_API =
  process.env.TONCENTER_SCAN ||
  "https://toncenter.com/api/v2/getTransactions";

const API_KEY = process.env.TONCENTER_API_KEY || "";
const WALLET = process.env.TON_WALLET;

if (!WALLET) {
  throw new Error("❌ TON_WALLET must be set in .env");
}

// =========================
// MAIN SCAN FUNCTION
// =========================
export async function scanTonPayments() {
  try {
    const url = `${TON_API}?address=${WALLET}&limit=20`;

    const r = await fetch(url, {
      headers: API_KEY ? { "X-API-Key": API_KEY } : {}
    });

    const json = await r.json();
    const txs = json.result?.transactions || json.result || [];

    for (const tx of txs) {
      const msg = tx.in_msg;
      if (!msg || !msg.value) continue;

      const txHash = tx.transaction_id.hash;
      const from = msg.source;
      const tonAmount = Number(msg.value) / 1e9;

      if (tonAmount <= 0) continue;

      // Já processado?
      const exists = await dbGet(
        "SELECT tx_hash FROM ton_payments WHERE tx_hash = ?",
        [txHash]
      );
      if (exists) continue;

      // Conversões
      const tonEur = await getTonEurPrice();
      const humPrice = await getHumPriceEUR();
      const humAmount = (tonAmount * tonEur) / humPrice;

      // Guarda registo
      await dbRun(
        `
        INSERT INTO ton_payments
        (tx_hash, from_address, amount_ton, hum_amount, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        `,
        [txHash, from, tonAmount, humAmount]
      );

      // Atualiza supply
      await creditHum(humAmount);
    }
  } catch (err) {
    console.error("❌ TON scan error:", err.message);
  }
}

// =========================
// Credit logic
// =========================
async function creditHum(amount) {
  await dbRun(
    `
    UPDATE hum_status
    SET total_mined = total_mined + ?
    WHERE id = 1
    `,
    [amount]
  );

  const row = await dbGet(
    "SELECT total_mined FROM hum_status WHERE id = 1"
  );
  if (!row) return;

  const percent =
    (row.total_mined / HUM_CONFIG.TOTAL_SUPPLY) * 100;

  const phase =
    percent >= 40 ? 2 :
    percent >= 20 ? 1 : 0;

  await dbRun(
    `
    UPDATE hum_status
    SET mined_percent = ?, phase = ?
    WHERE id = 1
    `,
    [percent, phase]
  );
}

// =========================
// Helpers
// =========================
async function getHumPriceEUR() {
  return 0.05;
}

async function getTonEurPrice() {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=eur"
    );
    const d = await r.json();
    return d["the-open-network"].eur || 2;
  } catch {
    return 2; // fallback
  }
}
