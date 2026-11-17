// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{error::Error, sync::Mutex};
mod commands;
mod data_handling;

use data_handling::{
    enums::{ArticleType, Error as SaveError, UpgradeType},
    inventory::Inventory,
    save::SaveData,
    upgrades::Upgrade,
};
use serde::de::DeserializeOwned;
use serde_json::Value;

pub(crate) const MAX_REVISION_HISTORY: usize = 100;
#[derive(Default)]
pub(crate) struct SaveHistory {
    past: Vec<SaveData>,
    future: Vec<SaveData>,
}

pub(crate) struct MutexSave {
    data: Mutex<Option<SaveData>>,
    history: Mutex<SaveHistory>,
}

pub(crate) fn format_load_error(error: SaveError) -> String {
    format!(
        "Unable to load the selected save: {error} Verify that it is a complete decrypted Bloodborne character save."
    )
}

pub(crate) fn request_field<T: DeserializeOwned>(value: &Value, key: &str) -> Result<T, String> {
    let field = value
        .get(key)
        .ok_or_else(|| format!("The edit request is missing '{key}'."))?;
    serde_json::from_value(field.clone())
        .map_err(|_| format!("The edit request contains an invalid '{key}'."))
}

pub(crate) fn selected_upgrade_mut<'a>(
    inventory: &'a mut Inventory,
    info: &Value,
) -> Result<&'a mut Upgrade, String> {
    if let Some(equipped) = info.get("equipped").filter(|value| !value.is_null()) {
        let article_type: ArticleType = request_field(equipped, "articleType")?;
        let article_index: usize = request_field(equipped, "articleIndex")?;
        let slot_index: usize = request_field(equipped, "slotIndex")?;

        inventory
            .articles
            .get_mut(&article_type)
            .and_then(|articles| articles.get_mut(article_index))
            .and_then(|article| article.slots.as_mut())
            .and_then(|slots| slots.get_mut(slot_index))
            .and_then(|slot| slot.gem.as_mut())
            .ok_or_else(|| "The selected equipped gem could not be found.".to_string())
    } else {
        let upgrade_type: UpgradeType = request_field(info, "upgradeType")?;
        let upgrade_index: usize = request_field(info, "upgradeIndex")?;

        inventory
            .upgrades
            .get_mut(&upgrade_type)
            .and_then(|upgrades| upgrades.get_mut(upgrade_index))
            .ok_or_else(|| "The selected gem or rune could not be found.".to_string())
    }
}

pub(crate) fn begin_revision(state_save: &MutexSave) -> Result<(), String> {
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
        .manage(Mutex::new(
            data_handling::patch_session::PatchSession::default(),
        ))
        // The window starts hidden and is shown once the interface has
        // rendered (commands::window::show_main_window). Minimizing it while
        // WebView2 was still starting closed the editor on Windows.
        .setup(|app| {
            commands::window::show_later(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::window::show_main_window,
            commands::patches::bloodborne_patch_catalog,
            commands::patches::preview_bloodborne_patches,
            commands::patches::apply_bloodborne_patches,
            commands::file::make_save,
            commands::file::read_text_document,
            commands::file::write_text_document,
            commands::inventory::edit_quantity,
            commands::file::save,
            commands::file::return_weapons,
            commands::file::return_armors,
            commands::file::return_items,
            commands::file::return_gem_effects,
            commands::file::return_rune_effects,
            commands::inventory::transform_item,
            commands::upgrades::transform_upgrade,
            commands::character::edit_stat,
            commands::upgrades::edit_effect,
            commands::upgrades::edit_shape,
            commands::upgrades::equip_gem,
            commands::upgrades::unequip_gem,
            commands::character::export_appearance,
            commands::character::import_appearance,
            commands::character::set_username,
            commands::file::get_version,
            commands::inventory::add_item,
            commands::inventory::get_direct_upgrade_capacity,
            commands::inventory::get_capacity_summary,
            commands::inventory::add_direct_upgrade,
            commands::inventory::add_direct_equipment,
            commands::inventory::move_upgrades,
            commands::inventory::upgrade_all_weapons,
            commands::inventory::open_all_weapon_slots,
            commands::inventory::refill_vials_and_bullets,
            commands::inventory::import_container,
            commands::inventory::set_infinite_consumables,
            commands::backups::list_backups,
            commands::backups::restore_backup,
            commands::ftp::ps4_ftp_list,
            commands::ftp::ps4_ftp_download,
            commands::ftp::ps4_ftp_upload,
            commands::ftp::ps4_ftp_find_saves,
            commands::character::get_lamp_flags,
            commands::inventory::add_equipment_batch,
            commands::inventory::add_items_batch,
            commands::character::set_lamp_flags,
            commands::ftp::ps4_ftp_import,
            commands::ftp::ps4_ftp_delete,
            commands::upgrades::edit_slot,
            commands::flags::get_isz,
            commands::flags::fix_isz,
            commands::character::get_playtime,
            commands::character::set_playtime,
            commands::flags::set_flag,
            commands::character::edit_coordinates,
            commands::character::teleport,
            commands::inventory::change_weapon_level,
            commands::flags::apply_mask,
            commands::flags::apply_mask_or,
            commands::revisions::start_revision,
            commands::revisions::discard_revision,
            commands::revisions::undo_revision,
            commands::revisions::redo_revision,
            commands::tools::compare_npc_flag_regions,
            commands::tools::inspect_save,
        ])
        .run(tauri::generate_context!())?;

    Ok(())
}
