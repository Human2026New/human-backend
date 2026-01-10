import fetch from "node-fetch";

const API = process.env.TONCENTER_API || "https://toncenter.com/api/v3/transactions";
const API_KEY = process.env.TONCENTER_API_KEY || "";
const WALLET = process.env.TON_WALLET;   // Base64 address

if (!WALLET) {
  throw new Error("❌ TON_WALLET not set in .env");
}

/**
 * Verifica se existe pagamento TON numa wallet
 * payload = comentário esperado (string simples)
 * minTon = mínimo de TON esperados
 */
export async function verifyTonPayment(payload, minTon) {
  try {
    const url = `${API}?account=${WALLET}&limit=30`;

    const r = await fetch(url, {
      headers: API_KEY ? { "X-API-Key": API_KEY } : {}
    });

    const d = await r.json();
    const list =
      d.transactions || d.result?.transactions || [];

    const found = list.some((tx) => {
      const msg = tx.in_msg;

      if (!msg) return false;

      // valor em TON
      const valueTon = Number(msg.value || 0) / 1e9;
      if (valueTon < minTon) return false;

      // comentário (decoded)
      const textPayload =
        msg.msg ||
        msg.comment ||
        msg.body ||
        msg.message ||
        "";

      return textPayload.trim() === payload;
    });

    return found;
  } catch (err) {
    console.error("❌ TON verify erro:", err.message);
    return false;
  }
}
