use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Account {
    id: i64,
    domain: String,
    base_url: String,
    username: String,
    account_id: String,
    avatar: Option<String>,
    // Misskey does not provide client_id.
    client_id: Option<String>,
    client_secret: String,
    access_token: String,
    // Mastodon and Misskey does not provide refresh_token.
    refresh_token: Option<String>,
}

impl Account {
    pub fn new(
        id: i64,
        domain: String,
        base_url: String,
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
            domain,
            base_url,
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
