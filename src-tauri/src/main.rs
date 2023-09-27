#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::{fs::OpenOptions, path::PathBuf, str::FromStr, sync::Arc};

use megalodon::{self, oauth};
use serde::Serialize;
use tauri::{async_runtime::Mutex, AppHandle, Manager, State};

mod database;
mod entities;
mod favicon;
mod menu;
mod settings;
mod streaming;

rust_i18n::i18n!("locales");

#[tauri::command]
async fn list_servers(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
) -> Result<Vec<(entities::Server, Option<entities::Account>)>, String> {
    let servers = database::list_servers(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(servers)
}

#[tauri::command]
async fn get_server(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<entities::Server, String> {
    let server = database::get_server(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(server)
}

#[tauri::command]
async fn add_server(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    domain: &str,
) -> Result<entities::Server, String> {
    let url = format!("https://{}", domain);

    let icon = favicon::get_favicon_url(&url).await;
    log::info!("The favicon for {} is {:#?}", &url, icon);
    let sns = megalodon::detector(url.as_str())
        .await
        .map_err(|e| e.to_string())?;
    log::info!("The SNS for {} is {}", &url, sns);

    let server = entities::Server::new(0, domain.to_string(), url, sns.to_string(), icon);
    let created = database::add_server(&sqlite_pool, server)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-servers", ())
        .expect("Failed to send updated-servers event");

    Ok(created)
}

#[tauri::command]
async fn remove_server(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<(), String> {
    database::remove_server(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-servers", ())
        .expect("Failed to send updated-servers event");
    app_handle
        .emit_all("updated-timelines", ())
        .expect("Failed to send updated-timeline event");
    Ok(())
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
        ..Default::default()
    };
    let app_data = client
        .register_app(String::from("Fedistar"), &options)
        .await
        .map_err(|e| e.to_string())?;

    let url = app_data.url.clone();
    open::that(url.expect("URL is not found")).expect("Failed to open the URL");
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

    let authorization_code = if let Some(session_token) = app.session_token {
        session_token
    } else {
        code.to_string()
    };

    let token_data = client
        .fetch_access_token(
            client_id.clone(),
            client_secret.clone(),
            authorization_code,
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
        false,
    );

    database::add_account(&sqlite_pool, &server, &account)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-servers", ())
        .expect("Failed to send updated-servers event");

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

#[derive(Clone, Serialize)]
struct UpdatedSettingsPayload {
    settings: settings::Settings,
}

#[tauri::command]
async fn add_timeline(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    server: entities::Server,
    kind: &str,
    name: &str,
    column_width: &str,
    list_id: Option<&str>,
) -> Result<(), String> {
    let k = entities::timeline::Kind::from_str(kind)?;
    let width = entities::timeline::ColumnWidth::from_str(column_width)?;
    print!("{:#?}", &width);
    let timeline = database::add_timeline(&sqlite_pool, &server, &k, name, list_id, &width)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-timelines", UpdatedTimelinePayload { timelines })
        .expect("Failed to send updated-timelines event");

    let cloned_handle = Arc::new(app_handle);
    start_timeline_streaming(cloned_handle, &sqlite_pool, server, timeline).await?;

    Ok(())
}

#[tauri::command]
async fn list_accounts(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
) -> Result<Vec<(entities::Account, entities::Server)>, String> {
    let accounts = database::list_account(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(accounts)
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

    app_handle
        .emit_all("updated-timelines", ())
        .expect("Failed to updated-timelines event");
    Ok(())
}

#[tauri::command]
async fn get_account(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<(entities::Account, entities::Server), String> {
    let account = database::get_account(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(account)
}

#[tauri::command]
async fn set_usual_account(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
) -> Result<(), String> {
    let _ = database::set_usual_account(&sqlite_pool, id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
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
        .expect("Failed to updated-timelines event");

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
        .expect("Failed to updated-timelines event");

    Ok(())
}

#[tauri::command]
async fn update_column_width(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
    column_width: &str,
) -> Result<(), String> {
    let width = entities::timeline::ColumnWidth::from_str(column_width)?;
    print!("{:#?}", width);

    database::update_column_width(&sqlite_pool, id, &width)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit_all("updated-timelines", UpdatedTimelinePayload { timelines })
        .expect("Failed to updated-timelines event");

    Ok(())
}

#[tauri::command]
fn read_settings(settings_path: State<'_, PathBuf>) -> Result<settings::Settings, String> {
    settings::read_settings(&settings_path)
}

#[tauri::command]
fn save_settings(
    app_handle: AppHandle,
    settings_path: State<'_, PathBuf>,
    obj: settings::Settings,
) -> Result<(), String> {
    let _ = settings::save_settings(&settings_path, &obj)?;
    let res = settings::read_settings(&settings_path)?;
    app_handle
        .emit_all("updated-settings", UpdatedSettingsPayload { settings: res })
        .expect("Failed to update-settings event");
    Ok(())
}

#[tauri::command]
fn toggle_menu(app_handle: AppHandle) -> Result<(), String> {
    let menu_handle = app_handle
        .get_window("main")
        .expect("Failed to get main window")
        .menu_handle();

    match menu_handle.is_visible() {
        Ok(true) => {
            menu_handle.hide().expect("Failed to hide menu");
            Ok(())
        }
        Ok(false) => {
            menu_handle.show().expect("Failed to show menu");
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_instruction(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
) -> Result<entities::Instruction, String> {
    let instruction = database::get_instruction(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(instruction)
}

#[tauri::command]
async fn init_instruction(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
) -> Result<(), String> {
    let instruction = database::init_instruction(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;
    app_handle
        .emit_all("updated-instruction", instruction)
        .expect("Failed to send updated-instruction event");

    Ok(())
}

#[tauri::command]
async fn switch_devtools(app_handle: AppHandle) -> () {
    #[cfg(any(feature = "devtools", debug_assertions))]
    {
        let window = app_handle
            .get_window("main")
            .expect("Failed to get main window");
        window.open_devtools();
        window.close_devtools();
    }
    ()
}

#[tauri::command]
async fn update_instruction(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    step: u32,
) -> Result<(), String> {
    let instruction = database::update_instruction(&sqlite_pool, step)
        .await
        .map_err(|e| e.to_string())?;
    app_handle
        .emit_all("updated-instruction", instruction)
        .expect("Failed to send updated-instruction event");

    Ok(())
}

#[tauri::command]
async fn frontend_log(message: String, level: String) -> () {
    match level.as_str() {
        "error" => log::error!("[front] {}", message),
        "warn" => log::warn!("[front] {}", message),
        "info" => log::info!("[front] {}", message),
        _ => log::debug!("[front] {}", message),
    }
    ()
}

async fn start_timeline_streaming(
    app_handle: Arc<AppHandle>,
    sqlite_pool: &sqlx::SqlitePool,
    server: entities::Server,
    timeline: entities::Timeline,
) -> Result<(), String> {
    if timeline.kind == entities::timeline::Kind::Home
        || timeline.kind == entities::timeline::Kind::Notifications
        || timeline.kind == entities::timeline::Kind::Favourites
        || timeline.kind == entities::timeline::Kind::Bookmarks
    {
        return Ok(());
    }
    let mut account: Option<entities::Account> = None;
    if let Some(account_id) = server.account_id {
        let (a, _) = database::get_account(&sqlite_pool, account_id)
            .await
            .map_err(|e| e.to_string())?;
        account = Some(a);
    }

    tauri::async_runtime::spawn(async move {
        match streaming::start(app_handle, &server, &timeline, account).await {
            Ok(()) => log::info!(
                "{} streaming is finished for @{}",
                timeline.name,
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

fn init_logger(logfile_path: std::path::PathBuf) {
    let mut logger: Vec<Box<dyn simplelog::SharedLogger>> = vec![simplelog::WriteLogger::new(
        simplelog::LevelFilter::Info,
        simplelog::ConfigBuilder::new()
            .set_time_format_rfc3339()
            .build(),
        OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .append(true)
            .open(logfile_path)
            .expect("Failed to open logfile"),
    )];
    #[cfg(debug_assertions)]
    {
        logger.push(simplelog::TermLogger::new(
            simplelog::LevelFilter::Debug,
            simplelog::ConfigBuilder::new()
                .set_time_format_rfc3339()
                .build(),
            simplelog::TerminalMode::Mixed,
            simplelog::ColorChoice::Auto,
        ));
    }

    simplelog::CombinedLogger::init(logger).expect("Failed to initialize logger");
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    use tauri::async_runtime::block_on;
    let mut base_dir: &str = "fedistar";
    const DATABASE_FILE: &str = "fedistar.db";
    const LOGFILE_PATH: &str = "fedistar.log";
    const SETTINGS_PATH: &str = "settings.json";

    #[cfg(debug_assertions)]
    {
        base_dir = "fedistar.dev";
    }

    let user_dir = tauri::api::path::data_dir()
        .unwrap_or_else(|| std::env::current_dir().expect("Cannot access the current directory"));
    let config_dir = user_dir.join(base_dir);
    let config_dir_exists = std::fs::metadata(&config_dir).is_ok();
    if !config_dir_exists {
        std::fs::create_dir(&config_dir)?;
    }
    let log_path = config_dir.join(LOGFILE_PATH);

    init_logger(log_path);

    let settings_path = config_dir.join(SETTINGS_PATH);

    let database_dir_str = std::fs::canonicalize(&config_dir)
        .expect("Failed to canonicalize")
        .to_string_lossy()
        .replace('?', "")
        .replace('\\', "/")
        .replace("//", "");
    let database_url = format!("sqlite://{}/{}", database_dir_str, DATABASE_FILE);

    let sqlite_pool = block_on(database::create_sqlite_pool(&database_url))?;
    block_on(database::migrate_database(&sqlite_pool))?;

    let res = settings::read_settings(&settings_path)?;
    rust_i18n::set_locale(res.appearance.language.to_string().as_str());

    tauri::Builder::default()
        .menu(menu::menu())
        .on_menu_event(|event| match event.menu_item_id() {
            "crash_reporting" => {
                open::that("https://fedistar.net/help#crash_reporting")
                    .expect("Failed to open the URL");
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            list_servers,
            get_server,
            add_server,
            remove_server,
            add_application,
            authorize_code,
            get_account,
            set_usual_account,
            list_accounts,
            add_timeline,
            list_timelines,
            remove_timeline,
            switch_left_timeline,
            switch_right_timeline,
            toggle_menu,
            read_settings,
            save_settings,
            get_instruction,
            init_instruction,
            update_instruction,
            switch_devtools,
            frontend_log,
            update_column_width,
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
            app.manage(settings_path);

            let window = app.get_window("main").expect("Failed to get main window");
            #[cfg(not(target_os = "macos"))]
            {
                window.menu_handle().hide().expect("Failed to hide menu");
            }

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
