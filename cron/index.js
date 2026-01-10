// =========================================
// HUMAN — CRON Scheduler
// Responsável pela mineração diária
// =========================================

import cron from "node-cron";
import { runDailyMining } from "./mining.js";

// Corre todos os dias à meia-noite UTC
cron.schedule("0 0 * * *", async () => {
  console.log("🕛 CRON → Executar mineração diária…");
  await runDailyMining();
  console.log("✅ CRON → Mineração concluída\n");
});
