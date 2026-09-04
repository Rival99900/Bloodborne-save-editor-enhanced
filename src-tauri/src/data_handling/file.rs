use serde::{Deserialize, Serialize};

use super::{
    constants::{USERNAME_TO_AOB, USERNAME_TO_ISZ_GLITCH},
    enums::{Error, Location, TypeFamily},
    offsets::Offsets,
};
use std::{
    fs::{self, OpenOptions},
    io::{self, Read, Write},
    path::{Path, PathBuf},
    process,
};

const CANONICAL_BLOODBORNE_SAVE_SIZE: usize = 0x140000;

fn repair_crlf_expanded_save(bytes: Vec<u8>) -> (Vec<u8>, bool) {
    if bytes.len() <= CANONICAL_BLOODBORNE_SAVE_SIZE {
        return (bytes, false);
    }

    let line_feeds = bytes.iter().filter(|byte| **byte == b'\n').count();
    let looks_expanded = bytes.len() == CANONICAL_BLOODBORNE_SAVE_SIZE + line_feeds
        && bytes
            .iter()
            .enumerate()
            .filter(|(_, byte)| **byte == b'\n')
            .all(|(index, _)| index > 0 && bytes[index - 1] == b'\r');
    if !looks_expanded {
        return (bytes, false);
    }

    let mut repaired = Vec::with_capacity(CANONICAL_BLOODBORNE_SAVE_SIZE);
    for (index, byte) in bytes.iter().copied().enumerate() {
        if byte == b'\r' && bytes.get(index + 1) == Some(&b'\n') {
            continue;
        }
        repaired.push(byte);
    }

    if repaired.len() == CANONICAL_BLOODBORNE_SAVE_SIZE {
        (repaired, true)
    } else {
        (bytes, false)
    }
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct FileData {
    pub bytes: Vec<u8>,
    pub offsets: Offsets,
    pub resources_path: PathBuf, //This is here for convenience
    pub compatibility_repair_applied: bool,
}

impl FileData {
    pub fn build(path: &str, resources_path: PathBuf) -> Result<FileData, Error> {
        // Open the save file
        let mut file = fs::File::open(path).map_err(Error::IoError)?;

        // Read the entire file into a vector of bytes
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).map_err(Error::IoError)?;

        if bytes.is_empty() {
            return Err(Error::CustomError("The selected file is empty."));
        }

        let (bytes, compatibility_repair_applied) = repair_crlf_expanded_save(bytes);

        //Search the offsets
        let offsets = Offsets::build(&bytes)?;

        Ok(FileData {
            bytes,
            offsets,
            resources_path,
            compatibility_repair_applied,
        })
    }

    pub fn create_backup(&self, path: &str) -> Result<(), Error> {
        let backup_path = format!("{}.bak", path);
        fs::copy(path, backup_path).map_err(Error::IoError)?;
        Ok(())
    }

    // offset_from_username is value_offset-username_offset
    pub fn get_number(&self, offset_from_username: isize, length: usize) -> Result<u32, Error> {
        if !(1..=4).contains(&length) {
            return Err(Error::CustomError("Invalid numeric field length in save."));
        }
        let value_offset = self
            .offsets
            .username
            .checked_add_signed(offset_from_username)
            .ok_or(Error::CustomError("Numeric field offset is invalid."))?;
        let end = value_offset
            .checked_add(length)
            .ok_or(Error::CustomError("Numeric field range overflow."))?;
        let value_bytes = self.bytes.get(value_offset..end).ok_or(Error::CustomError(
            "Numeric field is outside the save file.",
        ))?;

        let mut value: u32 = 0;
        let base: u32 = 256;

        for (index, byte) in value_bytes.iter().enumerate().rev() {
            value += *byte as u32 * (base.pow(index as u32));
        }

        Ok(value)
    }

    pub fn get_flag(&self, offset_from_aob: usize) -> Result<u8, Error> {
        let value_offset = self
            .offsets
            .username
            .checked_add(USERNAME_TO_AOB)
            .and_then(|offset| offset.checked_add(offset_from_aob))
            .ok_or(Error::CustomError("Boss flag offset overflow."))?;

        self.bytes
            .get(value_offset)
            .copied()
            .ok_or(Error::CustomError("Boss flag is outside the save file."))
    }

    pub fn set_flag(&mut self, offset_from_aob: usize, new_value: u8) -> Result<(), Error> {
        let value_offset = self
            .offsets
            .username
            .checked_add(USERNAME_TO_AOB)
            .and_then(|offset| offset.checked_add(offset_from_aob))
            .ok_or(Error::CustomError("Boss flag offset overflow."))?;
        let value = self
            .bytes
            .get_mut(value_offset)
            .ok_or(Error::CustomError("Boss flag is outside the save file."))?;
        *value = new_value;
        Ok(())
    }

    pub fn apply_mask(&mut self, offset_from_aob: usize, mask: u8) -> Result<(), Error> {
        let value_offset = self
            .offsets
            .username
            .checked_add(USERNAME_TO_AOB)
            .and_then(|offset| offset.checked_add(offset_from_aob))
            .ok_or(Error::CustomError("Boss flag offset overflow."))?;
        let value = self
            .bytes
            .get_mut(value_offset)
            .ok_or(Error::CustomError("Boss flag is outside the save file."))?;
        *value &= mask;
        Ok(())
    }

    pub fn edit(&mut self, rel_offset: isize, length: usize, times: usize, value: u32) {
        let value_bytes = value.to_le_bytes();
        let from_offset = (self.offsets.username as isize + rel_offset) as usize;

        for i in 0..times {
            let offset = i * 4;
            for (j, b) in value_bytes[..length].iter().enumerate() {
                self.bytes[from_offset + j + offset] = *b;
            }
        }
    }

    pub fn save(&self, path: &str) -> Result<(), io::Error> {
        let target = Path::new(path);
        let file_name = target.file_name().ok_or_else(|| {
            io::Error::new(io::ErrorKind::InvalidInput, "Save destination has no file name.")
        })?;
        let parent = target.parent().unwrap_or_else(|| Path::new("."));
        let file_name = file_name.to_string_lossy();

        let mut staged = None;
        for attempt in 0..100_u8 {
            let staged_path = parent.join(format!(
                ".{file_name}.{}.{}.tmp",
                process::id(),
                attempt
            ));
            match OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&staged_path)
            {
                Ok(file) => {
                    staged = Some((staged_path, file));
                    break;
                }
                Err(error) if error.kind() == io::ErrorKind::AlreadyExists => continue,
                Err(error) => return Err(error),
            }
        }

        let (staged_path, mut staged_file) = staged.ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::AlreadyExists,
                "Unable to allocate a temporary save file.",
            )
        })?;

        if let Err(error) = staged_file
            .write_all(&self.bytes)
            .and_then(|_| staged_file.flush())
            .and_then(|_| staged_file.sync_all())
        {
            let _ = fs::remove_file(&staged_path);
            return Err(error);
        }
        drop(staged_file);

        #[cfg(not(target_os = "windows"))]
        {
            if let Err(error) = fs::rename(&staged_path, target) {
                let _ = fs::remove_file(&staged_path);
                return Err(error);
            }
        }

        #[cfg(target_os = "windows")]
        {
            let rollback_path = parent.join(format!(
                ".{file_name}.{}.replace-backup",
                process::id()
            ));
            let had_target = target.exists();
            if had_target {
                let _ = fs::remove_file(&rollback_path);
                fs::rename(target, &rollback_path)?;
            }

            if let Err(error) = fs::rename(&staged_path, target) {
                if had_target {
                    let _ = fs::rename(&rollback_path, target);
                }
                let _ = fs::remove_file(&staged_path);
                return Err(error);
            }
            if had_target {
                let _ = fs::remove_file(&rollback_path);
            }
        }

        Ok(())
    }

    pub fn find_article_offset(
        &self,
        index: u8,
        id: u32,
        type_family: TypeFamily,
        is_storage: bool,
    ) -> Option<usize> {
        let found = |offset| -> bool {
            let last_byte = match type_family {
                TypeFamily::Armor | TypeFamily::Item => 0x00,
                TypeFamily::Weapon => self.bytes[offset + 11],
            };
            let current_id = u32::from_le_bytes([
                self.bytes[offset + 8],
                self.bytes[offset + 9],
                self.bytes[offset + 10],
                last_byte,
            ]);
            (index == self.bytes[offset]) && (id == current_id)
        };

        let (inv, key) = match is_storage {
            true => (self.offsets.storage, self.offsets.key_inventory),
            false => (self.offsets.inventory, self.offsets.key_inventory),
        };

        //Search for the article in the inventory
        let mut i = inv.0;
        while (i <= inv.1 - 24) && (!found(i)) {
            i += 16;
        }

        //If the article wasnt found, search for it in the key inventory
        if !found(i) {
            i = key.0;
            while (i <= key.1 - 16) && (!found(i)) {
                i += 16;
            }
        }

        match found(i) {
            true => Some(i),
            false => None,
        }
    }

    pub fn find_upgrade_offset(&self, id: u32) -> Option<usize> {
        //Search for the upgrade
        for i in (self.offsets.upgrades.0..self.offsets.upgrades.1).step_by(40) {
            let current_id = u32::from_le_bytes([
                self.bytes[i],
                self.bytes[i + 1],
                self.bytes[i + 2],
                self.bytes[i + 3],
            ]);
            if id == current_id {
                return Some(i);
            }
        }
        None
    }

    //If there is an empty slot return the index of the first byte of the first part
    //Or else return None
    pub fn find_inv_empty_slot(&self, location: Location) -> Option<usize> {
        let (start, end) = match location {
            Location::Inventory => self.offsets.inventory,
            Location::Storage => self.offsets.storage,
        };
        let empty = [0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0];
        let mut buffer = [0; 12];
        //-4 so it doesn't match the last slot
        for i in (start..end - 4).step_by(16) {
            buffer.copy_from_slice(&self.bytes[i + 4..=i + 15]);
            if empty == buffer {
                return Some(i + 4); //First byte of the first part of the slot
            }
        }
        None
    }

    pub fn count_inv_empty_slots(&self, location: Location) -> usize {
        let (start, end) = match location {
            Location::Inventory => self.offsets.inventory,
            Location::Storage => self.offsets.storage,
        };
        let empty = [0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0];
        (start..end.saturating_sub(4))
            .step_by(16)
            .filter(|offset| self.bytes.get(offset + 4..=offset + 15) == Some(&empty[..]))
            .count()
    }

    pub fn get_playtime(&self) -> Result<u32, Error> {
        let time_bytes: [u8; 4] = self
            .bytes
            .get(0x08..0x0C)
            .ok_or(Error::CustomError(
                "Save is too short to contain playtime data.",
            ))?
            .try_into()
            .map_err(|_| Error::CustomError("Playtime data has an invalid length."))?;

        Ok(u32::from_le_bytes(time_bytes))
    }

    pub fn set_playtime(&mut self, new_playtime: [u8; 4]) {
        for (i, j) in (0x08..=0x0B).enumerate() {
            self.bytes[j] = new_playtime[i];
        }
    }

    pub fn get_isz(&self) -> [u8; 2] {
        [
            self.bytes[USERNAME_TO_ISZ_GLITCH + self.offsets.username],
            self.bytes[USERNAME_TO_ISZ_GLITCH + self.offsets.username + 1],
        ]
    }

    pub fn fix_isz(&mut self) -> String {
        let values = self.get_isz();
        if values[0] == 0xFF {
            if values[1] < 0xC0 {
                self.bytes[USERNAME_TO_ISZ_GLITCH + self.offsets.username + 1] = 0x30;
                return "Partial Isz glitch fix applied".to_string();
            } else if values[1] == 0xC0 {
                self.bytes[USERNAME_TO_ISZ_GLITCH + self.offsets.username + 1] = 0xFF;
                return "Full Isz glitch fix applied".to_string();
            }
        }

        "No Isz glitch, no changes have been made".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repairs_only_a_complete_crlf_expansion() {
        let mut canonical = vec![0x55; CANONICAL_BLOODBORNE_SAVE_SIZE];
        canonical[10] = b'\n';
        canonical[20] = b'\r';
        canonical[21] = b'\n';
        let mut expanded = Vec::with_capacity(canonical.len() + 2);
        for byte in canonical.iter().copied() {
            if byte == b'\n' {
                expanded.push(b'\r');
            }
            expanded.push(byte);
        }

        let (repaired, changed) = repair_crlf_expanded_save(expanded);
        assert!(changed);
        assert_eq!(repaired, canonical);

        let (untouched, changed) = repair_crlf_expanded_save(canonical.clone());
        assert!(!changed);
        assert_eq!(untouched, canonical);
    }

    #[test]
    fn test_find_upgrade_offset() {
        //testsave3
        let file_data = FileData::build("saves/testsave3", PathBuf::from("resources")).unwrap();

        //Does not exist
        assert_eq!(file_data.find_upgrade_offset(0xFFFFFFFF), None);
        //First one
        assert_eq!(file_data.find_upgrade_offset(0xC08006B5), Some(0x54));
        //Last one
        assert_eq!(file_data.find_upgrade_offset(0xC0800715), Some(0xF54));
        //Other ones
        assert_eq!(file_data.find_upgrade_offset(0xC08006E5), Some(0x7D4));
        assert_eq!(file_data.find_upgrade_offset(0xC08006D4), Some(0x52C));
        assert_eq!(file_data.find_upgrade_offset(0xC08006C2), Some(0x25C));
        assert_eq!(file_data.find_upgrade_offset(0x00000000), None);
    }

    #[test]
    fn test_file_data_save() {
        let mut file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        file_data.edit(500, 2, 10, 500);
        file_data.save("saves/savetestsave").unwrap();
        let file_data2 = FileData::build("saves/savetestsave", PathBuf::from("resources")).unwrap();
        assert_eq!(file_data, file_data2);
    }

    #[test]
    fn test_find_article_offset() {
        let file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        assert_eq!(
            file_data
                .find_article_offset(4, 1200, TypeFamily::Item, true)
                .unwrap(),
            0x10f28
        );
    }

    #[test]
    fn test_fix_isz_reports_partial_full_and_no_change() {
        let mut file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        let offset = USERNAME_TO_ISZ_GLITCH + file_data.offsets.username;

        file_data.bytes[offset] = 0xFF;
        file_data.bytes[offset + 1] = 0x20;
        assert_eq!(file_data.fix_isz(), "Partial Isz glitch fix applied");
        assert_eq!(file_data.get_isz(), [0xFF, 0x30]);

        file_data.bytes[offset] = 0xFF;
        file_data.bytes[offset + 1] = 0xC0;
        assert_eq!(file_data.fix_isz(), "Full Isz glitch fix applied");
        assert_eq!(file_data.get_isz(), [0xFF, 0xFF]);

        let before = file_data.get_isz();
        assert_eq!(
            file_data.fix_isz(),
            "No Isz glitch, no changes have been made"
        );
        assert_eq!(file_data.get_isz(), before);
    }

    #[test]
    fn test_find_inv_empty_slot() {
        let file_data = FileData::build("saves/testsave4", PathBuf::from("resources")).unwrap();
        assert_eq!(
            file_data.find_inv_empty_slot(Location::Inventory).unwrap(),
            0xcfb8
        );
        assert_eq!(
            file_data.find_inv_empty_slot(Location::Storage).unwrap(),
            0x15304
        );

        let file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        // This fixture contains a valid reusable record after the initial item
        // sequence. Keep the expected offset explicit so add-item regressions
        // continue to be caught without rejecting a safe empty slot.
        assert_eq!(
            file_data.find_inv_empty_slot(Location::Inventory),
            Some(0x8cd0),
        );
    }
}
