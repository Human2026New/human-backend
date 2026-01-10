import express from "express";
import db from "../db.js";

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function emoji(type) {
  return {
    bronze: "🟤",
    prata: "⚪",
    ouro: "🟡",
    diamante: "💎"
  }[type] || "🎁";
}

/**
 * POST /draw/run
 * Sorteio mensal
 */
router.post("/run", async (req, res) => {
  try {
    const month = currentMonth();

    // USERS elegíveis (que marcaram presença este mês e ainda não ganharam)
    const users = await db.all(
      `
      SELECT DISTINCT telegram_id FROM checkins
      WHERE telegram_id NOT IN (
        SELECT telegram_id 
        FROM rewards
        WHERE source = 'monthly_draw'
        AND created_at LIKE ?
      )
      `,
      [`${month}%`]
    );

    if (!users || users.length === 0) {
      return res.json({ status: "no_users" });
    }

    // Shuffle
    const shuffled = users
      .map(u => u.telegram_id)
      .sort(() => 0.5 - Math.random());

    // TOP 10
    const winners = shuffled.slice(0, 10);

    const prizes = [
      "bronze","bronze","bronze","bronze","bronze",
      "prata","prata","prata",
      "ouro",
      "diamante"
    ];

    const now = today();

    for (let i = 0; i < winners.length; i++) {
      await db.run(
        `
        INSERT INTO rewards (telegram_id, type, source, created_at)
        VALUES (?, ?, 'monthly_draw', ?)
        `,
        [winners[i], prizes[i], now]
      );
    }

    return res.json({ status: "ok", winners: winners.length });
  } catch (err) {
    console.error("❌ Erro no sorteio:", err);
    return res.status(500).json({ status: "error" });
  }
});

export default router;
