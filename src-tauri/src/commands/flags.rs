//! Flags page: event flags, masks and the Isz glitch.

use crate::data_handling::bosses;
use crate::MutexSave;
use serde_json::{json, Value};

#[tauri::command]
pub(crate) fn set_flag(
    offset: usize,
    new_value: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before applying a flag.".to_string())?;

    save.file
        .set_flag(offset, new_value)
        .map_err(|error| error.to_string())?;
    save.bosses = bosses::new(&save.file).map_err(|error| error.to_string())?;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn apply_mask(
    offset: usize,
    mask: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before applying a flag.".to_string())?;

    save.file
        .apply_mask(offset, mask)
        .map_err(|error| error.to_string())?;
    save.bosses = bosses::new(&save.file).map_err(|error| error.to_string())?;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn apply_mask_or(
    offset: usize,
    mask: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before applying a flag.".to_string())?;

    save.file
        .apply_mask_or(offset, mask)
        .map_err(|error| error.to_string())?;
    save.bosses = bosses::new(&save.file).map_err(|error| error.to_string())?;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn get_isz(state_save: tauri::State<MutexSave>) -> Result<[u8; 2], String> {
    let save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_ref()
        .ok_or_else(|| "Open a decrypted save before reading the Isz state.".to_string())?;

    Ok(save.file.get_isz())
}

#[tauri::command]
pub(crate) fn fix_isz(state_save: tauri::State<MutexSave>) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before fixing the Isz state.".to_string())?;

    let before = save.file.get_isz();
    let message = save.file.fix_isz();
    let changed = before != save.file.get_isz();
    Ok(json!({
        "save": serde_json::to_value(&save).map_err(|error| error.to_string())?,
        "changed": changed,
        "message": message,
    }))
}
