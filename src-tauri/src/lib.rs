use base64::{engine::general_purpose, Engine};
use font_kit::source::SystemSource;
use megalodon::{self, oauth};
use rust_i18n::t;
use serde::Serialize;
use std::{env, fs::OpenOptions, path::PathBuf, str::FromStr, thread};
use tauri::{async_runtime::Mutex, AppHandle, Manager, State};
mod database;
mod entities;
mod favicon;
mod menu;
mod settings;
mod streaming;
use tauri::Emitter;

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
    tracing::info!("The favicon for {} is {:#?}", &url, icon);
    let sns = megalodon::detector(url.as_str())
        .await
        .map_err(|e| e.to_string())?;
    tracing::info!("The SNS for {} is {}", &url, sns);

    let server = entities::Server::new(0, domain.to_string(), url, sns.to_string(), icon);
    let created = database::add_server(&sqlite_pool, server)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit("updated-servers", ())
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
        .emit("updated-servers", ())
        .expect("Failed to send updated-servers event");
    app_handle
        .emit("updated-timelines", ())
        .expect("Failed to send updated-timeline event");
    Ok(())
}

#[tauri::command]
async fn add_application(
    _sqlite_pool: State<'_, sqlx::SqlitePool>,
    url: &str,
) -> Result<oauth::AppData, String> {
    let sns = megalodon::detector(url).await.map_err(|e| e.to_string())?;
    let client = megalodon::generator(sns, url.to_string(), None, Some(String::from("fedistar")))
        .map_err(|err| err.to_string())?;

    let options = megalodon::megalodon::AppInputOptions {
        ..Default::default()
    };
    let app_data = client
        .register_app(String::from("Fedistar"), &options)
        .await
        .map_err(|e| e.to_string())?;

    let url = app_data.url.clone().expect("URL is not found");
    tracing::info!("Opening the URL: {}", url);

    thread::spawn(move || match open::that(url) {
        Ok(_) => {}
        Err(e) => {
            tracing::error!("Failed to open the URL: {}", e);
        }
    });
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
    )
    .map_err(|err| err.to_string())?;

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
    )
    .map_err(|err| err.to_string())?;

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
        .emit("updated-servers", ())
        .expect("Failed to send updated-servers event");

    start_user_streaming(&app_handle, server, account).await?;

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
    let timeline = database::add_timeline(&sqlite_pool, &server, &k, name, list_id, &width)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit("updated-timelines", UpdatedTimelinePayload { timelines })
        .expect("Failed to send updated-timelines event");

    start_timeline_streaming(&app_handle, &sqlite_pool, server, timeline).await?;

    Ok(())
}

#[tauri::command]
async fn get_timeline(
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    server: entities::Server,
    kind: &str,
    name: &str,
) -> Result<entities::Timeline, String> {
    let k = entities::timeline::Kind::from_str(kind)?;
    let timeline = database::get_timeline(&sqlite_pool, &server, &k, name)
        .await
        .map_err(|e| e.to_string())?;

    Ok(timeline)
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
        .emit("updated-timelines", ())
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
        .emit("updated-timelines", UpdatedTimelinePayload { timelines })
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
        .emit("updated-timelines", UpdatedTimelinePayload { timelines })
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

    database::update_column_width(&sqlite_pool, id, &width)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit("updated-timelines", UpdatedTimelinePayload { timelines })
        .expect("Failed to updated-timelines event");

    Ok(())
}

#[tauri::command]
async fn update_show_boosts(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
    show_boosts: bool,
) -> Result<(), String> {
    database::update_show_boosts(&sqlite_pool, id, show_boosts)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit("updated-timelines", UpdatedTimelinePayload { timelines })
        .expect("Failed to updated-timelines event");

    Ok(())
}

#[tauri::command]
async fn update_show_replies(
    app_handle: AppHandle,
    sqlite_pool: State<'_, sqlx::SqlitePool>,
    id: i64,
    show_replies: bool,
) -> Result<(), String> {
    database::update_show_replies(&sqlite_pool, id, show_replies)
        .await
        .map_err(|e| e.to_string())?;

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    app_handle
        .emit("updated-timelines", UpdatedTimelinePayload { timelines })
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
        .emit("updated-settings", UpdatedSettingsPayload { settings: res })
        .expect("Failed to update-settings event");
    Ok(())
}

#[tauri::command]
fn toggle_menu(app_handle: AppHandle, settings_path: State<'_, PathBuf>) -> Result<(), String> {
    let window_handle = app_handle
        .get_webview_window("main")
        .expect("Failed to get main window");
    let mut s = settings::read_settings(&settings_path).map_err(|e| e.to_string())?;

    match window_handle.is_menu_visible() {
        Ok(true) => {
            window_handle.hide_menu().expect("Failed to hide menu");
            s.app_menu = Some(settings::AppMenu { hidden: true });
            let _ = settings::save_settings(&settings_path, &s);
            Ok(())
        }
        Ok(false) => {
            window_handle.show_menu().expect("Failed to show menu");
            s.app_menu = Some(settings::AppMenu { hidden: false });
            let _ = settings::save_settings(&settings_path, &s);
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
        .emit("updated-instruction", instruction)
        .expect("Failed to send updated-instruction event");

    Ok(())
}

#[tauri::command]
#[allow(unused_variables)]
async fn switch_devtools(app_handle: AppHandle) -> () {
    #[cfg(any(feature = "devtools", debug_assertions))]
    {
        let window = app_handle
            .get_webview_window("main")
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
        .emit("updated-instruction", instruction)
        .expect("Failed to send updated-instruction event");

    Ok(())
}

#[tauri::command]
async fn frontend_log(message: String, level: String) -> () {
    match level.as_str() {
        "error" => tracing::error!("[front] {}", message),
        "warn" => tracing::warn!("[front] {}", message),
        "info" => tracing::info!("[front] {}", message),
        _ => tracing::debug!("[front] {}", message),
    }
    ()
}

#[tauri::command]
async fn open_media(app_handle: AppHandle, media_url: String) -> () {
    let encoded = general_purpose::STANDARD_NO_PAD.encode(media_url.clone());

    let _ = tauri::WebviewWindowBuilder::new(
        &app_handle,
        encoded,
        tauri::WebviewUrl::External(media_url.parse().unwrap()),
    )
    .menu(menu::media_menu(&app_handle).expect("failed to build media menu"))
    .title(t!("media.title"))
    .on_menu_event(|app, event| match event.id().0.as_str() {
        "close" => {
            app.close().expect("failed to close window");
        }
        _ => {}
    })
    .build()
    .expect("failed to build media window");
}

#[tauri::command]
async fn list_fonts() -> Result<Vec<String>, String> {
    let font_source = SystemSource::new();
    let fonts = font_source.all_families().map_err(|e| {
        let err = e.to_string();
        tracing::error!("Failed to get font families {}", err);
        err
    })?;

    Ok(fonts)
}

async fn update_favicon(sqlite_pool: &sqlx::SqlitePool) -> Result<(), String> {
    let servers = database::list_servers(sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;
    for (mut server, _) in servers {
        let url = server.base_url.clone();
        let icon = favicon::get_favicon_url(&url).await;
        tracing::info!("The favicon for {} is {:#?}", &url, icon);
        server.favicon = icon;
        let _ = database::update_server(sqlite_pool, server)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

async fn start_timeline_streaming(
    app_handle: &AppHandle,
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

    let app_handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        match streaming::start(app_handle, &server, &timeline, account).await {
            Ok(()) => tracing::info!(
                "{} streaming is finished for @{}",
                timeline.name,
                server.domain
            ),
            Err(err) => tracing::error!("{}", err),
        }
    });

    Ok(())
}

async fn start_user_streaming(
    app_handle: &AppHandle,
    server: entities::Server,
    account: entities::Account,
) -> Result<(), String> {
    let app_handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        match streaming::start_user(app_handle, &server, &account).await {
            Ok(()) => tracing::info!(
                "user streaming is finished for {}@{}",
                account.username,
                server.domain
            ),
            Err(err) => tracing::error!("{}", err),
        }
    });

    Ok(())
}

async fn start_streamings(
    app_handle: &AppHandle,
    sqlite_pool: &sqlx::SqlitePool,
) -> Result<(), String> {
    let accounts = database::list_account(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    for (account, server) in accounts.into_iter() {
        start_user_streaming(app_handle, server, account).await?;
    }

    let timelines = database::list_timelines(&sqlite_pool)
        .await
        .map_err(|e| e.to_string())?;

    for (timeline, server) in timelines.into_iter() {
        start_timeline_streaming(app_handle, &sqlite_pool, server, timeline).await?;
    }

    Ok(())
}

fn init_logger(logfile_path: std::path::PathBuf) {
    let log_level = match env::var("FEDISTAR_LOG_LEVEL") {
        Ok(level) => match level.to_lowercase().as_str() {
            "error" => simplelog::LevelFilter::Error,
            "warn" => simplelog::LevelFilter::Warn,
            "info" => simplelog::LevelFilter::Info,
            "debug" => simplelog::LevelFilter::Debug,
            "trace" => simplelog::LevelFilter::Trace,
            _ => simplelog::LevelFilter::Info,
        },
        Err(_) => simplelog::LevelFilter::Info,
    };
    #[allow(unused_mut)]
    let mut logger: Vec<Box<dyn simplelog::SharedLogger>> = vec![simplelog::WriteLogger::new(
        log_level,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    use tauri::async_runtime::block_on;
    #[allow(unused_assignments)]
    #[allow(unused_mut)]
    let mut base_dir: &str = "fedistar";
    const DATABASE_FILE: &str = "fedistar.db";
    const LOGFILE_PATH: &str = "fedistar.log";
    const SETTINGS_PATH: &str = "settings.json";

    #[cfg(debug_assertions)]
    {
        base_dir = "fedistar.dev";
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
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
            update_show_boosts,
            update_show_replies,
            open_media,
            list_fonts,
            get_timeline,
        ])
        .setup(move |app| {
            let app_handle = app.handle().clone();

            let user_dir = app.path().data_dir().unwrap_or_else(|_| {
                std::env::current_dir().expect("Cannot access the current directory")
            });
            let config_dir = user_dir.join(base_dir);
            let config_dir_exists = std::fs::metadata(&config_dir).is_ok();
            if !config_dir_exists {
                std::fs::create_dir(&config_dir)?;
            }
            let log_path = config_dir.join(LOGFILE_PATH);

            init_logger(log_path);

            let settings_path = config_dir.join(SETTINGS_PATH);
            let res = settings::read_settings(&settings_path)?;
            rust_i18n::set_locale(res.appearance.language.to_string().as_str());

            let database_dir_str = std::fs::canonicalize(&config_dir)
                .expect("Failed to canonicalize")
                .to_string_lossy()
                .replace('?', "")
                .replace('\\', "/")
                .replace("//", "");
            let database_url = format!("sqlite://{}/{}", database_dir_str, DATABASE_FILE);

            let sqlite_pool = block_on(database::create_sqlite_pool(&database_url))?;
            block_on(database::migrate_database(&sqlite_pool))?;

            {
                let sqlite_pool = sqlite_pool.clone();
                let app_handle = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    match start_streamings(&app_handle, &sqlite_pool).await {
                        Ok(()) => tracing::info!("user streamings are kicked for all accounts"),
                        Err(e) => tracing::error!("{}", e.to_string()),
                    }
                });
            }

            {
                let sqlite_pool = sqlite_pool.clone();
                tauri::async_runtime::spawn(async move {
                    let _ = update_favicon(&sqlite_pool).await;
                });
            }

            app.manage(sqlite_pool);
            app.manage(Mutex::new(app_handle));

            app.manage(settings_path);

            app.on_menu_event(|app, event| match event.id().0.as_str() {
                "crash_reporting" => {
                    open::that("https://fedistar.net/help#crash_reporting")
                        .expect("Failed to open the URL");
                }
                "quit" => {
                    let app_handle = app.app_handle();
                    app_handle.exit(0);
                }
                _ => {}
            });

            #[cfg(debug_assertions)]
            {
                let window = app
                    .get_webview_window("main")
                    .expect("Failed to get main window");
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .menu(|app_handle| {
            let m = menu::set_menu(app_handle).expect("Failed to generate menu");
            Ok(m)
        })
        .on_page_load(|window, _payload| {
            #[cfg(not(target_os = "macos"))]
            {
                let app = window.app_handle();
                let settings_path = app.state::<PathBuf>().inner();
                if let Ok(s) = settings::read_settings(&settings_path) {
                    if let Some(app_menu) = s.app_menu {
                        if app_menu.hidden {
                            window
                                .app_handle()
                                .hide_menu()
                                .expect("Failed to hide menu");
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
