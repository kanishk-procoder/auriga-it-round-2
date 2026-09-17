from __future__ import annotations

import sqlite3
from pathlib import Path

from backend.config import DATABASE_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  lifetime_spend_paise INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_spend_paise >= 0),
  tier TEXT NOT NULL DEFAULT 'REGULAR' CHECK (tier IN ('REGULAR', 'SILVER', 'GOLD')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country_code, phone_number)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'STAFF')),
  member_id INTEGER UNIQUE REFERENCES members(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  type TEXT NOT NULL CHECK (type IN ('EARN', 'REDEEM')),
  amount_paise INTEGER,
  points_delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  lifetime_spend_after_paise INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  member_id INTEGER NOT NULL REFERENCES members(id),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  reward_discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (reward_discount_paise >= 0),
  total_paid_paise INTEGER NOT NULL CHECK (total_paid_paise >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_phone ON members(country_code, phone_number);
CREATE INDEX IF NOT EXISTS idx_transactions_member_time ON reward_transactions(member_id, created_at DESC, id DESC);
"""


def connect(path: str | Path = DATABASE_PATH) -> sqlite3.Connection:
    connection = sqlite3.connect(path, timeout=10, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    return connection


def initialize_database(path: str | Path = DATABASE_PATH) -> None:
    with connect(path) as connection:
        connection.executescript(SCHEMA)
