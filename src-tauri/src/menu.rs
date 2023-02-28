use rust_i18n::t;
use tauri::{AboutMetadata, Menu, MenuItem, Submenu};

const APP_NAME: &str = "Fedistar";

pub fn menu() -> Menu {
    let mut menu = Menu::new();

    let about = MenuItem::About(
        APP_NAME.to_string(),
        AboutMetadata::new()
            .authors(vec!["Akira Fukushima".to_string()])
            .copyright("2022 Akira Fukushima, Haruka Kurosaki")
            .license("GPL")
            .website("https://fedistar.net"),
    );

    #[cfg(target_os = "macos")]
    {
        menu = menu.add_submenu(Submenu::new(
            APP_NAME.to_string(),
            Menu::new()
                .add_native_item(about)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Services)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Hide)
                .add_native_item(MenuItem::HideOthers)
                .add_native_item(MenuItem::ShowAll)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        ));
    }

    #[cfg(not(target_os = "macos"))]
    {
        let file_menu = Menu::new().add_native_item(MenuItem::Quit);
        menu = menu.add_submenu(Submenu::new(t!("app_menu.file"), file_menu));
    }

    #[cfg(not(target_os = "linux"))]
    let mut edit_menu = Menu::new();
    #[cfg(target_os = "macos")]
    {
        edit_menu = edit_menu
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo)
            .add_native_item(MenuItem::Separator);
    }
    #[cfg(not(target_os = "linux"))]
    {
        edit_menu = edit_menu
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste);

        menu = menu.add_submenu(Submenu::new(t!("app_menu.edit"), edit_menu));
    }

    #[cfg(not(target_os = "linux"))]
    let mut window_menu = Menu::new();
    #[cfg(not(target_os = "linux"))]
    {
        window_menu = window_menu.add_native_item(MenuItem::Minimize);
    }
    #[cfg(target_os = "macos")]
    {
        window_menu = window_menu.add_native_item(MenuItem::Zoom);
    }
    #[cfg(not(target_os = "linux"))]
    {
        menu = menu.add_submenu(Submenu::new(t!("app_menu.window"), window_menu));
    }

    #[cfg(not(target_os = "macos"))]
    {
        let help_menu = Menu::new().add_native_item(about);
        menu = menu.add_submenu(Submenu::new(t!("app_menu.help"), help_menu));
    }
    menu
}
