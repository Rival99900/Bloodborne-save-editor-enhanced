use super::{constants::*, enums::Error};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Offsets {
    pub username: usize,               //Beginning
    pub inventory: (usize, usize),     //Beginning and end
    pub storage: (usize, usize),       //Beginning and end
    pub upgrades: (usize, usize),      //Beginning and end
    pub key_inventory: (usize, usize), //Beginning and end
    pub appearance: (usize, usize),    //Beginning
    pub equipped_gems: (usize, usize), //Beginning and end
    pub lced_offset: usize,
}

impl Offsets {
    // Searches the username and inventory offsets. Every derived range is
    // validated here so consumers can reject malformed saves instead of
    // slicing outside the file.
    pub fn build(bytes: &[u8]) -> Result<Offsets, Error> {
        const APPEARANCE_SEARCH_START: usize = 0xF000;
        const UPGRADE_RECORD_SIZE: usize = 40;
        const INVENTORY_SLOT_SIZE: usize = 16;
        // Preserve the historical exclusive boundary of the main inventory.
        const INVENTORY_SLOT_COUNT: usize = 1983;
        const STORAGE_SLOT_COUNT: usize = 1984;
        const LCED: [u8; 4] = *b"LCED";
        const FACE: [u8; 4] = *b"FACE";

        if bytes.len() < APPEARANCE_SEARCH_START + FACE.len() {
            return Err(Error::CustomError(
                "Save is too short to contain the required sections.",
            ));
        }

        let gems = [
            [0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00],
            [0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00],
            [0x01, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00],
            [0x01, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00],
            [0x01, 0x00, 0x00, 0x00, 0x3f, 0x00, 0x00, 0x00],
        ];
        let runes = [
            [0x02, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00],
            [0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00],
        ];

        let mut upgrades_end = None;
        let mut upgrade_offset = START_TO_UPGRADE;
        while let Some(record_end) = upgrade_offset.checked_add(16) {
            if record_end > bytes.len() {
                break;
            }
            let current = &bytes[upgrade_offset + 8..record_end];
            let is_upgrade = runes.iter().any(|candidate| current == candidate)
                || gems.iter().any(|candidate| current == candidate);
            if !is_upgrade {
                upgrades_end = upgrade_offset.checked_sub(1);
                break;
            }
            upgrade_offset = upgrade_offset
                .checked_add(UPGRADE_RECORD_SIZE)
                .ok_or(Error::CustomError("Upgrade section offset overflow."))?;
        }
        let upgrades_end = upgrades_end.ok_or(Error::CustomError(
            "Failed to find a valid end for the upgrade section.",
        ))?;

        let appearance_marker_offset = bytes[APPEARANCE_SEARCH_START..]
            .windows(FACE.len())
            .position(|window| window == FACE)
            .map(|relative| APPEARANCE_SEARCH_START + relative)
            .ok_or(Error::CustomError("Failed to find the appearance section."))?;
        let appearance_start = appearance_marker_offset
            .checked_add(FACE.len())
            .ok_or(Error::CustomError("Appearance offset overflow."))?;
        let appearance_end = appearance_start
            .checked_add(APPEARANCE_BYTES_AMOUNT)
            .and_then(|end| end.checked_sub(1))
            .ok_or(Error::CustomError("Appearance range overflow."))?;
        if appearance_end >= bytes.len() {
            return Err(Error::CustomError(
                "Appearance data is outside the save file.",
            ));
        }

        let inventory_start = appearance_marker_offset
            .checked_sub(34028)
            .ok_or(Error::CustomError("Inventory offset is invalid."))?;
        let username_offset = inventory_start
            .checked_sub(USERNAME_TO_INV_OFFSET)
            .ok_or(Error::CustomError("Username offset is invalid."))?;
        let inventory_end = inventory_start
            .checked_add(INVENTORY_SLOT_COUNT * INVENTORY_SLOT_SIZE)
            .ok_or(Error::CustomError("Inventory range overflow."))?;
        let storage_start = inventory_start
            .checked_add(INV_TO_STORAGE_OFFSET)
            .ok_or(Error::CustomError("Storage offset overflow."))?;
        let storage_end = storage_start
            .checked_add(STORAGE_SLOT_COUNT * INVENTORY_SLOT_SIZE)
            .ok_or(Error::CustomError("Storage range overflow."))?;
        let key_inventory_start = username_offset
            .checked_add(USERNAME_TO_KEY_INV_OFFSET)
            .ok_or(Error::CustomError("Key inventory offset overflow."))?;
        let key_inventory_end = key_inventory_start
            .checked_add(2204)
            .ok_or(Error::CustomError("Key inventory range overflow."))?;
        let username_end = username_offset
            .checked_add(33)
            .ok_or(Error::CustomError("Username range overflow."))?;

        if [inventory_end, storage_end, key_inventory_end, username_end]
            .into_iter()
            .any(|end| end > bytes.len())
        {
            return Err(Error::CustomError(
                "One or more required inventory sections are outside the save file.",
            ));
        }

        let lced_offset = bytes[appearance_marker_offset..]
            .windows(LCED.len())
            .position(|window| window == LCED)
            .map(|relative| appearance_marker_offset + relative)
            .ok_or(Error::CustomError("Failed to find the LCED section."))?;

        Ok(Offsets {
            username: username_offset,
            inventory: (inventory_start, inventory_end),
            storage: (storage_start, storage_end),
            upgrades: (START_TO_UPGRADE, upgrades_end),
            key_inventory: (key_inventory_start, key_inventory_end),
            appearance: (appearance_start, appearance_end),
            equipped_gems: (0, 0),
            lced_offset,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data_handling::file::FileData;
    use std::path::PathBuf;

    #[test]
    fn offsets_build() {
        //Test with invalid path
        let file_data = FileData::build("invalid", PathBuf::from("resources"));
        assert!(file_data.is_err());
        if let Err(e) = file_data {
            assert!(e.to_string().contains("I/0 error:"));
        }

        //Test with empty save
        let file_data = FileData::build("saves/emptysave", PathBuf::from("resources"));
        assert!(file_data.is_err());
        if let Err(e) = file_data {
            assert_eq!(e.to_string(), "Save error: The selected file is empty.");
        }

        //Test with a save that has no inventory
        let file_data = FileData::build("saves/no_inv_save", PathBuf::from("resources"));
        assert!(file_data.is_err());
        if let Err(e) = file_data {
            assert!(
                e.to_string().starts_with("Save error:"),
                "malformed saves must return a controlled error"
            );
        }

        //Test a save in which the inventory has no end
        let file_data = FileData::build("saves/no_inv_end_save", PathBuf::from("resources"));
        assert!(file_data.is_err());
        if let Err(e) = file_data {
            assert!(
                e.to_string().starts_with("Save error:"),
                "malformed saves must return a controlled error"
            );
        }

        //Test a save with no appearance
        let file_data = FileData::build("saves/noappearancesave0", PathBuf::from("resources"));
        assert!(file_data.is_err());
        if let Err(e) = file_data {
            assert!(
                e.to_string().starts_with("Save error:"),
                "malformed saves must return a controlled error"
            );
        }

        //testsave0
        let file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        assert_eq!(file_data.offsets.username, 0x8777);
        assert_eq!(file_data.offsets.inventory, (0x894c, 0x894c + 1983 * 16));
        assert_eq!(file_data.offsets.key_inventory, (0x10540, 0x10540 + 2204));
        assert_eq!(file_data.offsets.upgrades, (84, 163));
        assert_eq!(
            file_data.offsets.appearance,
            (0x10e3c, 0x10e3c + APPEARANCE_BYTES_AMOUNT - 1)
        );

        //testsave1
        let file_data = FileData::build("saves/testsave1", PathBuf::from("resources")).unwrap();
        assert_eq!(file_data.offsets.username, 0xa82b);
        assert_eq!(file_data.offsets.inventory, (0xaa00, 0xaa00 + 1983 * 16));
        assert_eq!(file_data.offsets.key_inventory, (0x125f4, 0x125f4 + 2204));
        assert_eq!(file_data.offsets.upgrades, (84, 0x8c3));
        assert_eq!(
            file_data.offsets.appearance,
            (0x12ef0, 0x12ef0 + APPEARANCE_BYTES_AMOUNT - 1)
        );

        //testsave2
        let file_data = FileData::build("saves/testsave2", PathBuf::from("resources")).unwrap();
        assert_eq!(file_data.offsets.username, 0xa86f);
        assert_eq!(file_data.offsets.inventory, (0xaa44, 0xaa44 + 1983 * 16));
        assert_eq!(file_data.offsets.key_inventory, (0x12638, 0x12638 + 2204));
        assert_eq!(file_data.offsets.upgrades, (84, 0x7d3));
        assert_eq!(
            file_data.offsets.appearance,
            (0x12f34, 0x12f34 + APPEARANCE_BYTES_AMOUNT - 1)
        );

        //testsave3
        let file_data = FileData::build("saves/testsave3", PathBuf::from("resources")).unwrap();
        assert_eq!(file_data.offsets.username, 0xb473);
        assert_eq!(file_data.offsets.inventory, (0xb648, 0xb648 + 1983 * 16));
        assert_eq!(file_data.offsets.key_inventory, (0x1323c, 0x1323c + 2204));
        assert_eq!(file_data.offsets.upgrades, (84, 0xf7b));
        assert_eq!(
            file_data.offsets.appearance,
            (0x13b38, 0x13b38 + APPEARANCE_BYTES_AMOUNT - 1)
        );

        //testsave4
        let file_data = FileData::build("saves/testsave4", PathBuf::from("resources")).unwrap();
        assert_eq!(file_data.offsets.username, 0xc85f);
        assert_eq!(file_data.offsets.inventory, (0xca34, 0xca34 + 1983 * 16));
        assert_eq!(file_data.offsets.key_inventory, (0x14628, 0x14628 + 2204));
        assert_eq!(file_data.offsets.upgrades, (84, 163));
        assert_eq!(
            file_data.offsets.appearance,
            (0x14f24, 0x14f24 + APPEARANCE_BYTES_AMOUNT - 1)
        );

        //testsave8
        let file_data = FileData::build("saves/testsave8", PathBuf::from("resources")).unwrap();
        assert_eq!(file_data.offsets.username, 0x19897);
        assert_eq!(file_data.offsets.inventory, (0x19a6c, 0x19a6c + 1983 * 16));
        assert_eq!(file_data.offsets.key_inventory, (0x21660, 0x21660 + 2204));
        assert_eq!(file_data.offsets.upgrades, (84, 0x10ae3));
        assert_eq!(
            file_data.offsets.appearance,
            (0x21f5c, 0x21f5c + APPEARANCE_BYTES_AMOUNT - 1)
        );
    }
}
