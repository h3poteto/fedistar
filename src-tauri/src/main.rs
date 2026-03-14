#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    if cfg!(target_os = "linux") {
        unsafe {
            // https://github.com/h3poteto/fedistar/issues/2100
            // https://github.com/tauri-apps/tao/issues/1046
            // https://github.com/tauri-apps/tauri/issues/14251
            // In Wayland, tauri generates custom title bar. So, this collide with the desktop generated title bar.
            // For workaround, use X11 temporarily.
            std::env::set_var("GDK_BACKEND", "x11");
            // https://github.com/tauri-apps/tauri/issues/9394
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }
    let _ = fedistar::run();
}
