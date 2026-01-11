// =========================
// HUMAN — backend server.js
// =========================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// EXPRESS INIT
const app = express();

// Render injecta PORT automaticamente
const PORT = process.env.PORT || 10000;

// DB init
import db from "./db.js";

// CRON JOBS (opcional, se existir)
try {
  await import("./cron/index.js");
  console.log("⏱️ CRON carregado");
} catch (err) {
  console.log("⏱️ Sem CRON (por agora)");
}

// ROUTES — TODAS AS CERTAS
import humUserRoutes from "./routes/hum_user.js";
import presenceRoutes from "./routes/presence.js";
import rewardsRoutes from "./routes/rewards.js";
import rankRoutes from "./routes/rank.js";
import inviteRoutes from "./routes/invite.js";
import friendsRoutes from "./routes/friends.js";
import drawRoutes from "./routes/draw.js";
import humStatusRoutes from "./routes/hum_status.js";
import humBuyRoutes from "./routes/hum_buy.js";
import humWithdrawRoutes from "./routes/hum_withdraw.js";
import humProtocolRoutes from "./routes/hum_protocol.js";
import humTransferRoutes from "./routes/hum_transfer.js";
import profileRoutes from "./routes/profile.js";
import healthRoutes from "./routes/health.js";
import telegramRoutes from "./routes/telegram.js";


// 🆕 Nova rota da app ↔ backend
import messageRoutes from "./routes/message.js";

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// HEALTH CHECK
app.use("/health", healthRoutes);

// USE ROUTES
app.use("/api", messageRoutes);     // 🆕 AGORA NO SÍTIO CERTO! ✔️
app.use("/hum", humUserRoutes);
app.use("/presence", presenceRoutes);
app.use("/rewards", rewardsRoutes);
app.use("/rank", rankRoutes);
app.use("/invite", inviteRoutes);
app.use("/friends", friendsRoutes);
app.use("/draw", drawRoutes);
app.use("/hum", humStatusRoutes);
app.use("/hum", humBuyRoutes);
app.use("/hum", humWithdrawRoutes);
app.use("/hum/protocol", humProtocolRoutes);
app.use("/hum", humTransferRoutes);
app.use("/profile", profileRoutes);

// ROOT
app.get("/", (req, res) => {
  res.json({ status: "HUMAN backend online" });
});

// START SERVER — **ESSENCIAL PARA RENDER**
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟢 HUMAN backend ativo e a escutar em PORTA ${PORT}`);
});
