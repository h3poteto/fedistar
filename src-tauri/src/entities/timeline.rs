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
    pub column_width: ColumnWidth,
    pub show_boosts: bool,
    pub show_replies: bool,
}

impl Timeline {
    pub fn new(
        id: i64,
        server_id: i64,
        kind: Kind,
        name: String,
        sort: i64,
        list_id: Option<String>,
        column_width: ColumnWidth,
    ) -> Self {
        Self {
            id,
            server_id,
            kind,
            name,
            sort,
            list_id,
            column_width,
            show_boosts: true,
            show_replies: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq, Eq)]
#[sqlx(rename_all = "lowercase")]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    Home,
    Notifications,
    Local,
    Public,
    Favourites,
    List,
    Bookmarks,
    Direct,
    Tag,
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
            Kind::Bookmarks => write!(f, "bookmarks"),
            Kind::Direct => write!(f, "direct"),
            Kind::Tag => write!(f, "tag"),
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
            "bookmarks" => Ok(Kind::Bookmarks),
            "direct" => Ok(Kind::Direct),
            "tag" => Ok(Kind::Tag),
            _ => Err(String::from("Unknown timeline kind")),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq, Eq)]
#[sqlx(rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ColumnWidth {
    XS,
    SM,
    MD,
    LG,
}

impl fmt::Display for ColumnWidth {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ColumnWidth::XS => write!(f, "xs"),
            ColumnWidth::SM => write!(f, "sm"),
            ColumnWidth::MD => write!(f, "md"),
            ColumnWidth::LG => write!(f, "lg"),
        }
    }
}

impl FromStr for ColumnWidth {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "xs" => Ok(ColumnWidth::XS),
            "sm" => Ok(ColumnWidth::SM),
            "md" => Ok(ColumnWidth::MD),
            "lg" => Ok(ColumnWidth::LG),
            _ => Err(String::from("Unknown timeline column width")),
        }
    }
}
