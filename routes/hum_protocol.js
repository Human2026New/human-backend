import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

// Resolve caminho certo mesmo com ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", (req, res) => {
  try {
    const protocolPath = path.join(
      __dirname,
      "..",
      "config",
      "hum_protocol.json"
    );

    if (!fs.existsSync(protocolPath)) {
      return res.status(404).json({ error: "protocol_not_found" });
    }

    const data = fs.readFileSync(protocolPath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("❌ HUM protocol erro:", err);
    res.status(500).json({
      error: "HUM protocol not available"
    });
  }
});

export default router;
