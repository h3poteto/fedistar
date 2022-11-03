#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, State};

pub mod database;
pub mod entities;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn list_accounts(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
) -> Result<Vec<entities::Account>, String> {
    let accounts = database::list_accounts(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(accounts)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    use tauri::async_runtime::block_on;

    const DATABASE_DIR: &str = ".fedistar";
    const DATABASE_FILE: &str = "fedistar.db";
    let home_dir = directories::UserDirs::new()
        .map(|dirs| dirs.home_dir().to_path_buf())
        .unwrap_or_else(|| std::env::current_dir().expect("Cannot access the current directory"));
    let database_dir = home_dir.join(DATABASE_DIR);
    let database_path = database_dir.join(DATABASE_FILE);

    let db_exists = std::fs::metadata(&database_path).is_ok();
    if !db_exists {
        std::fs::create_dir(&database_dir)?;
    }

    let database_dir_str = std::fs::canonicalize(&database_dir)
        .unwrap()
        .to_string_lossy()
        .replace('\\', "/");
    let database_url = format!("sqlite://{}/{}", database_dir_str, DATABASE_FILE);

    let sqlite_pool = block_on(database::create_sqlite_pool(&database_url))?;
    if !db_exists {
        block_on(database::migrate_database(&sqlite_pool))?;
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, list_accounts])
        .setup(|app| {
            app.manage(sqlite_pool);

            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
