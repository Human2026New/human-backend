-- =========================================
-- HUMAN 2026 — DATABASE SCHEMA (FINAL)
-- Presence • Rewards • NFT Real • TON Sync
-- =========================================

PRAGMA foreign_keys = ON;

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,

  -- Presence / Streak
  last_checkin TEXT,
  streak_days INTEGER DEFAULT 0,

  -- HUM balance real
  hum INTEGER DEFAULT 0
);

-- =====================================================
-- CHECKINS (histórico real de presença)
-- =====================================================
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  date TEXT NOT NULL,

  UNIQUE(telegram_id, date),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    ON DELETE CASCADE
);

-- =====================================================
-- REWARDS / NFTS (internos + reais)
-- =====================================================
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  telegram_id TEXT NOT NULL,

  -- Reward logic
  type TEXT NOT NULL CHECK (
    type IN ('bronze','prata','ouro','diamante')
  ),
  source TEXT NOT NULL CHECK (
    source IN ('10_days','30_days','monthly_draw')
  ),

  created_at TEXT NOT NULL,

  -- =========================
  -- NFT REAL (TON + IPFS)
  -- =========================
  image_ipfs TEXT,
  metadata_ipfs TEXT,
  nft_address TEXT,
  tx_hash TEXT,

  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    ON DELETE CASCADE,

  -- Evita duplicação por milestone
  UNIQUE (telegram_id, source)
);

-- =====================================================
-- INDEXES (performance)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_telegram
  ON users (telegram_id);

CREATE INDEX IF NOT EXISTS idx_checkins_telegram
  ON checkins (telegram_id);

CREATE INDEX IF NOT EXISTS idx_rewards_telegram
  ON rewards (telegram_id);

CREATE INDEX IF NOT EXISTS idx_rewards_type
  ON rewards (type);

CREATE INDEX IF NOT EXISTS idx_rewards_created
  ON rewards (created_at);

-- Pagamentos TON recebidos
CREATE TABLE IF NOT EXISTS ton_payments (
  tx_hash TEXT PRIMARY KEY,
  from_address TEXT,
  amount_ton REAL,
  hum_amount REAL,
  telegram_id TEXT,
  created_at TEXT
);

-- Estado global HUM
CREATE TABLE IF NOT EXISTS hum_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_mined REAL,
  mined_percent REAL,
  phase INTEGER
);

-- Inicialização (uma vez)
INSERT OR IGNORE INTO hum_status (id, total_mined, mined_percent, phase)
VALUES (1, 0, 0, 0);
-- Convites HUMAN
CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invite_code TEXT UNIQUE NOT NULL,
  inviter_id TEXT NOT NULL,
  joined_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS hum_withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  hum_amount REAL NOT NULL,
  ton_expected REAL NOT NULL,
  payload TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hum_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
