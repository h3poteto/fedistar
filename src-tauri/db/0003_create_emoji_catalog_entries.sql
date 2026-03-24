CREATE TABLE IF NOT EXISTS emoji_catalog_entries(
  source_domain TEXT NOT NULL,
  shortcode TEXT NOT NULL,
  image_url TEXT NOT NULL,
  static_url TEXT DEFAULT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (source_domain, shortcode)
);
