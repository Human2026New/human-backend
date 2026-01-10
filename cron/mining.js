// =========================================
// HUMAN — Mineração diária automática
// Dá 1 HUM por dia a cada humano que entrou
// =========================================

import { dbAll, dbRun } from "../db.js";

const DAILY_REWARD = 1;

export async function runDailyMining() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Humanos que ainda não mineraram hoje
    const users = await dbAll(`
      SELECT telegram_id FROM users
      WHERE last_mined IS NULL OR last_mined < ?
    `, [today]);

    if (!users || users.length === 0) {
      console.log("⏳ Nenhum humano para minerar hoje");
      return;
    }

    for (const u of users) {

      await dbRun(`
        UPDATE users
        SET hum_balance = hum_balance + ?,
            last_mined = ?
        WHERE telegram_id = ?
      `, [DAILY_REWARD, today, u.telegram_id]);

      await dbRun(`
        UPDATE hum_status
        SET total_mined = total_mined + ?
        WHERE id = 1
      `, [DAILY_REWARD]);
    }

    console.log(`⛏️ Mineração diária aplicada (${users.length} humanos)`);

  } catch (err) {
    console.error("❌ Erro mineração diária:", err.message);
  }
}
