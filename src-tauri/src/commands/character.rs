//! Character page: stats, name, playtime, position, appearance and lamps.

use crate::data_handling::{self, appearance, position::Pos, save::SaveData, stats};
use crate::MutexSave;
use serde_json::Value;

/// Lit state of the 44 headstone lamps, in `resources/lamps.json` order.
#[tauri::command]
pub(crate) fn get_lamp_flags(state_save: tauri::State<MutexSave>) -> Result<Vec<bool>, String> {
    let save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_ref()
        .ok_or_else(|| "Open a decrypted save first.".to_string())?;
    data_handling::lamps::states(&save.file).map_err(|error| error.to_string())
}

/// Lights or puts out lamps (Character → Confirm). Nothing is written if one
/// change is invalid.
#[tauri::command]
pub(crate) fn set_lamp_flags(
    changes: Vec<data_handling::lamps::LampChange>,
    state_save: tauri::State<MutexSave>,
) -> Result<Vec<bool>, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save first.".to_string())?;
    data_handling::lamps::apply(&mut save.file, &changes).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn get_playtime(state_save: tauri::State<MutexSave>) -> Result<u32, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before reading playtime.".to_string())?;

    save.file.get_playtime().map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn set_playtime(
    new_playtime: [u8; 4],
    state_save: tauri::State<MutexSave>,
) -> Result<(), String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing playtime.".to_string())?;

    save.file.set_playtime(new_playtime);
    save.playtime = save
        .file
        .get_playtime()
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub(crate) fn edit_stat(
    rel_offset: isize,
    length: usize,
    times: usize,
    value: u32,
    state_save: tauri::State<MutexSave>,
) -> Result<(), String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing statistics.".to_string())?;
    let stat = save
        .stats
        .iter_mut()
        .find(|stat| stat.rel_offset == rel_offset && stat.length == length && stat.times == times)
        .ok_or_else(|| "The requested statistic is not part of this save.".to_string())?;

    stat.edit(value, &mut save.file);
    Ok(())
}

#[tauri::command]
pub(crate) fn export_appearance(
    path: &str,
    state_save: tauri::State<MutexSave>,
) -> Result<String, String> {
    let save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_ref()
        .ok_or_else(|| "Open a decrypted save before exporting appearance data.".to_string())?;

    match appearance::export(&save.file, path) {
        Ok(_) => Ok("Successfully exported".to_string()),
        Err(_) => Err("There was an error exporting the face".to_string()),
    }
}

#[tauri::command]
pub(crate) fn import_appearance(
    path: &str,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save: &mut SaveData = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before importing appearance data.".to_string())?;

    // Face data must be isolated from character statistics. Preserve the raw file
    // transactionally and verify the derived numeric values before accepting it.
    // This prevents a malformed or incompatible face payload from baking a Caryll
    // Rune's HP/Stamina bonus into the base character values.
    let original_file = save.file.clone();
    let stats_before = stats::new(&save.file).map_err(|_| {
        "Unable to verify character statistics before importing face data.".to_string()
    })?;

    appearance::import(&mut save.file, path)
        .map_err(|_| "The imported file is not a face".to_string())?;

    let stats_after = match stats::new(&save.file) {
        Ok(stats) => stats,
        Err(_) => {
            save.file = original_file;
            return Err(
                "Face import was cancelled because character statistics could not be verified."
                    .to_string(),
            );
        }
    };
    if stats_after != stats_before {
        save.file = original_file;
        return Err(
            "Face import was cancelled because it would change Max HP, Stamina, or another character statistic."
                .to_string(),
        );
    }

    // Keep the serialized snapshot synchronized with the bytes just verified.
    save.stats = stats_after;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn set_username(
    new_username: String,
    state_save: tauri::State<MutexSave>,
) -> Result<String, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before changing the hunter name.".to_string())?;

    match save.username.set(&mut save.file, new_username) {
        Ok(_) => Ok("Successfully changed name".to_string()),
        Err(_) => Err("Failed to change name".to_string()),
    }
}

#[tauri::command]
pub(crate) fn edit_coordinates(
    x: f32,
    y: f32,
    z: f32,
    state_save: tauri::State<MutexSave>,
) -> Result<(), String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing coordinates.".to_string())?;

    save.position.coordinates.edit(&mut save.file, x, y, z);
    save.position = Pos::new(&save.file).map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub(crate) fn teleport(
    x: f32,
    y: f32,
    z: f32,
    map_id: Vec<u8>,
    state_save: tauri::State<MutexSave>,
) -> Result<(), String> {
    if map_id.len() < 2 {
        return Err("The selected destination has an invalid map identifier.".to_string());
    }
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save: &mut SaveData = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before teleporting.".to_string())?;
    let le_map = [0, 0, map_id[1], map_id[0]];
    for (i, j) in (0x04..0x08).enumerate() {
        save.file.bytes[j] = le_map[i];
    }
    save.position.coordinates.edit(&mut save.file, x, y, z);
    save.position = Pos::new(&save.file).map_err(|error| error.to_string())?;
    Ok(())
}
