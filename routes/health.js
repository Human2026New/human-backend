// =========================================
// HUMAN — Health Check Endpoint
// =========================================

import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    return res.json({
      ok: true,
      status: "online",
      time: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      status: "error"
    });
  }
});

export default router;
