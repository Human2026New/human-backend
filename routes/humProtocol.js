// =========================================
// HUMAN — HUM Protocol Public Endpoint
// Serves hum_protocol.json
// =========================================

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /hum/protocol
router.get("/", (req, res) => {
  try {
    const protocolPath = path.join(
      __dirname,
      "..",
      "config",
      "hum_protocol.json"
    );

    const data = fs.readFileSync(protocolPath, "utf-8");
    return res.json({
      ok: true,
      protocol: JSON.parse(data)
    });

  } catch (err) {
    console.error("❌ /hum/protocol erro:", err.message);
    return res.status(500).json({
      ok: false,
      error: "HUM protocol unavailable"
    });
  }
});

export default router;
