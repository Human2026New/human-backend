// =========================================
// HUMAN — Global HUM Status (read-only)
// =========================================

import express from "express";
import { dbGet } from "../db.js";

const router = express.Router();

/* Fase baseada no HUM Protocol */
function phaseFromPercent(percent) {
  if (percent < 20) return { id: 0, name: "Presença" };
  if (percent < 40) return { id: 1, name: "Expansão" };
  return { id: 2, name: "Mercado" };
}

// GET /hum/status/simple
router.get("/simple", async (req, res) => {
  try {
    const global = await dbGet(
      `
      SELECT total_mined, mined_percent, phase
      FROM hum_status
      WHERE id = 1
      `
    );

    if (!global) {
      return res.status(500).json({
        ok: false,
        error: "hum_status_not_found"
      });
    }

    const phase = phaseFromPercent(global.mined_percent);

    return res.json({
      ok: true,
      phase: phase.id,
      phase_name: phase.name,
      mined_percent: Number(global.mined_percent.toFixed(6)),
      total_mined: Number(global.total_mined.toFixed(6)),
      can_buy: phase.id >= 1,
      can_convert: phase.id >= 2,
      can_withdraw: phase.id >= 2
    });

  } catch (err) {
    console.error("❌ /hum/status/simple erro:", err.message);
    return res.status(500).json({ ok: false });
  }
});

export default router;
