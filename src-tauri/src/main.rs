#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use megalodon::{self, oauth};
use tauri::{Manager, State};

pub mod database;
pub mod entities;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn list_servers(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
) -> Result<Vec<entities::Server>, String> {
    let servers = database::list_servers(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(servers)
}

#[tauri::command]
async fn add_server(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    domain: &str,
) -> Result<entities::Server, String> {
    let url = format!("https://{}", domain);
    let sns = megalodon::detector(url.as_str())
        .await
        .map_err(|e| e.to_string())?;

    let client = megalodon::generator(sns, url.clone(), None, Some(String::from("fedistar")));
    let res = client.get_instance().await.map_err(|e| e.to_string())?;

    let server = entities::Server::new(0, domain.to_string(), url, res.json.thumbnail);
    let created = database::add_server(&sqlite_pool, server)
        .await
        .map_err(|e| e.to_string())?;
    Ok(created)
}

#[tauri::command]
async fn add_application(
    _sqlite_pool: State<'_, sqlx::SqlitePool>,
    url: &str,
) -> Result<oauth::AppData, String> {
    let sns = megalodon::detector(url).await.map_err(|e| e.to_string())?;
    let client = megalodon::generator(
        sns,
        url.clone().to_string(),
        None,
        Some(String::from("fedistar")),
    );

    let options = megalodon::megalodon::AppInputOptions {
        redirect_uris: None,
        scopes: Some(
            [
                "read".to_string(),
                "write".to_string(),
                "follow".to_string(),
            ]
            .to_vec(),
        ),
        website: None,
    };
    let app_data = client
        .register_app(String::from("Fedistar"), &options)
        .await
        .map_err(|e| e.to_string())?;

    let url = app_data.url.clone();
    open::that(url.unwrap()).unwrap();
    Ok(app_data)
}

#[tauri::command]
async fn authorize_code(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    server: entities::Server,
    app: oauth::AppData,
    code: &str,
) -> Result<(), String> {
    let sns = megalodon::detector(&server.base_url)
        .await
        .map_err(|e| e.to_string())?;
    let client = megalodon::generator(
        sns.clone(),
        server.base_url.clone().to_string(),
        None,
        Some(String::from("fedistar")),
    );

    let client_id = app.client_id;
    let client_secret = app.client_secret;

    let token_data = client
        .fetch_access_token(
            client_id.clone(),
            client_secret.clone(),
            code.to_string(),
            megalodon::default::NO_REDIRECT.to_string(),
        )
        .await
        .map_err(|e| e.to_string())?;

    let authorized_client = megalodon::generator(
        sns,
        server.base_url.clone().to_string(),
        Some(token_data.access_token.clone()),
        Some(String::from("fedistar")),
    );

    let account_data = authorized_client
        .verify_account_credentials()
        .await
        .map_err(|e| e.to_string())?;

    let account = entities::Account::new(
        0,
        account_data.json.username,
        account_data.json.id,
        Some(account_data.json.avatar),
        Some(client_id),
        client_secret,
        token_data.access_token,
        token_data.refresh_token,
    );

    database::add_account(&sqlite_pool, server, account)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
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
        .invoke_handler(tauri::generate_handler![
            greet,
            list_servers,
            add_server,
            add_application,
            authorize_code
        ])
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
