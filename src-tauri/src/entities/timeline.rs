use std::{fmt, str::FromStr};

use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Timeline {
    pub id: i64,
    pub server_id: i64,
    pub kind: Kind,
    pub name: String,
    pub sort: i64,
    pub list_id: Option<String>,
}

impl Timeline {
    pub fn new(
        id: i64,
        server_id: i64,
        kind: Kind,
        name: String,
        sort: i64,
        list_id: Option<String>,
    ) -> Self {
        Self {
            id,
            server_id,
            kind,
            name,
            sort,
            list_id,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq, Eq)]
#[sqlx(rename = "kind", rename_all = "lowercase")]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    Home,
    Notifications,
    Local,
    Public,
    Favourites,
    List,
}

impl fmt::Display for Kind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Kind::Home => write!(f, "home"),
            Kind::Notifications => write!(f, "notifications"),
            Kind::Local => write!(f, "local"),
            Kind::Public => write!(f, "public"),
            Kind::Favourites => write!(f, "favourites"),
            Kind::List => write!(f, "list"),
        }
    }
}

impl FromStr for Kind {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "home" => Ok(Kind::Home),
            "notifications" => Ok(Kind::Notifications),
            "local" => Ok(Kind::Local),
            "public" => Ok(Kind::Public),
            "favourites" => Ok(Kind::Favourites),
            "list" => Ok(Kind::List),
            _ => Err(String::from("Unknown timeline kind")),
        }
    }
}
