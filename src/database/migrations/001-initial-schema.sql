CREATE TABLE IF NOT EXISTS stock (
  item_code TEXT    NOT NULL,
  location  TEXT    NOT NULL,
  on_hand   INTEGER NOT NULL DEFAULT 0,
  reserved  INTEGER NOT NULL DEFAULT 0,
  version   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (item_code, location)
);

CREATE TABLE IF NOT EXISTS reservations (
  id           TEXT    PRIMARY KEY,
  request_id   TEXT    UNIQUE NOT NULL,
  item_code    TEXT    NOT NULL,
  location     TEXT    NOT NULL,
  qty          INTEGER NOT NULL,
  state        TEXT    NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  confirmed_at INTEGER,
  cancelled_at INTEGER
);

CREATE TABLE IF NOT EXISTS transactions (
  seq                 INTEGER PRIMARY KEY AUTOINCREMENT,
  ts                  INTEGER NOT NULL,
  event_type          TEXT    NOT NULL,
  item_code           TEXT    NOT NULL,
  location            TEXT    NOT NULL,
  qty_delta           INTEGER,
  reservation_id      TEXT,
  reason              TEXT,
  resulting_on_hand   INTEGER,
  resulting_reserved  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_transactions_item       ON transactions(item_code, location, ts);
CREATE INDEX IF NOT EXISTS idx_transactions_reservation ON transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_state       ON reservations(state, expires_at);
