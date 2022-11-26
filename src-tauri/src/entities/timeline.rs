use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Timeline {
    pub id: i64,
    pub server_id: i64,
    pub timeline: String,
    pub sort: i64,
    pub list_id: Option<String>,
}

impl Timeline {
    pub fn new(
        id: i64,
        server_id: i64,
        timeline: String,
        sort: i64,
        list_id: Option<String>,
    ) -> Self {
        Self {
            id,
            server_id,
            timeline,
            sort,
            list_id,
        }
    }
}
