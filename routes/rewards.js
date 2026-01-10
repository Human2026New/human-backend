// =========================================
// HUMAN — Rewards API
// Lista NFTs e prémios de um utilizador
// =========================================

import express from "express";
import { dbAll } from "../db.js";

const router = express.Router();

// GET /rewards?telegram_id=123
router.get("/", async (req, res) => {
  try {
    const telegramId = req.query.telegram_id;

    if (!telegramId) {
      return res.status(400).json({
        ok: false,
        error: "telegram_id é obrigatório"
      });
    }

    const rewards = await dbAll(
      `
      SELECT id, type, source, created_at, image_ipfs, metadata_ipfs, nft_address
      FROM rewards
      WHERE telegram_id = ?
      ORDER BY created_at DESC
      `,
      [telegramId]
    );

    return res.json({ ok: true, rewards });
  } catch (err) {
    console.error("❌ GET /rewards erro:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Erro de servidor ao carregar recompensas"
    });
  }
});

export default router;
