#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::sync::Arc;

use megalodon::{self, oauth};
use serde::Serialize;
use tauri::{async_runtime::Mutex, AppHandle, Manager, State};

pub mod database;
pub mod entities;
pub mod streaming;

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
    app_handle: AppHandle,
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

    app_handle.emit_all("updated-servers", ()).unwrap();
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
    app_handle: AppHandle,
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

    database::add_account(&sqlite_pool, &server, &account)
        .await
        .map_err(|e| e.to_string())?;

    let cloned_handle = Arc::new(app_handle);
    start_user_streaming(cloned_handle, server, account).await?;

    Ok(())
}

// Can we delete this?
// Client side does not use updated-timelines event payload.
#[derive(Clone, Serialize)]
struct UpdatedTimelinePayload {
    timelines: Vec<(entities::Timeline, entities::Server)>,
}

#[tauri::command]
async fn add_timeline(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    server: entities::Server,
    timeline: &str,
) -> Result<(), String> {
    let timeline = database::add_timeline(&sqlite_pool, &server, timeline)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-timelines", UpdatedTimelinePayload { timelines })
        .unwrap();

    let cloned_handle = Arc::new(app_handle);
    start_timeline_streaming(cloned_handle, &sqlite_pool, server, timeline).await?;
    Ok(())
}

#[tauri::command]
async fn list_timelines(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
) -> Result<Vec<(entities::Timeline, entities::Server)>, String> {
    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(timelines)
}

#[tauri::command]
async fn remove_timeline(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<(), String> {
    database::remove_timeline(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    app_handle.emit_all("updated-timelines", ()).unwrap();
    Ok(())
}

#[tauri::command]
async fn get_account(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<entities::Account, String> {
    let account = database::get_account(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(account)
}

#[tauri::command]
async fn switch_left_timeline(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<(), String> {
    database::switch_left_timeline(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-timelines", UpdatedTimelinePayload { timelines })
        .unwrap();

    Ok(())
}

#[tauri::command]
async fn switch_right_timeline(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<(), String> {
    database::switch_right_timeline(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-timelines", UpdatedTimelinePayload { timelines })
        .unwrap();

    Ok(())
}

async fn start_timeline_streaming(
    app_handle: Arc<AppHandle>,
    sqlite_pool: &sqlx::SqlitePool,
    server: entities::Server,
    timeline: entities::Timeline,
) -> Result<(), String> {
    if timeline.timeline == "home" || timeline.timeline == "notifications" {
        return Ok(());
    }
    let mut account: Option<entities::Account> = None;
    if let Some(account_id) = server.account_id {
        let a = database::get_account(&sqlite_pool, account_id)
            .await
            .map_err(|e| e.to_string())?;
        account = Some(a);
    }

    tauri::async_runtime::spawn(async move {
        match streaming::start(app_handle, &server, &timeline, account).await {
            Ok(()) => log::info!(
                "{} streaming is finished for @{}",
                timeline.timeline,
                server.domain
            ),
            Err(err) => log::error!("{}", err),
        }
    });

    Ok(())
}

async fn start_user_streaming(
    app_handle: Arc<AppHandle>,
    server: entities::Server,
    account: entities::Account,
) -> Result<(), String> {
    tauri::async_runtime::spawn(async move {
        match streaming::start_user(app_handle, &server, &account).await {
            Ok(()) => log::info!(
                "user streaming is finished for {}@{}",
                account.username,
                server.domain
            ),
            Err(err) => log::error!("{}", err),
        }
    });

    Ok(())
}

async fn start_streamings(
    app_handle: AppHandle,
    sqlite_pool: &sqlx::SqlitePool,
) -> Result<(), String> {
    let accounts = database::list_account(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    let user_handle = Arc::new(app_handle);
    let timeline_handle = Arc::clone(&user_handle);

    for (account, server) in accounts.into_iter() {
        let cloned_handle = Arc::clone(&user_handle);
        start_user_streaming(cloned_handle, server, account).await?;
    }

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    for (timeline, server) in timelines.into_iter() {
        let cloned_handle = Arc::clone(&timeline_handle);
        start_timeline_streaming(cloned_handle, &sqlite_pool, server, timeline).await?;
    }

    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    use tauri::async_runtime::block_on;

    env_logger::init();

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
            list_servers,
            add_server,
            add_application,
            authorize_code,
            add_timeline,
            list_timelines,
            remove_timeline,
            get_account,
            switch_left_timeline,
            switch_right_timeline,
        ])
        .setup(|app| {
            let app_handle = app.handle();
            let cloned_pool = sqlite_pool.clone();
            tauri::async_runtime::spawn(async move {
                match start_streamings(app_handle, &cloned_pool).await {
                    Ok(()) => log::info!("user streamings are kicked for all accounts"),
                    Err(e) => log::error!("{}", e.to_string()),
                }
            });

            app.manage(sqlite_pool);
            let handle = app.handle();
            app.manage(Mutex::new(handle));

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
