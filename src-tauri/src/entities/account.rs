use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Account {
    pub id: i64,
    pub username: String,
    pub account_id: String,
    pub avatar: Option<String>,
    // Misskey does not provide client_id.
    pub client_id: Option<String>,
    pub client_secret: String,
    pub access_token: String,
    // Mastodon and Misskey does not provide refresh_token.
    pub refresh_token: Option<String>,
}

impl Account {
    pub fn new(
        id: i64,
        username: String,
        account_id: String,
        avatar: Option<String>,
        client_id: Option<String>,
        client_secret: String,
        access_token: String,
        refresh_token: Option<String>,
    ) -> Self {
        Self {
            id,
            username,
            account_id,
            avatar,
            client_id,
            client_secret,
            access_token,
            refresh_token,
        }
    }
}
