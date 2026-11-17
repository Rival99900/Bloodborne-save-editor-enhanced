//! PS4/PS5 over FTP.

use crate::data_handling::{self, save::SaveData};
use tauri::{path::BaseDirectory, Manager};

#[tauri::command]
pub(crate) async fn ps4_ftp_list(
    host: String,
    port: u16,
    dir: String,
) -> Result<Vec<data_handling::ps4_ftp::RemoteEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || data_handling::ps4_ftp::list(&host, port, &dir))
        .await
        .map_err(|error| error.to_string())?
}

/// Downloads a console file into the app cache and returns the local path,
/// which the frontend then opens with `make_save`.
#[tauri::command]
pub(crate) async fn ps4_ftp_download(
    host: String,
    port: u16,
    remote: String,
    handle: tauri::AppHandle,
) -> Result<String, String> {
    let cache = handle
        .path()
        .app_cache_dir()
        .map_err(|error| error.to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        data_handling::ps4_ftp::download_to(&cache, &host, port, &remote)
            .map(|path| path.to_string_lossy().to_string())
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub(crate) async fn ps4_ftp_upload(
    host: String,
    port: u16,
    local: String,
    remote: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        data_handling::ps4_ftp::upload(&host, port, std::path::Path::new(&local), &remote)
    })
    .await
    .map_err(|error| error.to_string())?
}

/// Folder holding the Bloodborne saves on the console (or `/`).
#[tauri::command]
pub(crate) async fn ps4_ftp_find_saves(host: String, port: u16) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        data_handling::ps4_ftp::find_save_folders(&host, port)
    })
    .await
    .map_err(|error| error.to_string())?
}

/// Sends a local Bloodborne save into a console folder. The file must parse
/// as a save before anything is written on the console.
#[tauri::command]
pub(crate) async fn ps4_ftp_import(
    host: String,
    port: u16,
    local: String,
    dir: String,
    name: Option<String>,
    handle: tauri::AppHandle,
) -> Result<String, String> {
    let cache = handle
        .path()
        .app_cache_dir()
        .map_err(|error| error.to_string())?;
    let resource_path = handle
        .path()
        .resolve("resources/", BaseDirectory::Resource)
        .map_err(|error| format!("Application resources are unavailable: {error}"))?;
    tauri::async_runtime::spawn_blocking(move || {
        let target = name.clone().unwrap_or_else(|| {
            std::path::Path::new(&local)
                .file_name()
                .map(|name| name.to_string_lossy().to_string())
                .unwrap_or_default()
        });
        if !data_handling::ps4_ftp::is_save_name(&target) {
            return Err("FTP_NOT_A_SAVE".to_string());
        }
        SaveData::inspect(&local, resource_path).map_err(|_| "FTP_INVALID_SAVE".to_string())?;
        data_handling::ps4_ftp::import(
            &cache,
            &host,
            port,
            std::path::Path::new(&local),
            &dir,
            Some(&target),
        )
    })
    .await
    .map_err(|error| error.to_string())?
}

/// Deletes a console save; a local copy is kept first and its path returned.
#[tauri::command]
pub(crate) async fn ps4_ftp_delete(
    host: String,
    port: u16,
    remote: String,
    handle: tauri::AppHandle,
) -> Result<String, String> {
    let cache = handle
        .path()
        .app_cache_dir()
        .map_err(|error| error.to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        data_handling::ps4_ftp::delete(&cache, &host, port, &remote)
            .map(|path| path.to_string_lossy().to_string())
    })
    .await
    .map_err(|error| error.to_string())?
}
