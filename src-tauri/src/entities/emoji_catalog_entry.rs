use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct EmojiCatalogEntry {
    pub source_domain: String,
    pub shortcode: String,
    pub image_url: String,
    pub static_url: Option<String>,
}
