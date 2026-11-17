//! Opening and saving a save, catalogues and version.

use crate::data_handling::{self, save::SaveData};
use crate::{format_load_error, MutexSave};
use serde_json::Value;
use std::sync::Mutex;
use tauri::{path::BaseDirectory, Manager};

#[tauri::command]
pub(crate) fn make_save(
    path: &str,
    patch_session: tauri::State<Mutex<data_handling::patch_session::PatchSession>>,
    state_save: tauri::State<MutexSave>,
    handle: tauri::AppHandle,
) -> Result<Value, String> {
    let resource_path = handle
        .path()
        .resolve("resources/", BaseDirectory::Resource)
        .map_err(|error| format!("Application resources are unavailable: {error}"))?;

    // Parse and serialize first. The active save remains untouched if the new
    // file is invalid, incomplete, or cannot be represented for the frontend.
    let loaded_save = SaveData::build(path, resource_path).map_err(format_load_error)?;
    let response = serde_json::to_value(&loaded_save).map_err(|error| error.to_string())?;

    let mut history = state_save
        .history
        .lock()
        .map_err(|_| "Revision history is unavailable.".to_string())?;
    let mut data = state_save
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    patch_session
        .lock()
        .map_err(|_| "patchErrors.stale")?
        .invalidate();
    *data = Some(loaded_save);
    history.past.clear();
    history.future.clear();
    Ok(response)
}

#[tauri::command]
pub(crate) fn save(path: String, state_save: tauri::State<MutexSave>) -> Result<String, String> {
    if path.trim().is_empty() {
        return Err("Choose a destination before saving changes.".to_string());
    }

    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "The save data is temporarily unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before saving changes.".to_string())?;

    save.validate_game_load_safety()
        .map_err(|error| error.to_string())?;

    save.file
        .save(&path)
        .map(|_| "Changes saved successfully.".to_string())
        .map_err(|_| {
            "Failed to save changes. Check the destination and its permissions.".to_string()
        })
}

#[tauri::command]
pub(crate) fn return_weapons() -> Value {
    let weapons_str = include_str!("../../resources/weapons.json");

    let weapons: Value = serde_json::from_str(weapons_str).unwrap();

    weapons
}

#[tauri::command]
pub(crate) fn return_armors() -> Value {
    let armors_str = include_str!("../../resources/armors.json");

    let armors: Value = serde_json::from_str(armors_str).unwrap();

    armors
}

#[tauri::command]
pub(crate) fn return_items() -> Value {
    let upgrades_str = include_str!("../../resources/items.json");

    let items: Value = serde_json::from_str(upgrades_str).unwrap();

    items
}

#[tauri::command]
pub(crate) fn return_gem_effects() -> Value {
    let upgrades_str = include_str!("../../resources/upgrades.json");

    let upgrade_json: Value = serde_json::from_str(upgrades_str).unwrap();

    upgrade_json["gemEffects"].clone()
}

#[tauri::command]
pub(crate) fn return_rune_effects() -> Value {
    let upgrades_str = include_str!("../../resources/upgrades.json");

    let upgrade_json: Value = serde_json::from_str(upgrades_str).unwrap();

    upgrade_json["runeEffects"].clone()
}

#[tauri::command]
pub(crate) fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Largest text document the UI may read (exports, presets).
const MAX_TEXT_DOCUMENT: u64 = 16 * 1024 * 1024;

/// Reads a JSON/CSV file chosen in a dialog. Goes through Rust so it also
/// works outside the home folder (another drive on Windows).
#[tauri::command]
pub(crate) fn read_text_document(path: String) -> Result<String, String> {
    let size = std::fs::metadata(&path)
        .map_err(|error| error.to_string())?
        .len();
    if size > MAX_TEXT_DOCUMENT {
        return Err("FILE_TOO_LARGE".to_string());
    }
    std::fs::read_to_string(&path).map_err(|error| error.to_string())
}

/// Writes a JSON/CSV export to a path chosen in a save dialog.
#[tauri::command]
pub(crate) fn write_text_document(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|error| error.to_string())
}
