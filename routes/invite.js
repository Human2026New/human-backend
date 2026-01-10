// =========================================
// HUMAN — Invite System
// Gera e valida convites
// =========================================

import express from "express";
import { dbGet, dbRun } from "../db.js";

const router = express.Router();

// Util para código aleatório
function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// =========================================
// POST /invite/create
// Gera um novo código convite para um human
// =========================================
router.post("/create", async (req, res) => {
  try {
    const telegramId = req.body.telegram_id;
    if (!telegramId) return res.status(400).json({ ok: false, error: "telegram_id requerido" });

    const code = randomCode();

    await dbRun(
      `
      INSERT INTO invites (invite_code, inviter_id, joined_count, created_at)
      VALUES (?, ?, 0, datetime('now'))
      `,
      [code, telegramId]
    );

    return res.json({ ok: true, invite_code: code });
  } catch (err) {
    console.error("❌ /invite/create erro:", err.message);
    return res.status(500).json({ ok: false, error: "erro servidor" });
  }
});

// =========================================
// POST /invite/use
// Um novo humano entrou com um código
// =========================================
router.post("/use", async (req, res) => {
  try {
    const { telegram_id, invite_code } = req.body;
    if (!telegram_id || !invite_code) {
      return res.status(400).json({ ok: false, error: "dados incompletos" });
    }

    // Código existe?
    const inv = await dbGet(
      "SELECT * FROM invites WHERE invite_code = ?",
      [invite_code]
    );
    if (!inv) return res.json({ ok: false, error: "Código inválido" });

    // Evitar que um mesmo user use mais de 1 convite
    const user = await dbGet(
      "SELECT invited_by FROM users WHERE telegram_id = ?",
      [telegram_id]
    );
    if (user?.invited_by) {
      return res.json({ ok: false, error: "já usaste um convite" });
    }

    // Atualizar user
    await dbRun(
      `
      UPDATE users
      SET invited_by = ?
      WHERE telegram_id = ?
      `,
      [inv.inviter_id, telegram_id]
    );

    // Incrementar contador
    await dbRun(
      `
      UPDATE invites
      SET joined_count = joined_count + 1
      WHERE invite_code = ?
      `,
      [invite_code]
    );

    // TODO: dar recompensa ao inviter mais tarde

    return res.json({
      ok: true,
      inviter: inv.inviter_id
    });
  } catch (err) {
    console.error("❌ /invite/use erro:", err.message);
    return res.status(500).json({ ok: false, error: "erro servidor" });
  }
});

export default router;
