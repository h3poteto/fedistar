CREATE TABLE IF NOT EXISTS servers(
  id INTEGER PRIMARY KEY,
  domain TEXT NOT NULL,
  base_url TEXT NOT NULL,
  thumbnail TEXT DEFAULT NULL,
  account_id INTEGER DEFAULT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts(
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  account_id TEXT NOT NULL,
  avatar TEXT DEFAULT NULL,
  client_id TEXT DEFAULT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT DEFAULT NULL
);
