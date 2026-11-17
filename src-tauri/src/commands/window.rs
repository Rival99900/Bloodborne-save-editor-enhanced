//! Start-up of the main window.
//!
//! The window is created hidden (tauri.conf.json, "visible": false) so the
//! webview starts on a window that has a real size. Minimizing the window
//! while the webview was still loading (white screen) closed the editor.

use std::{thread, time::Duration};
use tauri::{AppHandle, Manager, WebviewWindow};

/// Longest wait for the interface before the window is shown anyway.
const SHOW_FALLBACK: Duration = Duration::from_secs(6);

fn show(window: &WebviewWindow) {
    if !window.is_visible().unwrap_or(false) {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Called by the interface once its first screen is drawn.
#[tauri::command]
pub(crate) fn show_main_window(window: WebviewWindow) {
    show(&window);
}

/// Shows the window even if the interface never calls back (script error),
/// so the editor can never stay invisible.
pub(crate) fn show_later(app: AppHandle) {
    thread::spawn(move || {
        thread::sleep(SHOW_FALLBACK);
        if let Some(window) = app.get_webview_window("main") {
            show(&window);
        }
    });
}
