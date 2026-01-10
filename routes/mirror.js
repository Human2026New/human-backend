// =========================================
// HUMAN — Mirror Stats API
// Estatísticas globais do ecossistema
// =========================================

import express from "express";
import { dbGet, dbAll } from "../db.js";

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

router.get("/", async (req, res) => {
  try {
    const todayStr = today();

    // 1️⃣ total de humanos registados
    const totalRow = await dbGet(
      "SELECT COUNT(*) AS c FROM users"
    );
    const totalHumans = totalRow?.c || 0;

    // 2️⃣ ativos hoje (presença marcada)
    const activeRow = await dbGet(
      `
      SELECT COUNT(DISTINCT telegram_id) AS c
      FROM checkins
      WHERE date = ?
      `,
      [todayStr]
    );
    const activeToday = activeRow?.c || 0;

    // 3️⃣ NFTs emitidos
    const rewardsRow = await dbGet(
      "SELECT COUNT(*) AS c FROM rewards"
    );
    const totalRewards = rewardsRow?.c || 0;

    // 4️⃣ média de streaks (opcional mas bonito)
    const streakAverageRow = await dbGet(
      "SELECT AVG(streak_days) AS avg FROM users"
    );
    const avgStreak =
      Math.round(streakAverageRow?.avg || 0);

    return res.json({
      ok: true,
      total_humans: totalHumans,
      active_today: activeToday,
      total_rewards: totalRewards,
      avg_streak: avgStreak
    });
  } catch (err) {
    console.error("❌ GET /mirror erro:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Erro ao carregar estatísticas"
    });
  }
});

export default router;
