//! Bloodborne save patches (Apollo catalogue).

use crate::data_handling::{self, save::SaveData};
use crate::MutexSave;
use std::sync::Mutex;

#[tauri::command]
pub(crate) fn bloodborne_patch_catalog(
    title_id: &str,
) -> Result<data_handling::patches::Catalog, String> {
    data_handling::patches::catalog(title_id)
}

#[tauri::command]
pub(crate) fn preview_bloodborne_patches(
    title_id: &str,
    game_version: &str,
    ids: Vec<String>,
    state_save: tauri::State<MutexSave>,
    patch_session: tauri::State<Mutex<data_handling::patch_session::PatchSession>>,
) -> Result<data_handling::patch_session::Review, String> {
    let data = state_save.data.lock().map_err(|_| "patchErrors.stale")?;
    let save = data.as_ref().ok_or("patchErrors.save")?;
    let mut session = patch_session.lock().map_err(|_| "patchErrors.stale")?;
    session.preview(save, title_id, game_version, &ids)
}

#[tauri::command]
pub(crate) fn apply_bloodborne_patches(
    token: &str,
    acknowledged: bool,
    state_save: tauri::State<MutexSave>,
    patch_session: tauri::State<Mutex<data_handling::patch_session::PatchSession>>,
) -> Result<SaveData, String> {
    let mut data = state_save.data.lock().map_err(|_| "patchErrors.stale")?;
    let save = data.as_mut().ok_or("patchErrors.save")?;
    let mut session = patch_session.lock().map_err(|_| "patchErrors.stale")?;
    session.apply(save, token, acknowledged)
}
