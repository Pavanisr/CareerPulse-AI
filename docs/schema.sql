-- CareerPulse AI: offline SQLite schema (schema version 1)
-- Timestamps are Unix epoch milliseconds (INTEGER) to avoid timezone parsing bugs.

CREATE TABLE IF NOT EXISTS decks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  category    TEXT    NOT NULL,                       -- AWS | NCLEX | PMP | Software Engineering | Interview Gaps
  target_role TEXT,
  source      TEXT    NOT NULL DEFAULT 'seed' CHECK (source IN ('seed','interview','custom')),
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS cards (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id      INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  question     TEXT    NOT NULL,
  answer       TEXT    NOT NULL,
  interval     INTEGER NOT NULL DEFAULT 0,           -- days until next review
  repetitions  INTEGER NOT NULL DEFAULT 0,           -- consecutive successful reviews
  ease_factor  REAL    NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  next_review  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  topic        TEXT,                                 -- weak topic that produced the card (interview sync)
  created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_cards_due  ON cards(next_review);
CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);
-- Prevents duplicate cards when the same weak topic is synced twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cards_deck_question ON cards(deck_id, question);

CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id     INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  quality     INTEGER NOT NULL CHECK (quality BETWEEN 0 AND 5),
  reviewed_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(reviewed_at);

CREATE TABLE IF NOT EXISTS interview_history (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  role_title           TEXT    NOT NULL,
  score                INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  key_weaknesses_json  TEXT    NOT NULL DEFAULT '[]',  -- [{ "topic": "...", "detail": "..." }]
  session_date         INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_interview_date ON interview_history(session_date);
