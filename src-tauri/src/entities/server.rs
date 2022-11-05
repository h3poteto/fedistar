use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Server {
    pub id: i64,
    pub domain: String,
    pub base_url: String,
    pub thumbnail: Option<String>,
    pub account_id: Option<i64>,
}

impl Server {
    pub fn new(id: i64, domain: String, base_url: String, thumbnail: Option<String>) -> Self {
        Self {
            id,
            domain,
            base_url,
            thumbnail,
            account_id: None,
        }
    }
}
