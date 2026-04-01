use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use std::path::PathBuf;

#[derive(serde::Deserialize, Clone)]
pub struct TrayRoutine {
    pub id: String,
    pub name: String,
    pub icon: String,
}

fn build_tray_menu(app: &AppHandle, routines: &[TrayRoutine]) -> tauri::Result<Menu<tauri::Wry>> {
    let open = MenuItem::with_id(app, "open", "Open Routify", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Routify", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;

    if routines.is_empty() {
        return Menu::with_items(app, &[&open, &sep, &quit]);
    }

    let sep2 = PredefinedMenuItem::separator(app)?;

    // Build routine items (max 7 to avoid overflow)
    let routine_items: Vec<MenuItem<tauri::Wry>> = routines
        .iter()
        .take(7)
        .filter_map(|r| {
            let id = format!("routine_{}", r.id);
            let label = format!("{} {}", r.icon, r.name);
            MenuItem::with_id(app, id, label, true, None::<&str>).ok()
        })
        .collect();

    let mut refs: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> =
        vec![&open, &sep];

    for item in &routine_items {
        refs.push(item);
    }
    refs.push(&sep2);
    refs.push(&quit);

    Menu::with_items(app, &refs)
}

// ---------------------------------------------------------------------------
// iCloud sync commands
// ---------------------------------------------------------------------------

fn icloud_dir() -> Option<PathBuf> {
    let home = std::env::var("HOME").ok()?;
    Some(PathBuf::from(home)
        .join("Library/Mobile Documents/com~apple~CloudDocs/Routify"))
}

#[tauri::command]
fn icloud_export(data: String) -> Result<(), String> {
    let dir = icloud_dir().ok_or("iCloud Drive not found")?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    std::fs::write(dir.join("routify-backup.json"), data).map_err(|e| e.to_string())
}

#[tauri::command]
fn icloud_import() -> Result<String, String> {
    let dir = icloud_dir().ok_or("iCloud Drive not found")?;
    std::fs::read_to_string(dir.join("routify-backup.json")).map_err(|e| e.to_string())
}

#[tauri::command]
fn icloud_backup_exists() -> bool {
    icloud_dir()
        .map(|d| d.join("routify-backup.json").exists())
        .unwrap_or(false)
}

// ---------------------------------------------------------------------------
// Tray menu command
// ---------------------------------------------------------------------------

#[tauri::command]
fn update_tray_menu(app: AppHandle, routines: Vec<TrayRoutine>) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main") {
        let menu = build_tray_menu(&app, &routines).map_err(|e| e.to_string())?;
        tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let initial_menu = build_tray_menu(app.handle(), &[])?;

            TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&initial_menu)
                .menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .on_menu_event(|app, event| {
                    let id = event.id.as_ref();
                    match id {
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        id if id.starts_with("routine_") => {
                            let routine_id = &id["routine_".len()..];
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let script = format!(
                                    "window.__routify_navigate && window.__routify_navigate('/focus/{}')",
                                    routine_id
                                );
                                let _ = window.eval(&script);
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            update_tray_menu,
            icloud_export,
            icloud_import,
            icloud_backup_exists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
