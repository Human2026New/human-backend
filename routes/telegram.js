import express from "express";
import bot from "../telegram/bot.js";

const router = express.Router();

// Telegram envia POST aqui
router.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

export default router;
