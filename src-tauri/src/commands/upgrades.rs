//! Gems and Runes: effects, shapes, slots and conversion.

use crate::data_handling::{
    enums::{ArticleType, Location, SlotShape, UpgradeType},
    save::SaveData,
};
use crate::{request_field, selected_upgrade_mut, MutexSave};
use serde_json::{json, Value};

#[tauri::command]
pub(crate) fn transform_upgrade(
    upgrade_type: UpgradeType,
    upgrade_index: usize,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
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
pub(crate) fn edit_effect(
    new_effect_id: u32,
    index: usize,
    info: Value,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save: &mut SaveData = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing effects.".to_string())?;
    let effect_catalog: Value = serde_json::from_str(include_str!("../../resources/upgrades.json"))
        .map_err(|_| "Unable to read the embedded effect catalog.".to_string())?;
    let effect_id = new_effect_id.to_string();
    let is_gem: bool = request_field(&info, "isGem")?;
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

    let is_storage: bool = request_field(&info, "isStorage")?;
    let (file, inventory) = if is_storage {
        (&mut save.file, &mut save.storage)
    } else {
        (&mut save.file, &mut save.inventory)
    };
    let upgrade = selected_upgrade_mut(inventory, &info)?;
    upgrade
        .change_effect(file, new_effect_id, index)
        .map_err(|error| error.to_string())?;

    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn edit_shape(
    new_shape: String,
    info: Value,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing an upgrade shape.".to_string())?;
    let is_storage: bool = request_field(&info, "isStorage")?;
    let (file, inventory) = if is_storage {
        (&mut save.file, &mut save.storage)
    } else {
        (&mut save.file, &mut save.inventory)
    };
    let upgrade = selected_upgrade_mut(inventory, &info)?;
    upgrade
        .change_shape(file, new_shape)
        .map_err(|error| error.to_string())?;

    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn edit_slot(
    is_storage: bool,
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    new_shape: SlotShape,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before editing a gem slot.".to_string())?;
    let (file, inventory) = if is_storage {
        (&mut save.file, &mut save.storage)
    } else {
        (&mut save.file, &mut save.inventory)
    };
    let article = inventory
        .articles
        .get_mut(&article_type)
        .and_then(|articles| articles.get_mut(article_index))
        .ok_or_else(|| "The selected equipment could not be found.".to_string())?;
    article
        .change_slot_shape(file, slot_index, new_shape)
        .map_err(|error| error.to_string())?;

    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn equip_gem(
    upgrade_index: usize,
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before equipping a gem.".to_string())?;

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
pub(crate) fn unequip_gem(
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before unequipping a gem.".to_string())?;

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
