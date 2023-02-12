use serde::{Deserialize, Serialize};
use serde_json::{from_str, to_string};
use std::{fmt, fs, path::PathBuf};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Settings {
    pub appearance: Appearance,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Appearance {
    pub font_size: u32,
    pub language: LocaleType,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq, Eq)]
#[sqlx(rename = "locale_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum LocaleType {
    EN,
    JA,
}

pub(crate) fn read_settings(filepath: &PathBuf) -> Result<Settings, String> {
    let Ok(text) = fs::read_to_string(filepath) else {
        // Default settings
        return Ok(Settings {
            appearance: Appearance {
                font_size: 14,
                language: LocaleType::EN,
            }
        })
    };
    from_str::<Settings>(&text).map_err(|err| err.to_string())
}

pub(crate) fn save_settings(filepath: &PathBuf, settings: &Settings) -> Result<(), String> {
    let str = to_string(settings).map_err(|err| err.to_string())?;
    fs::write(filepath, str).map_err(|err| err.to_string())
}

impl fmt::Display for LocaleType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LocaleType::EN => write!(f, "en"),
            LocaleType::JA => write!(f, "ja"),
        }
    }
}
