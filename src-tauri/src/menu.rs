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
        .build();
    //    menu.about(Some(about));
    let menu = menu.build()?;

    // #[cfg(target_os = "macos")]
    // {
    //     menu = menu.add_submenu(Submenu::new(
    //         APP_NAME.to_string(),
    //         Menu::new()
    //             .add_native_item(about)
    //             .add_native_item(MenuItem::Separator)
    //             .add_native_item(MenuItem::Services)
    //             .add_native_item(MenuItem::Separator)
    //             .add_native_item(MenuItem::Hide)
    //             .add_native_item(MenuItem::HideOthers)
    //             .add_native_item(MenuItem::ShowAll)
    //             .add_native_item(MenuItem::Separator)
    //             .add_native_item(MenuItem::Quit),
    //     ));
    // }

    #[cfg(not(target_os = "macos"))]
    {
        let submenu = SubmenuBuilder::new(app, t!("app_menu.file"))
            .quit()
            .build()?;
        let _ = menu.append(&submenu)?;
    }

    // #[cfg(not(target_os = "linux"))]
    // let mut edit_menu = Menu::new();
    // #[cfg(target_os = "macos")]
    // {
    //     edit_menu = edit_menu
    //         .add_native_item(MenuItem::Undo)
    //         .add_native_item(MenuItem::Redo)
    //         .add_native_item(MenuItem::Separator);
    // }
    // #[cfg(not(target_os = "linux"))]
    // {
    //     edit_menu = edit_menu
    //         .add_native_item(MenuItem::Cut)
    //         .add_native_item(MenuItem::Copy)
    //         .add_native_item(MenuItem::Paste);

    //     menu = menu.add_submenu(Submenu::new(t!("app_menu.edit"), edit_menu));
    // }

    // #[cfg(not(target_os = "linux"))]
    // let mut window_menu = Menu::new();
    // #[cfg(not(target_os = "linux"))]
    // {
    //     window_menu = window_menu.add_native_item(MenuItem::Minimize);
    // }
    // #[cfg(target_os = "macos")]
    // {
    //     window_menu = window_menu.add_native_item(MenuItem::Zoom);
    // }
    // #[cfg(not(target_os = "linux"))]
    // {
    //     menu = menu.add_submenu(Submenu::new(t!("app_menu.window"), window_menu));
    // }

    //---

    #[cfg(not(target_os = "macos"))]
    {
        let submenu = SubmenuBuilder::new(app, t!("app_menu.help"))
            .about(Some(about))
            .item(&MenuItem::with_id(
                app,
                "crash_reporting",
                t!("add_menu.crash_reporting"),
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
        .close_window()
        .build()?;
    let _ = menu.append(&submenu)?;

    Ok(menu)
}
