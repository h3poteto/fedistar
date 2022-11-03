CREATE TABLE IF NOT EXISTS accounts(
  id INTEGER PRIMARY KEY,
  domain TEXT NOT NULL,
  base_url TEXT NOT NULL,
  username TEXT NOT NULL,
  account_id TEXT NOT NULL,
  avatar TEXT,
  client_id TEXT,
  client_secret TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL
)
