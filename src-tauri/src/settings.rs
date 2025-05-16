use serde::{Deserialize, Serialize};
use serde_json::{from_str, to_string, Value};
use std::{fmt, fs, path::PathBuf};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Settings {
    pub appearance: Appearance,
    pub behavior: Option<Behavior>,
    pub app_menu: Option<AppMenu>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Appearance {
    pub font_size: u32,
    pub font_family: Option<String>,
    pub language: LocaleType,
    pub color_theme: ThemeType,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Behavior {
    pub confirm_reblog: bool,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct AppMenu {
    pub hidden: bool,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq, Eq)]
#[sqlx(rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum LocaleType {
    En,
    Ja,
    It,
    #[sqlx(rename = "pt-BR")]
    #[serde(rename = "pt-BR")]
    PtBr,
    Fr,
    De,
    #[sqlx(rename = "zh-CN")]
    #[serde(rename = "zh-CN")]
    ZhCN,
    Ko,
    #[sqlx(rename = "es-ES")]
    #[serde(rename = "es-ES")]
    EsES,
    Id,
    Pl,
    Ia,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq, Eq)]
#[sqlx(rename_all = "kebab-case")]
#[serde(rename_all = "kebab-case")]
pub enum ThemeType {
    Dark,
    Light,
    HighContrast,
}

pub(crate) fn read_settings(filepath: &PathBuf) -> Result<Settings, String> {
    let Ok(text) = fs::read_to_string(filepath) else {
        // Default settings
        return Ok(Settings {
            appearance: Appearance {
                font_size: 14,
                font_family: None,
                language: LocaleType::En,
                color_theme: ThemeType::Dark,
            },
            behavior: Some(Behavior {
                confirm_reblog: false,
            }),
            app_menu: Some(AppMenu { hidden: false }),
        });
    };
    let updated = update_settings_with_default(filepath, text)?;
    from_str::<Settings>(&updated).map_err(|err| err.to_string())
}

pub(crate) fn save_settings(filepath: &PathBuf, settings: &Settings) -> Result<(), String> {
    let str = to_string(settings).map_err(|err| err.to_string())?;
    fs::write(filepath, str).map_err(|err| err.to_string())
}

pub(crate) fn update_settings_with_default(
    filepath: &PathBuf,
    original: String,
) -> Result<String, String> {
    let Ok(text) = fs::read_to_string(filepath) else {
        return Err("Settings file does not exist".to_string());
    };
    let Ok(value) = serde_json::from_str::<Value>(text.as_str()) else {
        return Err("Failed to load json".to_string());
    };
    if value["appearance"]["color_theme"] == Value::Null {
        let mut update = value.clone();
        update["appearance"]["color_theme"] = Value::String("dark".to_string());
        let str = update.to_string();
        let _ = fs::write(filepath, str).map_err(|err| err.to_string());
        return Ok(update.to_string());
    }
    Ok(original)
}

impl fmt::Display for LocaleType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LocaleType::En => write!(f, "en"),
            LocaleType::Ja => write!(f, "ja"),
            LocaleType::It => write!(f, "it"),
            LocaleType::PtBr => write!(f, "pt-BR"),
            LocaleType::Fr => write!(f, "fr"),
            LocaleType::De => write!(f, "de"),
            LocaleType::ZhCN => write!(f, "zh-CN"),
            LocaleType::Ko => write!(f, "ko"),
            LocaleType::EsES => write!(f, "es-ES"),
            LocaleType::Id => write!(f, "id"),
            LocaleType::Pl => write!(f, "pl"),
            LocaleType::Ia => write!(f, "ia"),
        }
    }
}
