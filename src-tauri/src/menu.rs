use rust_i18n::t;
use tauri::menu::{AboutMetadataBuilder, Menu, MenuBuilder, MenuItem, SubmenuBuilder};
use tauri::{AppHandle, Wry};

const APP_NAME: &str = "Fedistar";

pub fn set_menu(app: &AppHandle) -> Result<Menu<Wry>, tauri::Error> {
    let menu = MenuBuilder::new(app);

    let about = AboutMetadataBuilder::new()
        .name(Some(APP_NAME.to_string()))
        .authors(Some(vec!["Akira Fukushima".to_string()]))
        .copyright(Some("2022 Akira Fukushima, Haruka Kurosaki".to_string()))
        .license(Some("GPL".to_string()))
        .website(Some("https://fedistar.net"))
        .version(app.config().version.clone())
        .build();

    let menu = menu.build()?;

    #[cfg(target_os = "macos")]
    {
        let submenu = SubmenuBuilder::new(app, APP_NAME.to_string())
            .about_with_text(t!("app_menu.about"), Some(about))
            .separator()
            .services_with_text(t!("app_menu.services"))
            .separator()
            .hide_with_text(t!("app_menu.hide"))
            .hide_others_with_text(t!("app_menu.hide_others"))
            .show_all_with_text(t!("app_menu.show_all"))
            .separator()
            .quit_with_text(t!("app_menu.quit"))
            .build()?;
        let _ = menu.append(&submenu)?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let submenu = SubmenuBuilder::new(app, t!("app_menu.file"))
            .item(&MenuItem::with_id(
                app,
                "quit",
                t!("app_menu.quit"),
                true,
                None::<&str>,
            )?)
            .build()?;
        let _ = menu.append(&submenu)?;
    }

    #[cfg(not(target_os = "linux"))]
    {
        let mut edit_menu = SubmenuBuilder::new(app, t!("app_menu.edit"));
        #[cfg(target_os = "macos")]
        {
            edit_menu = edit_menu
                .undo_with_text(t!("app_menu.undo"))
                .redo_with_text(t!("app_menu.redo"))
                .separator();
        }
        let submenu = edit_menu
            .cut_with_text(t!("app_menu.cut"))
            .copy_with_text(t!("app_menu.copy"))
            .paste_with_text(t!("app_menu.paste"))
            .build()?;
        let _ = menu.append(&submenu)?;
    }

    #[cfg(not(target_os = "linux"))]
    {
        let submenu = SubmenuBuilder::new(app, t!("app_menu.window"))
            .minimize_with_text(t!("app_menu.minimize"))
            .build()?;
        let _ = menu.append(&submenu)?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let submenu = SubmenuBuilder::new(app, t!("app_menu.help"))
            .about_with_text(t!("app_menu.about"), Some(about))
            .item(&MenuItem::with_id(
                app,
                "crash_reporting",
                t!("app_menu.crash_reporting"),
                true,
                None::<&str>,
            )?)
            .build()?;
        let _ = menu.append(&submenu)?;
    }

    Ok(menu)
}

pub fn media_menu(app: &AppHandle) -> Result<Menu<Wry>, tauri::Error> {
    let menu = MenuBuilder::new(app).build()?;
    let submenu = SubmenuBuilder::new(app, t!("app_menu.file"))
        .item(&MenuItem::with_id(
            app,
            "close",
            t!("app_menu.close"),
            true,
            None::<&str>,
        )?)
        .build()?;
    let _ = menu.append(&submenu)?;

    Ok(menu)
}
