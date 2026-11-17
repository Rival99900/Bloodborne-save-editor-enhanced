//! Inventory and Storage: items, equipment, levels, bulk actions and capacity.

use crate::data_handling::enums::{ArticleType, Location, SlotShape, UpgradeType};
use crate::MutexSave;
use serde::Serialize;
use serde_json::{json, Value};

#[derive(Serialize)]
pub(crate) struct CapacitySummary {
    inventory_free: usize,
    storage_free: usize,
    gems_free: usize,
    runes_free: usize,
    shared_upgrade_pool: bool,
}

#[tauri::command]
pub(crate) fn edit_quantity(
    number: u8,
    id: u32,
    value: u32,
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
        .ok_or_else(|| "Open a decrypted save before editing an item.".to_string())?;

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
pub(crate) fn transform_item(
    index: usize,
    id: u32,
    new_id: u32,
    article_type: ArticleType,
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
        .ok_or_else(|| "Open a decrypted save before replacing an item.".to_string())?;
    let (file, articles) = if is_storage {
        (&mut save.file, &mut save.storage.articles)
    } else {
        (&mut save.file, &mut save.inventory.articles)
    };

    let (old_type, new_type, mut moved_item) = {
        let category = articles
            .get_mut(&article_type)
            .ok_or_else(|| "The selected item category could not be found.".to_string())?;
        let item = category
            .iter_mut()
            .find(|item| item.id == id && item.index == index)
            .ok_or_else(|| "The selected item could not be found.".to_string())?;
        let old_type = item.article_type;
        item.transform(file, new_id, is_storage)
            .map_err(|error| error.to_string())?;
        (old_type, item.article_type, item.clone())
    };

    if new_type != old_type {
        if let Some(old_category) = articles.get_mut(&old_type) {
            old_category.retain(|item| item.index != index);
            for (new_index, item) in old_category.iter_mut().enumerate() {
                item.index = new_index;
            }
        }

        let new_category = articles.entry(new_type).or_default();
        moved_item.index = new_category.len();
        new_category.push(moved_item);
    }

    serde_json::to_value(&save).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn get_direct_upgrade_capacity(
    state_save: tauri::State<MutexSave>,
) -> Result<bool, String> {
    let save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "The save data is temporarily unavailable.".to_string())?;
    let save = save_option
        .as_ref()
        .ok_or_else(|| "Open a decrypted save before checking Gem/Rune capacity.".to_string())?;

    Ok(save.can_add_upgrade())
}

#[tauri::command]
pub(crate) fn get_capacity_summary(
    state_save: tauri::State<MutexSave>,
) -> Result<CapacitySummary, String> {
    let save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "The save data is temporarily unavailable.".to_string())?;
    let save = save_option
        .as_ref()
        .ok_or_else(|| "Open a decrypted save before checking capacity.".to_string())?;
    let shared_upgrade_records = save.addable_upgrade_count();

    Ok(CapacitySummary {
        inventory_free: save.file.count_inv_empty_slots(Location::Inventory),
        storage_free: save.file.count_inv_empty_slots(Location::Storage),
        gems_free: shared_upgrade_records,
        runes_free: shared_upgrade_records,
        shared_upgrade_pool: true,
    })
}

#[tauri::command]
pub(crate) fn add_direct_upgrade(
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

/// Bulk actions: opens every closed Gem slot of the weapons (one undo step).
#[tauri::command]
pub(crate) fn open_all_weapon_slots(
    is_storage: bool,
    shape: SlotShape,
    count: Option<usize>,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    let mut candidate = save.clone();
    let (weapons, slots) = candidate
        .open_all_weapon_slots(
            is_storage,
            shape,
            count.unwrap_or(crate::data_handling::save::WEAPON_GEM_SLOTS),
        )
        .map_err(|error| error.to_string())?;
    let value = json!({
        "save": serde_json::to_value(&candidate).map_err(|error| error.to_string())?,
        "weapons": weapons,
        "slots": slots,
    });
    *save = candidate;
    Ok(value)
}

/// Bulk actions: Blood Vials and Quicksilver Bullets to the game limits.
#[tauri::command]
pub(crate) fn refill_vials_and_bullets(
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    let mut candidate = save.clone();
    let changed = candidate
        .refill_vials_and_bullets(is_storage)
        .map_err(|error| error.to_string())?;
    let value = json!({
        "save": serde_json::to_value(&candidate).map_err(|error| error.to_string())?,
        "changed": changed,
    });
    *save = candidate;
    Ok(value)
}

/// Bulk actions: infinite carried Blood Vials and Quicksilver Bullets on/off.
#[tauri::command]
pub(crate) fn set_infinite_consumables(
    enable: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    let mut candidate = save.clone();
    let changed = candidate
        .set_infinite_consumables(enable)
        .map_err(|error| error.to_string())?;
    let value = json!({
        "save": serde_json::to_value(&candidate).map_err(|error| error.to_string())?,
        "changed": changed,
    });
    *save = candidate;
    Ok(value)
}

#[tauri::command]
pub(crate) fn upgrade_all_weapons(
    is_storage: bool,
    level: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    // All or nothing, like move_upgrades.
    let mut candidate = save.clone();
    let (upgraded, skipped) = candidate
        .upgrade_all_weapons(is_storage, level)
        .map_err(|error| error.to_string())?;
    let result = json!({
        "save": serde_json::to_value(&candidate).map_err(|error| error.to_string())?,
        "upgraded": upgraded,
        "skipped": skipped,
    });
    *save = candidate;
    Ok(result)
}

#[tauri::command]
pub(crate) fn move_upgrades(
    upgrade_type: UpgradeType,
    indices: Vec<usize>,
    is_storage: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    // All or nothing: the moves run on a copy that replaces the save on success.
    let mut candidate = save.clone();
    let from = if is_storage {
        Location::Storage
    } else {
        Location::Inventory
    };
    let moved = candidate
        .move_upgrades(upgrade_type, indices, from)
        .map_err(|error| error.to_string())?;
    let result = json!({
        "save": serde_json::to_value(&candidate).map_err(|error| error.to_string())?,
        "moved": moved,
    });
    *save = candidate;
    Ok(result)
}

#[tauri::command]
pub(crate) fn add_direct_equipment(
    id: u32,
    is_armor: bool,
    is_storage: bool,
    experimental_confirmed: bool,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    if !experimental_confirmed {
        return Err("EXPERIMENTAL_CONFIRMATION_REQUIRED".to_string());
    }
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    let mut candidate = save.clone();
    let article = candidate
        .add_experimental_equipment(
            id,
            is_armor,
            if is_storage {
                Location::Storage
            } else {
                Location::Inventory
            },
        )
        .map_err(|error| error.to_string())?;
    let result = json!({
        "save": serde_json::to_value(&candidate).map_err(|error| error.to_string())?,
        "article": article,
    });
    *save = candidate;
    Ok(result)
}

/// Adds several weapons or armor pieces in one go (Tools → Trophies): one
/// lock, one clone and one save sent back instead of one per item. All or
/// nothing: the save is unchanged if one addition is refused.
#[tauri::command]
pub(crate) async fn add_equipment_batch(
    ids: Vec<u32>,
    is_armor: bool,
    is_storage: bool,
    state_save: tauri::State<'_, MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    let mut candidate = save.clone();
    let location = if is_storage {
        Location::Storage
    } else {
        Location::Inventory
    };
    for id in ids {
        candidate
            .add_experimental_equipment(id, is_armor, location)
            .map_err(|error| error.to_string())?;
    }
    let value = serde_json::to_value(&candidate).map_err(|error| error.to_string())?;
    *save = candidate;
    Ok(value)
}

/// Adds several items (quantity each) in one go; all or nothing.
#[tauri::command]
pub(crate) async fn add_items_batch(
    ids: Vec<u32>,
    quantity: u32,
    is_storage: bool,
    state_save: tauri::State<'_, MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    let mut candidate = save.clone();
    for id in ids {
        let container = if is_storage {
            &mut candidate.storage
        } else {
            &mut candidate.inventory
        };
        container
            .add_item(&mut candidate.file, id, quantity, is_storage)
            .map_err(|error| error.to_string())?;
    }
    let value = serde_json::to_value(&candidate).map_err(|error| error.to_string())?;
    *save = candidate;
    Ok(value)
}

#[tauri::command]
pub(crate) fn add_item(
    id: u32,
    quantity: u32,
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
        .ok_or_else(|| "Open a decrypted save before adding an item.".to_string())?;

    if !is_storage {
        match save
            .inventory
            .add_item(&mut save.file, id, quantity, is_storage)
        {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(error) => Err(error.to_string()),
        }
    } else {
        match save
            .storage
            .add_item(&mut save.file, id, quantity, is_storage)
        {
            Ok(_) => Ok(serde_json::to_value(&save).map_err(|x| x.to_string())?),
            Err(error) => Err(error.to_string()),
        }
    }
}

#[tauri::command]
pub(crate) fn change_weapon_level(
    article_type: ArticleType,
    article_index: usize,
    slot_index: usize,
    is_storage: bool,
    level: u8,
    state_save: tauri::State<MutexSave>,
) -> Result<Value, String> {
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "Open a decrypted save before changing a weapon level.".to_string())?;

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

/// Imports an Inventory/Storage export (parsed by the UI). All or nothing:
/// the open save only changes if every entry is accepted. Async so the
/// window stays responsive; progress is sent as "import-progress" events.
#[tauri::command]
pub(crate) async fn import_container(
    data: crate::data_handling::transfer::ContainerImport,
    is_storage: bool,
    app: tauri::AppHandle,
    state_save: tauri::State<'_, MutexSave>,
) -> Result<Value, String> {
    use tauri::Emitter;
    let mut save_option = state_save
        .inner()
        .data
        .lock()
        .map_err(|_| "SAVE_UNAVAILABLE".to_string())?;
    let save = save_option
        .as_mut()
        .ok_or_else(|| "SAVE_REQUIRED".to_string())?;
    let mut candidate = save.clone();
    let mut last = 0;
    let report = candidate
        .import_container_with_progress(&data, is_storage, &mut |done, total| {
            // About 100 events at most, plus the last one.
            if done == total || done * 100 / total.max(1) != last {
                last = done * 100 / total.max(1);
                let _ = app.emit("import-progress", json!({ "done": done, "total": total }));
            }
        })
        .map_err(|error| error.to_string())?;
    let value = serde_json::to_value(&candidate).map_err(|error| error.to_string())?;
    *save = candidate;
    Ok(json!({ "save": value, "report": report }))
}
