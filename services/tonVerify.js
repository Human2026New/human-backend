import fetch from "node-fetch";

const TON_API = "https://tonapi.io/v2/blockchain/transactions";
const HUM_WALLET = process.env.HUM_WALLET || "INSERE_AQUI_A_TUA_WALLET_TON";

export async function verifyTonTx(tx_hash) {
  try {
    const r = await fetch(`${TON_API}/${tx_hash}`);
    if (!r.ok) return { valid: false };

    const tx = await r.json();

    if (!tx.success) return { valid: false };

    const dest = tx.in_msg?.destination?.address;
    if (dest !== HUM_WALLET) return { valid: false };

    const nano = BigInt(tx.in_msg.value || 0);
    const ton = Number(nano) / 1e9;
    if (ton <= 0) return { valid: false };

    return {
      valid: true,
      ton,
      timestamp: tx.utime
    };

  } catch (err) {
    console.error("❌ verifyTonTx erro:", err.message);
    return { valid: false };
  }
}
