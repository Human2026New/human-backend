// =========================================
// HUMAN — Presença diária / Check-in
// =========================================

import express from "express";
import { dbGet, dbRun } from "../db.js";

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}
function yesterday() {
  return new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);
}

// POST /presence/checkin
router.post("/checkin", async (req, res) => {
  try {
    const telegramId = req.body.telegram_id;
    if (!telegramId) {
      return res.status(400).json({
        ok: false,
        error: "telegram_id é obrigatório"
      });
    }

    const date = today();

    // 1️⃣ Criar utilizador se não existir
    const user = await dbGet(
      "SELECT * FROM users WHERE telegram_id = ?",
      [telegramId]
    );

    if (!user) {
      await dbRun(
        `
        INSERT INTO users (telegram_id, created_at, last_checkin, streak_days)
        VALUES (?, datetime('now'), ?, 0)
        `,
        [telegramId, date]
      );
    }

    // 2️⃣ Já marcou hoje?
    const existing = await dbGet(
      `
      SELECT id FROM checkins
      WHERE telegram_id = ? AND date = ?
      `,
      [telegramId, date]
    );

    if (existing) {
      return res.json({
        ok: true,
        already: true,
        message: "Já marcaste presença hoje"
      });
    }

    // 3️⃣ Inserir checkin diário
    await dbRun(
      `
      INSERT INTO checkins (telegram_id, date)
      VALUES (?, ?)
      `,
      [telegramId, date]
    );

    // 4️⃣ Atualizar streak
    const last = user?.last_checkin;
    let streak = user?.streak_days || 0;

    if (last === yesterday()) {
      streak += 1;
    } else {
      streak = 1;
    }

    await dbRun(
      `
      UPDATE users
      SET last_checkin = ?, streak_days = ?
      WHERE telegram_id = ?
      `,
      [date, streak, telegramId]
    );

    // 5️⃣ Recompensas automáticas
    let reward = null;
    if (streak === 10) reward = "bronze";
    if (streak === 30) reward = "prata";

    if (reward) {
      await dbRun(
        `
        INSERT OR IGNORE INTO rewards
        (telegram_id, type, source, created_at)
        VALUES (?, ?, ?, datetime('now'))
        `,
        [telegramId, reward, reward === "bronze" ? "10_days" : "30_days"]
      );
    }

    return res.json({
      ok: true,
      streak,
      reward
    });

  } catch (err) {
    console.error("❌ POST /checkin erro:", err);
    return res.status(500).json({
      ok: false,
      error: "Erro no check-in"
    });
  }
});

router.get("/streak", async (req, res) => {
  const { telegram_id } = req.query;
  const row = await dbGet(
    `SELECT streak_days FROM users WHERE telegram_id = ?`,
    [telegram_id]
  );
  res.json({ streak: row?.streak_days || 0 });
});

export default router;
