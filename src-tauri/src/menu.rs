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
            .about(Some(about))
            .separator()
            .services()
            .separator()
            .hide()
            .hide_others()
            .show_all()
            .separator()
            .quit()
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
    let edit_menu = SubmenuBuilder::new(app, t!("app_menu.edit"));
    #[cfg(target_os = "macos")]
    {
        edit_menu.undo().redo().separator();
    }
    #[cfg(not(target_os = "linux"))]
    {
        let submenu = edit_menu.cut().copy().paste().build()?;
        let _ = menu.append(&submenu)?;
    }

    #[cfg(not(target_os = "linux"))]
    {
        let submenu = SubmenuBuilder::new(app, t!("app_menu.window"))
            .minimize()
            .build()?;
        let _ = menu.append(&submenu)?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let submenu = SubmenuBuilder::new(app, t!("app_menu.help"))
            .about(Some(about))
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
