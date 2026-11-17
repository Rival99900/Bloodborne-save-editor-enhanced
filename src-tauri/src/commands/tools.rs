//! Tools page: flag, stats and inventory comparison of two saves.

use crate::{
    data_handling::{self, constants::USERNAME_TO_AOB, save::SaveData},
    format_load_error,
};
use serde::Serialize;
use serde_json::Value;
use std::path::PathBuf;
use tauri::{path::BaseDirectory, Manager};

pub(crate) const NPC_FLAG_COMPARISON_LENGTH: usize = 30_000;
pub(crate) const MAX_NPC_FLAG_DIFFERENCES: usize = 1_024;
#[derive(Serialize, Debug, PartialEq)]
pub(crate) struct FlagDifference {
    pub(crate) rel_offset: usize,
    pub(crate) before_value: u8,
    pub(crate) after_value: u8,
}

pub(crate) fn compare_flag_bytes(
    before: &[u8],
    after: &[u8],
) -> Result<Vec<FlagDifference>, String> {
    if before.len() < NPC_FLAG_COMPARISON_LENGTH || after.len() < NPC_FLAG_COMPARISON_LENGTH {
        return Err("npcErrors.region".to_string());
    }

    let differences: Vec<_> = before[..NPC_FLAG_COMPARISON_LENGTH]
        .iter()
        .zip(&after[..NPC_FLAG_COMPARISON_LENGTH])
        .enumerate()
        .filter_map(|(rel_offset, (&before_value, &after_value))| {
            (before_value != after_value).then_some(FlagDifference {
                rel_offset,
                before_value,
                after_value,
            })
        })
        .collect();

    if differences.len() > MAX_NPC_FLAG_DIFFERENCES {
        return Err("npcErrors.tooDifferent".to_string());
    }

    Ok(differences)
}

#[tauri::command]
pub(crate) async fn compare_npc_flag_regions(
    before_path: String,
    after_path: String,
) -> Result<Vec<FlagDifference>, String> {
    let before = data_handling::file::FileData::build(&before_path, PathBuf::new())
        .map_err(|_| "npcErrors.invalidSave".to_string())?;
    let after = data_handling::file::FileData::build(&after_path, PathBuf::new())
        .map_err(|_| "npcErrors.invalidSave".to_string())?;

    let before_name = before
        .bytes
        .get(before.offsets.username..before.offsets.username.saturating_add(34))
        .ok_or_else(|| "npcErrors.identity".to_string())?;
    let after_name = after
        .bytes
        .get(after.offsets.username..after.offsets.username.saturating_add(34))
        .ok_or_else(|| "npcErrors.identity".to_string())?;
    if before_name != after_name {
        return Err("npcErrors.identity".to_string());
    }

    let before_start = before
        .offsets
        .username
        .checked_add(USERNAME_TO_AOB)
        .ok_or_else(|| "npcErrors.region".to_string())?;
    let after_start = after
        .offsets
        .username
        .checked_add(USERNAME_TO_AOB)
        .ok_or_else(|| "npcErrors.region".to_string())?;
    let before_region = before
        .bytes
        .get(before_start..)
        .ok_or_else(|| "npcErrors.region".to_string())?;
    let after_region = after
        .bytes
        .get(after_start..)
        .ok_or_else(|| "npcErrors.region".to_string())?;

    compare_flag_bytes(before_region, after_region)
}

/// Parses a save for the comparator without touching the open one.
/// Nothing is written: the file is only read and serialized.
#[tauri::command]
pub(crate) async fn inspect_save(path: String, handle: tauri::AppHandle) -> Result<Value, String> {
    let resource_path = handle
        .path()
        .resolve("resources/", BaseDirectory::Resource)
        .map_err(|error| format!("Application resources are unavailable: {error}"))?;
    let save = SaveData::inspect(&path, resource_path).map_err(format_load_error)?;
    serde_json::to_value(&save).map_err(|error| error.to_string())
}
