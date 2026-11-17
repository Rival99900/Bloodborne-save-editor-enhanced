//! Backup history next to the save file.

use crate::data_handling::{self};

#[tauri::command]
pub(crate) fn list_backups(
    path: String,
) -> Result<Vec<data_handling::backups::BackupEntry>, String> {
    data_handling::backups::list(std::path::Path::new(&path)).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn restore_backup(path: String, backup: String) -> Result<(), String> {
    // The frontend reopens `path` afterwards, through the normal load checks.
    data_handling::backups::restore(std::path::Path::new(&path), std::path::Path::new(&backup))
        .map_err(|error| error.to_string())
}
