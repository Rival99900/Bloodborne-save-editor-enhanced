//! Timestamped backup history (F9). Next to `userdata0000`, the folder
//! `userdata0000.backups/` keeps the most recent copies taken when a save is
//! opened or before a backup is restored. The single `.bak` file is unchanged.

use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use serde::Serialize;

pub const MAX_BACKUPS: usize = 10;
const PREFIX: &str = "backup-";
const SUFFIX: &str = ".bak";

#[derive(Serialize, Debug, Clone, PartialEq, Eq)]
pub struct BackupEntry {
    pub path: String,
    pub file_name: String,
    /// Seconds since the Unix epoch, taken from the file name.
    pub created: u64,
    pub size: u64,
}

pub fn backup_dir(save_path: &Path) -> PathBuf {
    let mut name = save_path.file_name().map(|name| name.to_os_string()).unwrap_or_default();
    name.push(".backups");
    save_path.with_file_name(name)
}

fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map_or(0, |duration| duration.as_secs())
}

/// (seconds, counter) from `backup-<secs>.bak` or `backup-<secs>-<counter>.bak`.
fn parse_name(file_name: &str) -> Option<(u64, u64)> {
    let stem = file_name.strip_prefix(PREFIX)?.strip_suffix(SUFFIX)?;
    let mut parts = stem.split('-');
    let created = parts.next()?.parse().ok()?;
    let counter = parts.next().map_or(Some(0), |part| part.parse().ok())?;
    Some((created, counter))
}

pub fn list(save_path: &Path) -> std::io::Result<Vec<BackupEntry>> {
    let dir = backup_dir(save_path);
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let mut entries = Vec::new();
    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        let file_name = entry.file_name().to_string_lossy().to_string();
        let Some((created, counter)) = parse_name(&file_name) else { continue };
        let metadata = entry.metadata()?;
        if !metadata.is_file() {
            continue;
        }
        entries.push((counter, BackupEntry {
            path: entry.path().to_string_lossy().to_string(),
            file_name,
            created,
            size: metadata.len(),
        }));
    }
    // Newest first; the counter orders copies taken within the same second.
    entries.sort_by(|(ca, a), (cb, b)| b.created.cmp(&a.created).then_with(|| cb.cmp(ca)));
    Ok(entries.into_iter().map(|(_, entry)| entry).collect())
}

/// Copies `bytes` into the history unless the newest backup is identical, then
/// keeps only the `MAX_BACKUPS` most recent files. Returns the new entry path.
pub fn record(save_path: &Path, bytes: &[u8]) -> std::io::Result<Option<PathBuf>> {
    let dir = backup_dir(save_path);
    fs::create_dir_all(&dir)?;
    let existing = list(save_path)?;
    if let Some(newest) = existing.first() {
        if fs::read(&newest.path).map(|content| content == bytes).unwrap_or(false) {
            return Ok(None);
        }
    }
    let created = now_secs();
    // Within the same second, always number after the highest existing copy so a
    // slot freed by rotation can never make a new copy look older.
    let next_counter = existing
        .iter()
        .filter(|entry| entry.created == created)
        .filter_map(|entry| parse_name(&entry.file_name).map(|(_, counter)| counter + 1))
        .max();
    let target = match next_counter {
        None => dir.join(format!("{PREFIX}{created}{SUFFIX}")),
        Some(counter) => dir.join(format!("{PREFIX}{created}-{counter}{SUFFIX}")),
    };
    fs::write(&target, bytes)?;
    for old in list(save_path)?.into_iter().skip(MAX_BACKUPS) {
        let _ = fs::remove_file(old.path);
    }
    Ok(Some(target))
}

/// Replaces `save_path` with `backup_path`, after recording the current file.
/// Only files of this save's own history can be restored.
pub fn restore(save_path: &Path, backup_path: &Path) -> std::io::Result<()> {
    let dir = backup_dir(save_path).canonicalize()?;
    let backup = backup_path.canonicalize()?;
    if backup.parent() != Some(dir.as_path()) {
        return Err(std::io::Error::new(std::io::ErrorKind::PermissionDenied, "Not a backup of this save."));
    }
    let restored = fs::read(&backup)?;
    if let Ok(current) = fs::read(save_path) {
        record(save_path, &current)?;
    }
    fs::write(save_path, restored)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_save(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("bbse-backups-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir.join("userdata0000")
    }

    #[test]
    fn records_deduplicates_rotates_and_restores() {
        let save = temp_save("cycle");
        fs::write(&save, b"v1").unwrap();
        assert!(record(&save, b"v1").unwrap().is_some());
        // Same content as the newest backup: nothing new.
        assert!(record(&save, b"v1").unwrap().is_none());
        for version in 2..=12u8 {
            record(&save, &[version]).unwrap();
        }
        let entries = list(&save).unwrap();
        assert_eq!(entries.len(), MAX_BACKUPS);
        assert_eq!(fs::read(&entries[0].path).unwrap(), vec![12]);

        fs::write(&save, b"current").unwrap();
        let oldest = entries.last().unwrap().path.clone();
        let oldest_bytes = fs::read(&oldest).unwrap();
        restore(&save, Path::new(&oldest)).unwrap();
        assert_eq!(fs::read(&save).unwrap(), oldest_bytes);
        // The replaced content was kept as the newest backup.
        assert_eq!(fs::read(&list(&save).unwrap()[0].path).unwrap(), b"current");
    }

    #[test]
    fn refuses_files_outside_the_history() {
        let save = temp_save("outside");
        fs::write(&save, b"v1").unwrap();
        record(&save, b"v1").unwrap();
        let stranger = save.with_file_name("other.bak");
        fs::write(&stranger, b"x").unwrap();
        assert!(restore(&save, &stranger).is_err());
        assert_eq!(fs::read(&save).unwrap(), b"v1");
    }
}
