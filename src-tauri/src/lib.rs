// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{error::Error, sync::Mutex};
mod data_handling;

use data_handling::{
    appearance,
    article::Article,
    bosses,
    enums::{ArticleType, Error as SaveError, Location, SlotShape, UpgradeType},
    position::Pos,
    save::SaveData,
    upgrades::Upgrade,
};
use serde_json::{json, Value};
use tauri::{path::BaseDirectory, Manager};
const MAX_REVISION_HISTORY: usize = 100;

#[derive(Default)]
struct SaveHistory {
    past: Vec<SaveData>,
    future: Vec<SaveData>,
}

struct MutexSave {
    data: Mutex<Option<SaveData>>,
    history: Mutex<SaveHistory>,
}

fn format_load_error(error: SaveError) -> String {
    format!(
        "Unable to load the selected save: {error} Verify that it is a complete decrypted Bloodborne character save."
    )
}

fn begin_revision(state_save: &MutexSave) -> Result<(), String> {
    // Always acquire the history lock first. Undo/redo use the same order, keeping the
    // in-memory transaction state free of lock-order inversions.
    let mut history = state_save
        .history
        .lock()
        .map_err(|_| "Revision history is unavailable.".to_string())?;
    let data = state_save
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let snapshot = data
        .as_ref()
        .cloned()
        .ok_or_else(|| "Open a decrypted save before creating a revision.".to_string())?;

    history.past.push(snapshot);
    if history.past.len() > MAX_REVISION_HISTORY {
        history.past.remove(0);
    }
    history.future.clear();
    Ok(())
}

#[tauri::command]
fn start_revision(state_save: tauri::State<MutexSave>) -> Result<(), String> {
    begin_revision(state_save.inner())
}

#[tauri::command]
fn discard_revision(state_save: tauri::State<MutexSave>) {
    // A failed multi-step mutation may already have changed bytes. Restore the snapshot
    // captured by start_revision so a failed operation is atomic from the user’s view.
    if let (Ok(mut history), Ok(mut data)) = (state_save.history.lock(), state_save.data.lock()) {
        if let Some(snapshot) = history.past.pop() {
            *data = Some(snapshot);
        }
    }
}

fn undo_revision_inner(state_save: &MutexSave) -> Result<SaveData, String> {
    let mut history = state_save
        .history
        .lock()
        .map_err(|_| "Revision history is unavailable.".to_string())?;
    let mut data = state_save
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let previous = history
        .past
        .pop()
        .ok_or_else(|| "There is no change to undo.".to_string())?;
    let current = data
        .as_ref()
        .cloned()
        .ok_or_else(|| "Open a decrypted save before undoing a change.".to_string())?;

    history.future.push(current);
    if history.future.len() > MAX_REVISION_HISTORY {
        history.future.remove(0);
    }
    *data = Some(previous.clone());
    Ok(previous)
}

fn redo_revision_inner(state_save: &MutexSave) -> Result<SaveData, String> {
    let mut history = state_save
        .history
        .lock()
        .map_err(|_| "Revision history is unavailable.".to_string())?;
    let mut data = state_save
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let next = history
        .future
        .pop()
        .ok_or_else(|| "There is no change to redo.".to_string())?;
    let current = data
        .as_ref()
        .cloned()
        .ok_or_else(|| "Open a decrypted save before redoing a change.".to_string())?;

    history.past.push(current);
    if history.past.len() > MAX_REVISION_HISTORY {
        history.past.remove(0);
    }
    *data = Some(next.clone());
    Ok(next)
}

#[tauri::command]
fn undo_revision(state_save: tauri::State<MutexSave>) -> Result<Value, String> {
    serde_json::to_value(undo_revision_inner(state_save.inner())?)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn redo_revision(state_save: tauri::State<MutexSave>) -> Result<Value, String> {
    serde_json::to_value(redo_revision_inner(state_save.inner())?)
        .map_err(|error| error.to_string())
}

pub fn run() -> Result<(), Box<dyn Error>> {
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        if std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err() {
            std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(MutexSave {
            data: Mutex::new(None),
            history: Mutex::new(SaveHistory::default()),
        })
        .invoke_handler(tauri::generate_handler![
            make_save,
            edit_quantity,
            save,
            return_weapons,
            return_armors,
            return_items,
            return_gem_effects,
            return_rune_effects,
            transform_item,
            transform_upgrade,
            edit_stat,
            edit_effect,
            edit_shape,
            equip_gem,
            unequip_gem,
            export_appearance,
            import_appearance,
            set_username,
            get_version,
            add_item,
            add_direct_upgrade,
            add_direct_equipment,
            edit_slot,
            get_isz,
            fix_isz,
            get_playtime,
            set_playtime,
            set_flag,
            edit_coordinates,
            teleport,
            change_weapon_level,
            apply_mask,
            start_revision,
            discard_revision,
            undo_revision,
            redo_revision
        ])
        .run(tauri::generate_context!())?;

    Ok(())
}

#[tauri::command]
fn set_flag(
    offset: usize,
    new_value: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before applying a flag.".to_string())?;

    save.file.set_flag(offset, new_value);
    save.bosses = bosses::new(&save.file).map_err(|error| error.to_string())?;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
fn apply_mask(
    offset: usize,
    mask: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before applying a flag.".to_string())?;

    save.file.apply_mask(offset, mask);
    save.bosses = bosses::new(&save.file).map_err(|error| error.to_string())?;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
fn get_isz(state_save: tauri::State<MutexSave>) -> [u8; 2] {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    save.file.get_isz()
}

#[tauri::command]
fn fix_isz(state_save: tauri::State<MutexSave>) -> Result<Value, String> {
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

#[tauri::command]
fn get_playtime(state_save: tauri::State<MutexSave>) -> Result<u32, String> {
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
fn set_playtime(new_playtime: [u8; 4], state_save: tauri::State<MutexSave>) -> Result<(), String> {
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
fn make_save(
    path: &str,
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
    *data = Some(loaded_save);
    history.past.clear();
    history.future.clear();
    Ok(response)
}

#[tauri::command]
fn edit_quantity(
    number: u8,
    id: u32,
    value: u32,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    if !is_storage {
        match save
            .inventory
            .edit_item(&mut save.file, number, id, value, is_storage)
        {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(e) => Err(e.to_string()),
        }
    } else {
        match save
            .storage
            .edit_item(&mut save.file, number, id, value, is_storage)
        {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(e) => Err(e.to_string()),
        }
    }
}

#[tauri::command]
fn save(path: String, state_save: tauri::State<MutexSave>) -> Result<String, String> {
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
fn return_weapons() -> Value {
    let weapons_str = include_str!("../resources/weapons.json");

    let weapons: Value = serde_json::from_str(weapons_str).unwrap();

    weapons
}

#[tauri::command]
fn return_armors() -> Value {
    let armors_str = include_str!("../resources/armors.json");

    let armors: Value = serde_json::from_str(armors_str).unwrap();

    armors
}

#[tauri::command]
fn return_items() -> Value {
    let upgrades_str = include_str!("../resources/items.json");

    let items: Value = serde_json::from_str(upgrades_str).unwrap();

    items
}

#[tauri::command]
fn return_gem_effects() -> Value {
    let upgrades_str = include_str!("../resources/upgrades.json");

    let upgrade_json: Value = serde_json::from_str(upgrades_str).unwrap();

    upgrade_json["gemEffects"].clone()
}

#[tauri::command]
fn return_rune_effects() -> Value {
    let upgrades_str = include_str!("../resources/upgrades.json");

    let upgrade_json: Value = serde_json::from_str(upgrades_str).unwrap();

    upgrade_json["runeEffects"].clone()
}

#[tauri::command]
fn transform_item(
    index: usize,
    id: u32,
    new_id: u32,
    article_type: ArticleType,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    let category = {
        if !is_storage {
            save.inventory.articles.get_mut(&article_type).unwrap()
        } else {
            save.storage.articles.get_mut(&article_type).unwrap()
        }
    };
    let item = category
        .iter_mut()
        .find(|x| x.id == id && x.index == index)
        .unwrap();

    let old_type = item.article_type;

    match item.transform(&mut save.file, new_id, is_storage) {
        Ok(_) => {
            // Check if the article type has changed
            if item.article_type != old_type {
                let moved_item = item.clone();

                // Remove the item from the old category
                if let Some(old_category) = save.inventory.articles.get_mut(&old_type) {
                    old_category.retain(|x| x.index != index);
                }

                // Find or create the new category using item.article_type
                let new_category = save
                    .inventory
                    .articles
                    .entry(moved_item.article_type)
                    .or_default();

                // Add the item to the new category
                new_category.push(moved_item);
            }

            Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn transform_upgrade(
    upgrade_type: UpgradeType,
    upgrade_index: usize,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before transforming an upgrade.".to_string())?;
    let location = if is_storage {
        Location::Storage
    } else {
        Location::Inventory
    };

    let upgrade = save
        .transform_upgrade(upgrade_type, upgrade_index, location)
        .map_err(|error| error.to_string())?;

    Ok(json!({
        "save": serde_json::to_value(&save).map_err(|error| error.to_string())?,
        "upgrade": upgrade,
    }))
}

#[tauri::command]
fn edit_stat(
    rel_offset: isize,
    length: usize,
    times: usize,
    value: u32,
    state_save: tauri::State<MutexSave>,
) -> Result<(), String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
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
fn edit_effect(
    new_effect_id: u32,
    index: usize,
    info: Value,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save: &mut SaveData = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing effects.".to_string())?;
    let effect_catalog: Value = serde_json::from_str(include_str!("../resources/upgrades.json"))
        .map_err(|_| "Unable to read the embedded effect catalog.".to_string())?;
    let effect_id = new_effect_id.to_string();
    let is_gem: bool = serde_json::from_value(info["isGem"].clone())
        .map_err(|_| "The upgrade type is missing from this edit request.".to_string())?;
    let catalog_name = if is_gem { "gemEffects" } else { "runeEffects" };
    let fallback_catalog_name = if is_gem { "runeEffects" } else { "gemEffects" };
    // Existing saves can legitimately contain an effect from the other catalogue.
    // Keep the editor capable of preserving and editing those records; the final
    // save gate instead protects the structural slot invariant that caused this crash.
    let is_known_effect = new_effect_id == u32::MAX
        || effect_catalog[catalog_name].get(&effect_id).is_some()
        || effect_catalog[fallback_catalog_name]
            .get(&effect_id)
            .is_some();

    if !is_known_effect {
        return Err(format!(
            "This effect identifier is not valid for a {}.",
            if is_gem { "gem" } else { "rune" }
        ));
    }

    let upgrade: Option<*mut Upgrade>;

    let location: Location = {
        let is_storage: bool = serde_json::from_value(info["isStorage"].clone()).unwrap();

        if is_storage {
            Location::Storage
        } else {
            Location::Inventory
        }
    };

    if let Some(equipped) = info.get("equipped") {
        let article_type: ArticleType =
            serde_json::from_value(equipped["articleType"].clone()).unwrap();
        let article_index: usize =
            serde_json::from_value(equipped["articleIndex"].clone()).unwrap();
        let slot_index: usize = serde_json::from_value(equipped["slotIndex"].clone()).unwrap();

        upgrade = save
            .get_equipped_upgrade_mut(location, article_type, article_index, slot_index)
            .map(|u| u as *mut _);
    } else {
        let upgrade_type: UpgradeType =
            serde_json::from_value(info["upgradeType"].clone()).unwrap();
        let upgrade_index: usize = serde_json::from_value(info["upgradeIndex"].clone()).unwrap();

        upgrade = save
            .get_upgrade_mut(location, upgrade_type, upgrade_index)
            .map(|u| u as *mut _);
    }

    let upgrade =
        upgrade.ok_or_else(|| "The selected gem or rune could not be found.".to_string())?;

    unsafe {
        match (*upgrade).change_effect(&mut save.file, new_effect_id, index) {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(_) => Err("Failed to edit the upgrade's effect".to_string()),
        }
    }
}

#[tauri::command]
fn edit_shape(
    new_shape: String,
    info: Value,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save: &mut SaveData = save_option.as_mut().unwrap();
    let upgrade: Option<*mut Upgrade>;

    let location: Location = {
        let is_storage: bool = serde_json::from_value(info["isStorage"].clone()).unwrap();

        if is_storage {
            Location::Storage
        } else {
            Location::Inventory
        }
    };

    if let Some(equipped) = info.get("equipped") {
        let article_type: ArticleType =
            serde_json::from_value(equipped["articleType"].clone()).unwrap();
        let article_index: usize =
            serde_json::from_value(equipped["articleIndex"].clone()).unwrap();
        let slot_index: usize = serde_json::from_value(equipped["slotIndex"].clone()).unwrap();

        upgrade = save
            .get_equipped_upgrade_mut(location, article_type, article_index, slot_index)
            .map(|u| u as *mut _);
    } else {
        let upgrade_type: UpgradeType =
            serde_json::from_value(info["upgradeType"].clone()).unwrap();
        let upgrade_index: usize = serde_json::from_value(info["upgradeIndex"].clone()).unwrap();

        upgrade = save
            .get_upgrade_mut(location, upgrade_type, upgrade_index)
            .map(|u| u as *mut _);
    }

    unsafe {
        match (*upgrade.unwrap()).change_shape(&mut save.file, new_shape) {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(_) => Err("Failed to edit the upgrade's shape".to_string()),
        }
    }
}

#[tauri::command]
fn edit_slot(
    is_storage: bool,
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    new_shape: SlotShape,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save: &mut SaveData = save_option.as_mut().unwrap();

    let location = if is_storage {
        Location::Storage
    } else {
        Location::Inventory
    };

    let article: Option<*mut Article> = save
        .get_article_mut(location, article_type, article_index)
        .map(|u| u as *mut _);

    unsafe {
        match (*article.unwrap()).change_slot_shape(&mut save.file, slot_index, new_shape) {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(e) => Err(e.to_string()),
        }
    }
}

#[tauri::command]
fn equip_gem(
    upgrade_index: usize,
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    let result = if is_storage {
        save.storage.equip_gem(
            &mut save.file,
            upgrade_index,
            article_type,
            article_index,
            slot_index,
            is_storage,
        )
    } else {
        save.inventory.equip_gem(
            &mut save.file,
            upgrade_index,
            article_type,
            article_index,
            slot_index,
            is_storage,
        )
    };

    match result {
        Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn unequip_gem(
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    let result = if is_storage {
        save.storage.unequip_gem(
            &mut save.file,
            article_type,
            article_index,
            slot_index,
            is_storage,
        )
    } else {
        save.inventory.unequip_gem(
            &mut save.file,
            article_type,
            article_index,
            slot_index,
            is_storage,
        )
    };

    match result {
        Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn export_appearance(path: &str, state_save: tauri::State<MutexSave>) -> Result<String, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    match appearance::export(&save.file, path) {
        Ok(_) => Ok("Successfully exported".to_string()),
        Err(_) => Err("There was an error exporting the face".to_string()),
    }
}

#[tauri::command]
fn import_appearance(path: &str, state_save: tauri::State<MutexSave>) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save: &mut SaveData = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before importing appearance data.".to_string())?;

    appearance::import(&mut save.file, path)
        .map_err(|_| "The imported file is not a face".to_string())?;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
fn set_username(
    new_username: String,
    state_save: tauri::State<MutexSave>,
) -> Result<String, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    match save.username.set(&mut save.file, new_username) {
        Ok(_) => Ok("Successfully changed name".to_string()),
        Err(_) => Err("Failed to change name".to_string()),
    }
}

#[tauri::command]
fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn add_direct_upgrade(
    upgrade_type: UpgradeType,
    shape: String,
    effect_ids: Vec<u32>,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "The save data is temporarily unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before adding a gem or rune.".to_string())?;
    let location = if is_storage {
        Location::Storage
    } else {
        Location::Inventory
    };
    let upgrade = save
        .add_direct_upgrade(upgrade_type, shape, effect_ids, location)
        .map_err(|error| error.to_string())?;

    Ok(json!({
        "save": serde_json::to_value(&save).map_err(|error| error.to_string())?,
        "upgrade": upgrade,
    }))
}

#[tauri::command]
fn add_direct_equipment(
    id: u32,
    is_armor: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "The save data is temporarily unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before adding equipment.".to_string())?;
    let article = save
        .add_direct_equipment(id, is_armor)
        .map_err(|error| error.to_string())?;

    Ok(json!({
        "save": serde_json::to_value(&save).map_err(|error| error.to_string())?,
        "article": article,
    }))
}

#[tauri::command]
fn add_item(
    id: u32,
    quantity: u32,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option.as_mut().unwrap();

    if !is_storage {
        match save
            .inventory
            .add_item(&mut save.file, id, quantity, is_storage)
        {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(_) => Err("Failed to add the item".to_string()),
        }
    } else {
        match save
            .storage
            .add_item(&mut save.file, id, quantity, is_storage)
        {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(_) => Err("Failed to add the item".to_string()),
        }
    }
}

#[tauri::command]
fn edit_coordinates(
    x: f32,
    y: f32,
    z: f32,
    state_save: tauri::State<MutexSave>,
) -> Result<(), String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing coordinates.".to_string())?;

    save.position.coordinates.edit(&mut save.file, x, y, z);
    save.position = Pos::new(&save.file).map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn teleport(
    x: f32,
    y: f32,
    z: f32,
    map_id: Vec<u8>,
    state_save: tauri::State<MutexSave>,
) -> Result<(), String> {
    if map_id.len() < 2 {
        return Err("The selected destination has an invalid map identifier.".to_string());
    }
    let mut save_option = state_save.inner().data.lock().unwrap();
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

#[tauri::command]
fn change_weapon_level(
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    is_storage: bool,
    level: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save.inner().data.lock().unwrap();
    let save: &mut SaveData = save_option.as_mut().unwrap();

    let result = if is_storage {
        save.storage.change_weapon_level(
            &mut save.file,
            article_type,
            article_index,
            slot_index,
            is_storage,
            level,
        )
    } else {
        save.inventory.change_weapon_level(
            &mut save.file,
            article_type,
            article_index,
            slot_index,
            is_storage,
            level,
        )
    };

    match result {
        Ok(weapon) => Ok(json!({
            "save": serde_json::to_value(&save).map_err(|x| x.to_string())?,
            "weapon": weapon
        })),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(test)]
mod revision_history_tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;

    #[test]
    fn revision_history_restores_and_reapplies_backend_bytes() {
        let original = build_save_data("testsave9");
        let state = MutexSave {
            data: Mutex::new(Some(original.clone())),
            history: Mutex::new(SaveHistory::default()),
        };

        begin_revision(&state).expect("the original save must be captured before mutation");
        let changed = {
            let mut data = state.data.lock().unwrap();
            let save = data.as_mut().unwrap();
            save.file.bytes[0] ^= 0x5A;
            save.clone()
        };

        let undone = undo_revision_inner(&state).expect("the saved snapshot must be restored");
        assert_eq!(undone.file, original.file);

        let redone = redo_revision_inner(&state).expect("the changed snapshot must be reapplied");
        assert_eq!(redone.file, changed.file);
    }
}
