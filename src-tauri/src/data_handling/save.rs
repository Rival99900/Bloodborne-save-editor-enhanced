use serde::{Deserialize, Serialize};

use super::enums::ArticleType;

use crate::data_handling::position::Pos;
use serde_json::Value;
use std::{
    collections::HashSet,
    panic::{self, AssertUnwindSafe},
    path::PathBuf,
};

use super::{
    article::Article,
    bosses::{self, Boss},
    enums::{Error, Location, SlotShape, TypeFamily, UpgradeType},
    file::FileData,
    inventory::Inventory,
    slots::{parse_equipped_gems, Slot},
    stats::{self, Stat},
    upgrades::{parse_upgrades, Upgrade, UpgradeInfo},
    username::Username,
};

#[derive(Serialize, Deserialize, Clone)]
pub struct SaveData {
    #[serde(skip_serializing)]
    pub file: FileData,
    pub stats: Vec<Stat>,
    pub inventory: Inventory,
    pub storage: Inventory,
    pub username: Username,
    pub bosses: Vec<Boss>,
    pub playtime: u32,
    pub position: Pos,
    pub compatibility_repair_applied: bool,
}

/// Gem slots opened by default on a weapon (the usual in-game count).
pub const WEAPON_GEM_SLOTS: usize = 3;
/// The game reads at most five Gem slots on a weapon.
pub const MAX_WEAPON_GEM_SLOTS: usize = 5;
/// Blood Vials and Quicksilver Bullets.
const INFINITE_CONSUMABLES: [u32; 2] = [1000, 900];

impl SaveData {
    pub fn build(save_path: &str, resources_path: PathBuf) -> Result<SaveData, Error> {
        // The low-level parser predates fallible APIs in several inventory and
        // upgrade paths. This boundary prevents a malformed or unsupported
        // save from propagating a legacy bounds panic into the desktop app.
        panic::catch_unwind(AssertUnwindSafe(|| {
            Self::build_validated(save_path, resources_path)
        }))
        .map_err(|_| Error::CustomError("Save has an invalid or unsupported internal structure."))?
    }

    /// Parses a save without writing anything next to it (no backup copy).
    pub fn inspect(save_path: &str, resources_path: PathBuf) -> Result<SaveData, Error> {
        panic::catch_unwind(AssertUnwindSafe(|| {
            Self::parse_file(FileData::build(save_path, resources_path)?)
        }))
        .map_err(|_| Error::CustomError("Save has an invalid or unsupported internal structure."))?
    }

    fn build_validated(save_path: &str, resources_path: PathBuf) -> Result<SaveData, Error> {
        let file = FileData::build(save_path, resources_path)?;
        let save = Self::parse_file(file)?;
        save.file.create_backup(save_path)?;
        Ok(save)
    }

    // Rebuild all derived views after structural edits, without filesystem I/O.
    fn parse_file(mut file: FileData) -> Result<SaveData, Error> {
        let stats = stats::new(&file).map_err(|_| {
            Error::CustomError("Failed to parse character statistics from this save.")
        })?;
        let bosses = bosses::new(&file)
            .map_err(|_| Error::CustomError("Failed to parse boss flags from this save."))?;
        let mut upgrades = parse_upgrades(&file);
        let mut slots = parse_equipped_gems(&mut file, &mut upgrades);
        let inventory = Inventory::build(
            &file,
            file.offsets.inventory,
            file.offsets.key_inventory,
            &mut upgrades,
            &mut slots,
        );
        let storage = Inventory::build(
            &file,
            file.offsets.storage,
            (0, 0),
            &mut upgrades,
            &mut slots,
        ); // Its not possible to store key items
        let username = Username::try_build(&file)?;
        let playtime = file.get_playtime()?;
        let position = Pos::new(&file)?;

        let compatibility_repair_applied = file.compatibility_repair_applied;
        Ok(SaveData {
            file,
            stats,
            inventory,
            storage,
            username,
            bosses,
            playtime,
            position,
            compatibility_repair_applied,
        })
    }

    /// Validate a patched copy and rebuild all editor views without disk writes.
    pub fn with_patched_bytes(&self, bytes: Vec<u8>) -> Result<Self, String> {
        if bytes.len() != self.file.bytes.len() {
            return Err("patchErrors.size".into());
        }
        // Consumables have two copies of their item ID. Some upstream Pebble
        // codes update only one; reject that partial conversion instead of
        // silently leaving a dangling/mismatched item reference.
        for (start, end) in [self.file.offsets.inventory, self.file.offsets.storage] {
            for record in (start..end).step_by(16) {
                if bytes.get(record + 4..record + 12)
                    != self.file.bytes.get(record + 4..record + 12)
                    && bytes.get(record + 7) == Some(&0xb0)
                    && bytes.get(record + 11) == Some(&0x40)
                    && bytes.get(record + 4..record + 7) != bytes.get(record + 8..record + 11)
                {
                    return Err("patchErrors.structure".into());
                }
            }
        }
        let expected = bytes.clone();
        let mut file = self.file.clone();
        file.bytes = bytes;
        file.offsets =
            super::offsets::Offsets::build(&file.bytes).map_err(|_| "patchErrors.structure")?;
        let candidate = panic::catch_unwind(AssertUnwindSafe(|| Self::parse_file(file)))
            .map_err(|_| "patchErrors.structure")?
            .map_err(|_| "patchErrors.structure")?;
        if candidate.file.bytes != expected {
            return Err("patchErrors.structure".into());
        }
        candidate
            .validate_game_load_safety()
            .map_err(|_| "patchErrors.structure")?;
        let count = |inv: &Inventory| {
            inv.articles.values().map(Vec::len).sum::<usize>()
                + inv.upgrades.values().map(Vec::len).sum::<usize>()
        };
        if count(&candidate.inventory) != count(&self.inventory)
            || count(&candidate.storage) != count(&self.storage)
        {
            return Err("patchErrors.structure".into());
        }
        // Preserve coherence between a changed rune source in the upgrade pool
        // and every inventory/storage reference to its stable native handle.
        for (start, end) in [
            candidate.file.offsets.inventory,
            candidate.file.offsets.storage,
        ] {
            for record in (start..end).step_by(16) {
                let handle = &candidate.file.bytes[record + 4..record + 8];
                if handle[3] != 0xc0 {
                    continue;
                }
                let pool = (candidate.file.offsets.upgrades.0..candidate.file.offsets.upgrades.1)
                    .step_by(40)
                    .find(|&at| &candidate.file.bytes[at..at + 4] == handle);
                if let Some(at) = pool {
                    let source = &candidate.file.bytes[at + 4..at + 8];
                    let source_changed = self.file.bytes.get(at + 4..at + 8) != Some(source);
                    let record_changed = candidate.file.bytes[record + 4..record + 12]
                        != self.file.bytes[record + 4..record + 12];
                    if (source_changed || record_changed)
                        && &candidate.file.bytes[record + 8..record + 12] != source
                    {
                        return Err("patchErrors.structure".into());
                    }
                }
            }
        }
        Ok(candidate)
    }

    /// Rejects incoherent slot references before a save is written. This is a
    /// pre-save validation and never mutates a loaded legacy save while the user
    /// is inspecting or repairing it.
    pub fn validate_game_load_safety(&self) -> Result<(), Error> {
        const EQUIPMENT_BLOCK_SIZE: usize = 60;
        let slot_limit = self.file.offsets.username.saturating_sub(147);
        let has_matching_equipment_block = |first_part: u32, second_part: u32| {
            (self.file.offsets.equipped_gems.0..=slot_limit.saturating_sub(EQUIPMENT_BLOCK_SIZE))
                .any(|offset| {
                    self.file.bytes[offset..offset + 4] == first_part.to_le_bytes()
                        && self.file.bytes[offset + 4..offset + 8] == second_part.to_le_bytes()
                        && self.file.bytes[offset + 16..offset + 20] == [1, 0, 0, 0]
                })
        };
        for (inventory, is_storage) in [(&self.inventory, false), (&self.storage, true)] {
            for articles in inventory.articles.values() {
                for article in articles {
                    if matches!(article.type_family, TypeFamily::Weapon | TypeFamily::Armor) {
                        let record_offset = self
                            .file
                            .find_equipment_offset(article.number, article.first_part, article.second_part, is_storage)
                            // Exact match first (two copies can share a slot number); otherwise
                            // the record is checked below and reported as a reference mismatch.
                            .or_else(|| self.file.find_article_offset(article.number, article.id, article.type_family, is_storage))
                            .ok_or(Error::CustomError(
                                "ERROR: Equipment is missing its destination inventory record. Undo the addition or reopen an unmodified save before saving.",
                            ))?;
                        if self.file.bytes[record_offset + 4..record_offset + 8]
                            != article.first_part.to_le_bytes()
                            || self.file.bytes[record_offset + 8..record_offset + 12]
                                != article.second_part.to_le_bytes()
                            || !has_matching_equipment_block(
                                article.first_part,
                                article.second_part,
                            )
                        {
                            return Err(Error::CustomError(
                                "ERROR: Equipment reference validation failed. The save was not written; undo the addition or reopen an unmodified save.",
                            ));
                        }
                    }
                    let Some(slots) = &article.slots else {
                        continue;
                    };
                    for slot in slots {
                        // An open slot without a Gem is a normal game state: real saves
                        // store it as the shape followed by a zero Gem reference (126 such
                        // slots in a completed save). Only a closed slot that still points
                        // to an upgrade is incoherent.
                        if article.type_family == TypeFamily::Weapon
                            && slot.shape == SlotShape::Closed
                            && slot.gem.is_some()
                        {
                            return Err(Error::CustomError(
                                "ERROR: A closed weapon gem slot still references an upgrade. Re-open it or unequip the upgrade before saving.",
                            ));
                        }
                    }
                }
            }
        }
        Ok(())
    }

    #[cfg(test)]
    pub fn get_slot_mut(
        &mut self,
        location: Location,
        article_type: ArticleType,
        article_index: usize,
        slot_index: usize,
    ) -> Option<&mut Slot> {
        let articles = match location {
            Location::Inventory => &mut self.inventory.articles,
            Location::Storage => &mut self.storage.articles,
        };

        if let Some(articles_of_type) = articles.get_mut(&article_type) {
            if let Some(article) = articles_of_type.get_mut(article_index) {
                if let Some(ref mut slots) = &mut article.slots {
                    return slots.get_mut(slot_index);
                }
            }
        }
        None
    }

    #[cfg(test)]
    pub fn get_article_mut(
        &mut self,
        location: Location,
        article_type: ArticleType,
        article_index: usize,
    ) -> Option<&mut Article> {
        let articles = match location {
            Location::Inventory => &mut self.inventory.articles,
            Location::Storage => &mut self.storage.articles,
        };

        if let Some(articles_of_type) = articles.get_mut(&article_type) {
            return articles_of_type.get_mut(article_index);
        }
        None
    }

    #[cfg(test)]
    pub fn get_equipped_upgrade_mut(
        &mut self,
        location: Location,
        article_type: ArticleType,
        article_index: usize,
        slot_index: usize,
    ) -> Option<&mut Upgrade> {
        if let Some(slot) = self.get_slot_mut(location, article_type, article_index, slot_index) {
            if let Some(ref mut gem) = &mut slot.gem {
                return Some(gem);
            }
        }
        None
    }

    #[cfg(test)]
    pub fn get_upgrade_mut(
        &mut self,
        location: Location,
        upgrade_type: UpgradeType,
        upgrade_index: usize,
    ) -> Option<&mut Upgrade> {
        let upgrades = match location {
            Location::Inventory => &mut self.inventory.upgrades,
            Location::Storage => &mut self.storage.upgrades,
        };

        if let Some(upgrades_of_type) = upgrades.get_mut(&upgrade_type) {
            return upgrades_of_type.get_mut(upgrade_index);
        }
        None
    }

    /// Adaptation of valentinoamato's f562c289 GA-slot insertion fix.
    /// Scan 4096 typed records, expand one 8-byte vacancy to 60 bytes, then
    /// reparse every shifted offset. Commit only after the candidate validates.
    pub fn add_experimental_equipment(
        &mut self,
        id: u32,
        is_armor: bool,
        location: Location,
    ) -> Result<Article, Error> {
        use super::constants::*;
        let layout = super::ga::scan_for_insertion(&self.file.bytes, self.file.offsets.username)
            .map_err(Error::CustomError)?;
        let ga_offset = layout
            .empty
            .ok_or(Error::CustomError("ERROR: Equipment section is full."))?;
        let handle = layout.max_handle.checked_add(1).ok_or(Error::CustomError(
            "ERROR: No unique equipment code is available.",
        ))?;
        let empty = self
            .file
            .find_inv_empty_slot(location)
            .ok_or(Error::CustomError(
                "ERROR: No free destination slot is available.",
            ))?;
        let (_, article_type) = if is_armor {
            super::inventory::get_info_armor(id, &self.file.resources_path)?
        } else {
            super::inventory::get_info_weapon(id, &self.file.resources_path)?
        };
        let family: TypeFamily = article_type.into();
        if (is_armor && family != TypeFamily::Armor) || (!is_armor && family != TypeFamily::Weapon)
        {
            return Err(Error::CustomError("ERROR: Incompatible equipment family."));
        }
        let len = self.file.bytes.len();
        // As in Noxde 0.11.1, the 52 bytes pushed past the fixed save size are
        // dropped. They lie after every parsed section; in real saves they are
        // stale memory, not always zero, so requiring zeros refused most saves.
        if len < 52 || len - 52 <= self.file.offsets.lced_offset + 4 {
            return Err(Error::CustomError(
                "ERROR: Save is too short for equipment insertion.",
            ));
        }
        let first = (if is_armor { 0x9080_0000 } else { 0x8080_0000 }) | u32::from(handle);
        let second = if is_armor {
            (id & 0x00FF_FFFF) | 0x1000_0000
        } else {
            id
        };
        // Include unparsed inventory references in the collision check.
        for (start, end) in [
            self.file.offsets.inventory,
            self.file.offsets.storage,
            self.file.offsets.key_inventory,
        ] {
            for offset in (start..end).step_by(16) {
                if self.file.bytes.get(offset + 4..offset + 8)
                    == Some(first.to_le_bytes().as_slice())
                {
                    return Err(Error::CustomError(
                        "ERROR: Generated equipment code collides with an existing record.",
                    ));
                }
            }
        }
        let counters = match location {
            Location::Inventory => [
                USERNAME_TO_FIRST_INVENTORY_COUNTER,
                USERNAME_TO_SECOND_INVENTORY_COUNTER,
            ],
            Location::Storage => [
                USERNAME_TO_FIRST_STORAGE_COUNTER,
                USERNAME_TO_SECOND_STORAGE_COUNTER,
            ],
        };
        let mut file = self.file.clone();
        for relative in counters {
            let offset = file.offsets.username + relative;
            let value = u32::from_le_bytes(file.bytes[offset..offset + 4].try_into().unwrap())
                .checked_add(1)
                .ok_or(Error::CustomError("ERROR: Inventory counter overflow."))?;
            file.bytes[offset..offset + 4].copy_from_slice(&value.to_le_bytes());
        }
        file.bytes[empty..empty + 4].copy_from_slice(&first.to_le_bytes());
        file.bytes[empty + 4..empty + 8].copy_from_slice(&second.to_le_bytes());
        file.bytes[empty + 8..empty + 12].copy_from_slice(&1u32.to_le_bytes());
        // Using the slot that ends the list: number the next free slot, as the
        // game and Noxde do, so a second addition never reuses index 0.
        let next_index = empty + 12;
        let next_marker = [0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0];
        if file.bytes.get(next_index + 4..next_index + 16) == Some(next_marker.as_slice())
            && file.bytes[next_index..next_index + 4] == [0, 0, 0, 0]
            && file.bytes[empty - 4] != 0
        {
            file.bytes[next_index] = file.bytes[empty - 4].wrapping_add(1);
        }
        let mut block = [0u8; 60];
        block[..4].copy_from_slice(&first.to_le_bytes());
        block[4..8].copy_from_slice(&second.to_le_bytes());
        block[8..12].copy_from_slice(&200u32.to_le_bytes());
        block[16..20].copy_from_slice(&1u32.to_le_bytes());
        for slot in 0..5 {
            block[20 + slot * 8..24 + slot * 8].copy_from_slice(&[0, 0, 0, 0x80]);
        }
        file.bytes.splice(ga_offset..ga_offset + 8, block);
        file.bytes.truncate(len);
        file.offsets = super::offsets::Offsets::build(&file.bytes)?;
        if file.offsets.username != self.file.offsets.username + 52 {
            return Err(Error::CustomError(
                "ERROR: Shifted save layout could not be verified.",
            ));
        }
        super::ga::scan_for_insertion(&file.bytes, file.offsets.username)
            .map_err(Error::CustomError)?;
        let candidate = panic::catch_unwind(AssertUnwindSafe(|| Self::parse_file(file)))
            .map_err(|_| Error::CustomError("ERROR: Added equipment could not be reparsed."))??;
        candidate.validate_game_load_safety()?;
        let destination = match location {
            Location::Inventory => &candidate.inventory,
            Location::Storage => &candidate.storage,
        };
        let article = destination
            .articles
            .values()
            .flatten()
            .find(|item| item.first_part == first && item.second_part == second)
            .cloned()
            .ok_or(Error::CustomError(
                "ERROR: Added equipment could not be reparsed.",
            ))?;
        *self = candidate;
        Ok(article)
    }

    /// Experimental direct allocation for weapons and armor. The operation
    /// consumes only a fixed destination slot and a verified 60-byte garbage
    /// reservation in the equipment-slot area; it never shifts save data.
    #[cfg_attr(not(test), allow(dead_code))]
    pub fn add_direct_equipment(&mut self, id: u32, is_armor: bool) -> Result<Article, Error> {
        self.add_direct_equipment_at(id, is_armor, Location::Inventory)
    }

    /// Adds an equipment record to a specific supported destination. Callers
    /// must provide an explicit location so storage cannot silently fall back
    /// to the main inventory.
    #[cfg_attr(not(test), allow(dead_code))]
    pub fn add_direct_equipment_at(
        &mut self,
        id: u32,
        is_armor: bool,
        location: Location,
    ) -> Result<Article, Error> {
        let empty_slot = self
            .file
            .find_inv_empty_slot(location)
            .ok_or(match location {
                Location::Inventory => {
                    Error::CustomError("ERROR: No free inventory slot is available.")
                }
                Location::Storage => {
                    Error::CustomError("ERROR: No free storage slot is available.")
                }
            })?;

        let (info, article_type) = if is_armor {
            super::inventory::get_info_armor(id, &self.file.resources_path)?
        } else {
            super::inventory::get_info_weapon(id, &self.file.resources_path)?
        };
        let type_family: TypeFamily = article_type.into();
        if (is_armor && type_family != TypeFamily::Armor)
            || (!is_armor && type_family != TypeFamily::Weapon)
        {
            return Err(Error::CustomError(
                "ERROR: The requested catalogue entry has an incompatible equipment family.",
            ));
        }

        // Native records occupy exactly 60 bytes and are packed contiguously.
        // A 64-byte stride leaves four `FF` bytes between records; the supplied
        // PS4 crash saves prove that this malformed gap causes the game to fault
        // while loading multiple direct additions.
        const EQUIPMENT_BLOCK_SIZE: usize = 60;
        const EQUIPMENT_PREFIX_MASK: u32 = 0xFF80_0000;
        const EQUIPMENT_SUFFIX_MASK: u32 = 0x007F_FFFF;
        const WEAPON_PREFIX: u32 = 0x8080_0000;
        const ARMOR_PREFIX: u32 = 0x9080_0000;

        let is_reservation_byte = |offset: usize| {
            // The untouched garbage reservation alternates four zero bytes and
            // four `FF` bytes on eight-byte boundaries. A valid next record can
            // begin on either half of that pattern because native records are 60
            // bytes long, not 64-byte aligned.
            if offset % 8 < 4 {
                0x00
            } else {
                0xFF
            }
        };
        let slot_limit = self.file.offsets.username.saturating_sub(147);
        let referenced_pairs: HashSet<(u32, u32)> = [
            self.file.offsets.inventory,
            self.file.offsets.key_inventory,
            self.file.offsets.storage,
        ]
        .into_iter()
        .flat_map(|(start, end)| (start..end).step_by(16))
        .filter_map(|offset| {
            let first =
                u32::from_le_bytes(self.file.bytes[offset + 4..offset + 8].try_into().ok()?);
            let second =
                u32::from_le_bytes(self.file.bytes[offset + 8..offset + 12].try_into().ok()?);
            // This is the canonical reusable inventory marker used by
            // `find_inv_empty_slot`; it is the only pair that cannot reference an
            // existing article or upgrade.
            (first != 0 || second != u32::MAX).then_some((first, second))
        })
        .collect();
        let is_valid_slot_block = |offset: usize| {
            offset
                .checked_add(EQUIPMENT_BLOCK_SIZE)
                .is_some_and(|end| end <= slot_limit)
                && self.file.bytes[offset..offset + 8] != [0; 8]
                && self.file.bytes[offset + 16..offset + 20] == [1, 0, 0, 0]
                && (0..5).all(|slot| {
                    let start = offset + 20 + slot * 8;
                    let shape: [u8; 4] = self.file.bytes[start..start + 4].try_into().unwrap();
                    SlotShape::try_from(&shape).is_ok()
                })
        };

        // A structurally valid slot block can be owned by game state that is not
        // represented in the three inventory arrays. Never reclaim it merely
        // because this editor cannot currently resolve a raw inventory reference.
        // New equipment is permitted only in the explicit all-garbage reservation
        // immediately following the parser-confirmed equipment region.
        let after_last_block =
            self.file
                .offsets
                .equipped_gems
                .1
                .checked_add(1)
                .ok_or(Error::CustomError(
                    "ERROR: Equipment-slot boundary overflow.",
                ))?;
        let reservation_offset = after_last_block;
        let reservation_end =
            reservation_offset
                .checked_add(EQUIPMENT_BLOCK_SIZE)
                .ok_or(Error::CustomError(
                    "ERROR: Equipment-slot reservation overflow.",
                ))?;
        if reservation_end > slot_limit
            || !(reservation_offset..reservation_end)
                .all(|offset| self.file.bytes[offset] == is_reservation_byte(offset))
        {
            return Err(Error::CustomError(
                "ERROR: No explicit reserved equipment-slot block is available in this save.",
            ));
        }
        let block_offset = reservation_offset;

        // Use a monotonic code above every structurally valid equipment block and
        // every raw inventory reference, including records the editor cannot parse.
        // The low 23 bits are the suffix; bit 23 belongs to the equipment prefix.
        let mut used_codes: HashSet<u32> =
            referenced_pairs.iter().map(|(first, _)| *first).collect();
        let mut known_pairs = referenced_pairs.clone();
        for offset in
            self.file.offsets.equipped_gems.0..=slot_limit.saturating_sub(EQUIPMENT_BLOCK_SIZE)
        {
            if is_valid_slot_block(offset) {
                let first =
                    u32::from_le_bytes(self.file.bytes[offset..offset + 4].try_into().unwrap());
                let second =
                    u32::from_le_bytes(self.file.bytes[offset + 4..offset + 8].try_into().unwrap());
                used_codes.insert(first);
                known_pairs.insert((first, second));
            }
        }
        let highest_suffix = used_codes
            .iter()
            .filter_map(|code| {
                matches!(*code & EQUIPMENT_PREFIX_MASK, WEAPON_PREFIX | ARMOR_PREFIX)
                    .then_some(*code & EQUIPMENT_SUFFIX_MASK)
            })
            .max()
            .unwrap_or(0);
        let suffix = highest_suffix
            .checked_add(1)
            .filter(|suffix| *suffix != 0 && *suffix <= EQUIPMENT_SUFFIX_MASK)
            .ok_or(Error::CustomError(
                "ERROR: No unique equipment code is available.",
            ))?;
        let prefix = if is_armor {
            ARMOR_PREFIX
        } else {
            WEAPON_PREFIX
        };
        let first_part = prefix | suffix;
        let second_part = if is_armor {
            (id & 0x00FF_FFFF) | 0x1000_0000
        } else {
            id
        };
        if used_codes.contains(&first_part) || known_pairs.contains(&(first_part, second_part)) {
            return Err(Error::CustomError(
                "ERROR: Generated equipment code collides with an existing record.",
            ));
        }

        let username = self.file.offsets.username;
        let counter_offsets = match location {
            Location::Inventory => [
                username + super::constants::USERNAME_TO_FIRST_INVENTORY_COUNTER,
                username + super::constants::USERNAME_TO_SECOND_INVENTORY_COUNTER,
            ],
            Location::Storage => [
                username + super::constants::USERNAME_TO_FIRST_STORAGE_COUNTER,
                username + super::constants::USERNAME_TO_SECOND_STORAGE_COUNTER,
            ],
        };
        let next_counters: Vec<[u8; 4]> = counter_offsets
            .iter()
            .map(|offset| {
                u32::from_le_bytes(self.file.bytes[*offset..*offset + 4].try_into().unwrap())
                    .checked_add(1)
                    .ok_or(Error::CustomError("ERROR: Inventory counter overflow."))
                    .map(u32::to_le_bytes)
            })
            .collect::<Result<_, _>>()?;

        // Armor records require the native safe header value one. Weapon
        // records retain the header of a parsed native weapon of the same hand
        // category, avoiding a fabricated durability/state value.
        let initial_header = if is_armor {
            1u32
        } else {
            self.inventory
                .articles
                .values()
                .chain(self.storage.articles.values())
                .flat_map(|articles| articles.iter())
                .filter(|article| article.article_type == article_type)
                .find_map(|article| {
                    (self.file.offsets.equipped_gems.0
                        ..=slot_limit.saturating_sub(EQUIPMENT_BLOCK_SIZE))
                        .find(|offset| {
                            is_valid_slot_block(*offset)
                                && self.file.bytes[*offset..*offset + 4]
                                    == article.first_part.to_le_bytes()
                                && self.file.bytes[*offset + 4..*offset + 8]
                                    == article.second_part.to_le_bytes()
                        })
                        .map(|offset| {
                            u32::from_le_bytes(
                                self.file.bytes[offset + 8..offset + 12]
                                    .try_into()
                                    .expect("validated equipment header must contain four bytes"),
                            )
                        })
                })
                .ok_or(Error::CustomError(
                    "ERROR: No parsed native weapon template is available for this hand category.",
                ))?
        };

        let closed_shape: [u8; 4] = SlotShape::Closed.into();
        let mut block = [0u8; 60];
        block[0..4].copy_from_slice(&first_part.to_le_bytes());
        block[4..8].copy_from_slice(&second_part.to_le_bytes());
        block[8..12].copy_from_slice(&initial_header.to_le_bytes());
        block[16..20].copy_from_slice(&1u32.to_le_bytes());
        for slot in 0..5 {
            let start = 20 + slot * 8;
            block[start..start + 4].copy_from_slice(&closed_shape);
        }

        self.file.bytes[block_offset..block_offset + 60].copy_from_slice(&block);
        self.file.offsets.equipped_gems.1 =
            self.file.offsets.equipped_gems.1.max(block_offset + 59);
        self.file.bytes[empty_slot..empty_slot + 4].copy_from_slice(&first_part.to_le_bytes());
        self.file.bytes[empty_slot + 4..empty_slot + 8].copy_from_slice(&second_part.to_le_bytes());
        self.file.bytes[empty_slot + 8..empty_slot + 12].copy_from_slice(&1u32.to_le_bytes());
        for (offset, value) in counter_offsets.into_iter().zip(next_counters) {
            self.file.bytes[offset..offset + 4].copy_from_slice(&value);
        }

        let slots = (0..5)
            .map(|index| Slot {
                shape: SlotShape::Closed,
                gem: None,
                index,
            })
            .collect();
        let target_inventory = match location {
            Location::Inventory => &mut self.inventory,
            Location::Storage => &mut self.storage,
        };
        let articles = target_inventory.articles.entry(article_type).or_default();
        let article = Article {
            number: self.file.bytes[empty_slot - 4],
            id,
            first_part,
            second_part,
            amount: 1,
            info,
            article_type,
            type_family,
            slots: Some(slots),
            index: articles.len(),
        };
        articles.push(article.clone());
        Ok(article)
    }

    /// Collects all upgrade identifiers referenced by parsed inventory data and
    /// by raw equipment slots. A record in this set must never be reclaimed.
    fn referenced_upgrade_ids(&self) -> HashSet<u32> {
        let raw_slot_upgrade_ids: HashSet<u32> = (self.file.offsets.upgrades.1.saturating_sub(16)
            ..self.file.offsets.username.saturating_sub(163))
            .flat_map(|offset| {
                let block_id =
                    u64::from_le_bytes(self.file.bytes[offset..offset + 8].try_into().unwrap());
                if block_id == 0 {
                    return Vec::new();
                }
                let mut ids = Vec::new();
                for slot in 0..5 {
                    let start = offset + 20 + slot * 8;
                    let shape: [u8; 4] = self.file.bytes[start..start + 4].try_into().unwrap();
                    match SlotShape::try_from(&shape) {
                        Ok(SlotShape::Closed) => {}
                        Ok(_) => ids.push(u32::from_le_bytes(
                            self.file.bytes[start + 4..start + 8].try_into().unwrap(),
                        )),
                        Err(_) => return Vec::new(),
                    }
                }
                ids
            })
            .collect();

        // Inventory/Storage entries in the file count even if a view missed them.
        let raw_entry_ids: Vec<u32> = [
            self.file.offsets.inventory,
            self.file.offsets.storage,
            self.file.offsets.key_inventory,
        ]
        .into_iter()
        .flat_map(|(start, end)| (start..end).step_by(16))
        .filter_map(|offset| self.file.bytes.get(offset + 4..offset + 8))
        .map(|bytes| u32::from_le_bytes(bytes.try_into().unwrap()))
        .filter(|id| id >> 24 == 0xC0)
        .collect();

        self.inventory
            .upgrades
            .values()
            .chain(self.storage.upgrades.values())
            .flat_map(|entries| entries.iter().map(|upgrade| upgrade.id))
            .chain(raw_slot_upgrade_ids)
            .chain(raw_entry_ids)
            .chain(
                self.inventory
                    .articles
                    .values()
                    .chain(self.storage.articles.values())
                    .flat_map(|entries| entries.iter())
                    .filter_map(|article| article.slots.as_ref())
                    .flat_map(|slots| slots.iter())
                    .filter_map(|slot| slot.gem.as_ref().map(|upgrade| upgrade.id)),
            )
            .collect()
    }

    /// Finds an already-parsed record not referenced from either destination
    /// nor by an equipped slot. This check deliberately does not expand the
    /// fixed upgrade section or write into the following character data.
    fn find_safe_unreferenced_upgrade_offset(&self) -> Option<usize> {
        let referenced_ids = self.referenced_upgrade_ids();
        (self.file.offsets.upgrades.0..self.file.offsets.upgrades.1)
            .step_by(40)
            .find(|offset| {
                let id =
                    u32::from_le_bytes(self.file.bytes[*offset..*offset + 4].try_into().unwrap());
                !referenced_ids.contains(&id)
            })
    }

    /// Reports whether this save has a verified reusable Gem/Rune record.
    /// A false result is a capacity condition, not a recoverable write error.
    pub fn has_safe_reusable_upgrade_record(&self) -> bool {
        self.find_safe_unreferenced_upgrade_offset().is_some()
    }

    pub fn safe_reusable_upgrade_record_count(&self) -> usize {
        let referenced_ids = self.referenced_upgrade_ids();
        (self.file.offsets.upgrades.0..self.file.offsets.upgrades.1)
            .step_by(40)
            .filter(|offset| {
                self.file
                    .bytes
                    .get(*offset..*offset + 4)
                    .and_then(|bytes| bytes.try_into().ok())
                    .map(u32::from_le_bytes)
                    .is_some_and(|id| !referenced_ids.contains(&id))
            })
            .count()
    }

    /// Item id for a new Gem: copied from a Gem of the same shape already in the
    /// save (so the name matches what the player knows), else a known default.
    fn gem_source_for_shape(&self, shape: u8) -> u32 {
        (self.file.offsets.upgrades.0..self.file.offsets.upgrades.1)
            .step_by(40)
            .filter_map(|offset| self.file.bytes.get(offset..offset + 40))
            .find(|record| {
                let source = u32::from_le_bytes(record[4..8].try_into().unwrap());
                record[8] == 0x01
                    && record[12] == shape
                    && source & 0x8000_0000 != 0
                    && !super::upgrades::is_rune_source(source)
                    && !super::upgrades::is_unnamed_gem_source(source)
                    // Plain drop/shop Gem ids only (ids above 1,000,000 are rare variants).
                    && (source & 0x7FFF_FFFF) < 1_000_000
            })
            .map(|record| u32::from_le_bytes(record[4..8].try_into().unwrap()))
            .unwrap_or_else(|| super::upgrades::default_gem_source(shape))
    }

    /// Where a new 40-byte upgrade record can go: right after the Gem/Rune
    /// records (the parser and the game keep them first), taking the place of
    /// the first 8-byte vacancy that follows. Returns (insert at, vacancy, handle).
    fn upgrade_record_slot(&self) -> Result<(usize, usize, u16), Error> {
        let layout = super::ga::scan_for_insertion(&self.file.bytes, self.file.offsets.username)
            .map_err(Error::CustomError)?;
        let insert_at = self.file.offsets.upgrades.1 + 1;
        let vacancy = layout
            .empty
            .filter(|vacancy| *vacancy >= insert_at)
            .ok_or(Error::CustomError("ERROR: The Gem/Rune section is full."))?;
        let handle = layout.max_handle.checked_add(1).ok_or(Error::CustomError(
            "ERROR: No unique upgrade code is available.",
        ))?;
        Ok((insert_at, vacancy, handle))
    }

    /// True when a Gem or Rune can be added: a record nobody uses, or room for a new one.
    pub fn can_add_upgrade(&self) -> bool {
        self.has_safe_reusable_upgrade_record() || self.upgrade_record_slot().is_ok()
    }

    /// How many Gems/Runes can still be added (reusable records + free GA slots).
    pub fn addable_upgrade_count(&self) -> usize {
        let free_slots = self
            .upgrade_record_slot()
            .ok()
            .and_then(|_| {
                super::ga::scan_for_insertion(&self.file.bytes, self.file.offsets.username).ok()
            })
            .map_or(0, |layout| layout.vacancies);
        self.safe_reusable_upgrade_record_count() + free_slots
    }

    /// Copy of the save with a new upgrade record (id written into `record`).
    /// The 40-byte record replaces an 8-byte vacancy, so everything after the
    /// Gem/Rune records moves by 32 bytes and the last 32 bytes of the file
    /// (past every parsed section) are dropped, as for added equipment.
    fn with_new_upgrade_record(&self, record: &mut [u8; 40]) -> Result<SaveData, Error> {
        const GROWTH: usize = 32;
        let (insert_at, vacancy, handle) = self.upgrade_record_slot()?;
        let id = 0xC080_0000 | u32::from(handle);
        let used = |bytes: &[u8]| bytes == id.to_le_bytes();
        let ga_collision = (self.file.offsets.upgrades.0..self.file.offsets.upgrades.1)
            .step_by(40)
            .any(|offset| used(&self.file.bytes[offset..offset + 4]));
        let reference_collision = [
            self.file.offsets.inventory,
            self.file.offsets.storage,
            self.file.offsets.key_inventory,
        ]
        .into_iter()
        .flat_map(|(start, end)| (start..end).step_by(16))
        .any(|offset| {
            self.file
                .bytes
                .get(offset + 4..offset + 8)
                .is_some_and(used)
        });
        if ga_collision || reference_collision {
            return Err(Error::CustomError(
                "ERROR: Generated upgrade code collides with an existing record.",
            ));
        }
        let len = self.file.bytes.len();
        if len < GROWTH || len - GROWTH <= self.file.offsets.lced_offset + 4 {
            return Err(Error::CustomError(
                "ERROR: Save is too short for a new upgrade record.",
            ));
        }
        record[..4].copy_from_slice(&id.to_le_bytes());
        let mut file = self.file.clone();
        file.bytes.drain(vacancy..vacancy + 8);
        file.bytes
            .splice(insert_at..insert_at, record.iter().copied());
        file.bytes.truncate(len);
        file.offsets = super::offsets::Offsets::build(&file.bytes)?;
        if file.offsets.username != self.file.offsets.username + GROWTH
            || file.offsets.upgrades.1 != self.file.offsets.upgrades.1 + 40
        {
            return Err(Error::CustomError(
                "ERROR: Shifted save layout could not be verified.",
            ));
        }
        super::ga::scan_for_insertion(&file.bytes, file.offsets.username)
            .map_err(Error::CustomError)?;
        panic::catch_unwind(AssertUnwindSafe(|| Self::parse_file(file))).map_err(|_| {
            Error::CustomError("ERROR: The new upgrade record could not be reparsed.")
        })?
    }

    /// Experimental direct allocation. A new upgrade is materialized only by
    /// reclaiming an unreferenced 40-byte Upgrade record that already exists
    /// inside the save. This deliberately refuses to grow or shift the opaque
    /// save layout, which would risk overwriting the slot and character blocks.
    pub fn add_direct_upgrade(
        &mut self,
        upgrade_type: UpgradeType,
        shape: String,
        effect_ids: Vec<u32>,
        location: Location,
    ) -> Result<Upgrade, Error> {
        const NO_EFFECT: u32 = u32::MAX;

        if effect_ids.is_empty() || effect_ids[0] == NO_EFFECT {
            return Err(Error::CustomError(
                "ERROR: A direct gem or rune requires a validated primary effect.",
            ));
        }

        let shape_number = match upgrade_type {
            UpgradeType::Gem => match shape.as_str() {
                "Radial" => 0x01,
                "Triangle" => 0x02,
                "Waning" => 0x04,
                "Circle" => 0x08,
                "Droplet" => 0x3F,
                _ => return Err(Error::CustomError("ERROR: Invalid gem shape.")),
            },
            UpgradeType::Rune => match shape.as_str() {
                "-" => 0x01,
                "Oath" => 0x02,
                _ => return Err(Error::CustomError("ERROR: Invalid rune type.")),
            },
        };

        let catalog: &Value = super::catalogs::upgrades();
        let (primary_catalog, fallback_catalog) = match upgrade_type {
            UpgradeType::Gem => (&catalog["gemEffects"], &catalog["runeEffects"]),
            UpgradeType::Rune => (&catalog["runeEffects"], &catalog["gemEffects"]),
        };

        let mut normalized_effects = effect_ids;
        normalized_effects.truncate(6);
        normalized_effects.resize(6, NO_EFFECT);

        let mut effects = Vec::with_capacity(6);
        let mut first_info: Option<UpgradeInfo> = None;
        for effect_id in normalized_effects.iter().copied() {
            if effect_id == NO_EFFECT {
                effects.push((NO_EFFECT, String::from("No Effect")));
                continue;
            }

            let key = effect_id.to_string();
            let definition = if !primary_catalog[&key].is_null() {
                primary_catalog[&key].clone()
            } else {
                fallback_catalog[&key].clone()
            };
            let effect_info: UpgradeInfo = serde_json::from_value(definition).map_err(|_| {
                Error::CustomError("ERROR: The requested direct-upgrade effect is not validated.")
            })?;
            if first_info.is_none() {
                first_info = Some(effect_info.clone());
            }
            effects.push((effect_id, effect_info.effect));
        }
        let info = first_info.ok_or(Error::CustomError(
            "ERROR: A direct gem or rune requires a validated primary effect.",
        ))?;

        let source = match upgrade_type {
            // Runes may carry Gem effects (the game accepts them): the item id comes
            // from the first rune effect, or the Moon rune when there is none.
            UpgradeType::Rune => normalized_effects
                .iter()
                .find_map(|effect| super::upgrades::rune_source_for_effect(*effect))
                .unwrap_or(0x8000_0000 | 100_001),
            UpgradeType::Gem => self.gem_source_for_shape(shape_number),
        };

        self.file
            .find_inv_empty_slot(location)
            .ok_or(Error::CustomError(
                "ERROR: The destination inventory has no safe reusable slot.",
            ))?;

        let mut record = [0u8; 40];
        record[4..8].copy_from_slice(&source.to_le_bytes());
        record[8] = match upgrade_type {
            UpgradeType::Gem => 0x01,
            UpgradeType::Rune => 0x02,
        };
        record[12] = shape_number;
        for (index, effect_id) in normalized_effects.iter().enumerate() {
            record[16 + index * 4..20 + index * 4].copy_from_slice(&effect_id.to_le_bytes());
        }

        // 1. Reuse a record nothing points to. 2. Otherwise give the record its own
        // GA slot, the way equipment is added.
        let mut candidate = match self.find_safe_unreferenced_upgrade_offset() {
            Some(offset) => {
                let mut candidate = self.clone();
                record[..4].copy_from_slice(&candidate.file.bytes[offset..offset + 4]);
                candidate.file.bytes[offset..offset + 40].copy_from_slice(&record);
                candidate
            }
            None => self.with_new_upgrade_record(&mut record)?,
        };
        let id = u32::from_le_bytes(record[..4].try_into().unwrap());

        let upgrade = Upgrade {
            number: 0,
            id,
            source,
            upgrade_type,
            shape,
            effects,
            info,
            index: 0,
        };
        let is_storage = location == Location::Storage;
        match location {
            Location::Inventory => {
                candidate
                    .inventory
                    .add_upgrade(&mut candidate.file, upgrade, false)?
            }
            Location::Storage => {
                candidate
                    .storage
                    .add_upgrade(&mut candidate.file, upgrade, is_storage)?
            }
        };

        // Commit only a save that reparses with the new upgrade in its destination.
        let file = candidate.file.clone();
        let reparsed = panic::catch_unwind(AssertUnwindSafe(|| Self::parse_file(file)))
            .map_err(|_| Error::CustomError("ERROR: Direct upgrade insertion failed."))??;
        reparsed.validate_game_load_safety()?;
        let inserted = match location {
            Location::Inventory => &reparsed.inventory,
            Location::Storage => &reparsed.storage,
        }
        .upgrades
        .get(&upgrade_type)
        .and_then(|entries| entries.iter().find(|entry| entry.id == id))
        .cloned()
        .ok_or(Error::CustomError(
            "ERROR: Direct upgrade insertion failed.",
        ))?;
        *self = reparsed;

        Ok(inserted)
    }

    pub fn transform_upgrade(
        &mut self,
        upgrade_type: UpgradeType,
        upgrade_index: usize,
        location: Location,
    ) -> Result<Upgrade, Error> {
        let (inventory, file) = match location {
            Location::Inventory => (&mut self.inventory, &mut self.file),
            Location::Storage => (&mut self.storage, &mut self.file),
        };

        let source_upgrades =
            inventory
                .upgrades
                .get_mut(&upgrade_type)
                .ok_or(Error::CustomError(
                    "The selected upgrade type was not found.",
                ))?;
        let upgrade = source_upgrades
            .get_mut(upgrade_index)
            .ok_or(Error::CustomError("The selected upgrade was not found."))?;

        upgrade.transform(file)?;
        let destination_type = upgrade.upgrade_type;
        let mut transformed = source_upgrades.remove(upgrade_index);
        for (index, entry) in source_upgrades.iter_mut().enumerate() {
            entry.index = index;
        }

        let destination_upgrades = inventory.upgrades.entry(destination_type).or_default();
        transformed.index = destination_upgrades.len();
        destination_upgrades.push(transformed.clone());

        Ok(transformed)
    }

    /// Raises every reinforceable weapon of Inventory or Storage below `level` to
    /// `level` (F8). Weapons without reinforced versions are skipped. Callers
    /// run this on a copy of the save. Returns (upgraded, skipped).
    /// Opens every closed Gem slot of the weapons of one container with
    /// `shape`. Returns (weapons changed, slots opened).
    /// Opens the closed Gem slots among the first `count` slots (1 to 5) of
    /// every weapon. Slots after `count` stay as they are.
    pub fn open_all_weapon_slots(
        &mut self,
        is_storage: bool,
        shape: SlotShape,
        count: usize,
    ) -> Result<(usize, usize), Error> {
        let count = count.clamp(1, MAX_WEAPON_GEM_SLOTS);
        if shape == SlotShape::Closed {
            return Err(Error::CustomError(
                "ERROR: Choose a shape to open the slots.",
            ));
        }
        let (file, container) = if is_storage {
            (&mut self.file, &mut self.storage)
        } else {
            (&mut self.file, &mut self.inventory)
        };
        let (mut weapons, mut slots) = (0, 0);
        for weapon_type in [ArticleType::RightHand, ArticleType::LeftHand] {
            let Some(articles) = container.articles.get_mut(&weapon_type) else {
                continue;
            };
            for article in articles.iter_mut() {
                let closed: Vec<usize> = article
                    .slots
                    .as_ref()
                    .map(|list| {
                        list.iter()
                            .enumerate()
                            .take(count)
                            .filter(|(_, slot)| slot.shape == SlotShape::Closed)
                            .map(|(index, _)| index)
                            .collect()
                    })
                    .unwrap_or_default();
                for &index in &closed {
                    article.change_slot_shape(file, index, shape)?;
                }
                if !closed.is_empty() {
                    weapons += 1;
                    slots += closed.len();
                }
            }
        }
        Ok((weapons, slots))
    }

    /// Sets Blood Vials and Quicksilver Bullets to the game limits: 20 each
    /// carried, 600 each in Storage. Items the container lacks are added.
    /// Returns the number of stacks changed.
    pub fn refill_vials_and_bullets(&mut self, is_storage: bool) -> Result<usize, Error> {
        const BLOOD_VIAL: u32 = 1000;
        const QUICKSILVER_BULLETS: u32 = 900;
        let limit = if is_storage { 600 } else { 20 };
        let (file, container) = if is_storage {
            (&mut self.file, &mut self.storage)
        } else {
            (&mut self.file, &mut self.inventory)
        };
        let mut changed = 0;
        for id in [BLOOD_VIAL, QUICKSILVER_BULLETS] {
            let existing = container
                .articles
                .get(&ArticleType::Consumable)
                .and_then(|items| items.iter().find(|item| item.id == id))
                .map(|item| (item.number, item.amount));
            match existing {
                Some((_, amount)) if amount == limit => {}
                Some((number, _)) => {
                    container.edit_item(file, number, id, limit, is_storage)?;
                    changed += 1;
                }
                None => {
                    container.add_item(file, id, limit, is_storage)?;
                    changed += 1;
                }
            }
        }
        Ok(changed)
    }

    /// Infinite Blood Vials and Quicksilver Bullets, as found in a player's
    /// save: the carried stacks get the bare item code 0xB0000000 instead of
    /// 0xB0000000 | id, and the game no longer counts their use. `enable`
    /// false writes the normal code back. Inventory only; returns the stacks
    /// changed. Missing stacks are added (20) first.
    pub fn set_infinite_consumables(&mut self, enable: bool) -> Result<usize, Error> {
        const BARE_CODE: u32 = 0xB000_0000;
        let (file, container) = (&mut self.file, &mut self.inventory);
        let mut changed = 0;
        for id in INFINITE_CONSUMABLES {
            let present = container
                .articles
                .get(&ArticleType::Consumable)
                .is_some_and(|items| items.iter().any(|item| item.id == id));
            if !present {
                if !enable {
                    continue;
                }
                container.add_item(file, id, 20, false)?;
            }
            let item = container
                .articles
                .get_mut(&ArticleType::Consumable)
                .and_then(|items| items.iter_mut().find(|item| item.id == id))
                .ok_or(Error::CustomError(
                    "ERROR: The consumable could not be found.",
                ))?;
            let code = if enable { BARE_CODE } else { BARE_CODE | id };
            if item.first_part == code {
                continue;
            }
            let offset = file
                .find_article_offset(item.number, id, TypeFamily::Item, false)
                .ok_or(Error::CustomError(
                    "ERROR: The consumable could not be found.",
                ))?;
            file.bytes[offset + 4..offset + 8].copy_from_slice(&code.to_le_bytes());
            item.first_part = code;
            changed += 1;
        }
        Ok(changed)
    }

    /// True when the carried Blood Vials and Quicksilver Bullets are infinite.
    #[cfg(test)]
    pub fn infinite_consumables(&self) -> bool {
        INFINITE_CONSUMABLES.iter().all(|id| {
            self.inventory
                .articles
                .get(&ArticleType::Consumable)
                .and_then(|items| items.iter().find(|item| item.id == *id))
                .is_some_and(|item| item.first_part == 0xB000_0000)
        })
    }

    pub fn upgrade_all_weapons(
        &mut self,
        is_storage: bool,
        level: u8,
    ) -> Result<(usize, usize), Error> {
        let container = if is_storage {
            &mut self.storage
        } else {
            &mut self.inventory
        };
        let (mut upgraded, mut skipped) = (0, 0);
        for article_type in [
            super::enums::ArticleType::RightHand,
            super::enums::ArticleType::LeftHand,
        ] {
            let count = container.articles.get(&article_type).map_or(0, Vec::len);
            for index in 0..count {
                let second_part = container.articles[&article_type][index].second_part;
                if !super::inventory::weapon_is_upgradable(second_part) {
                    skipped += 1;
                    continue;
                }
                if ((second_part % 10_000) / 100) as u8 >= level {
                    continue;
                }
                container.change_weapon_level(
                    &mut self.file,
                    article_type,
                    index,
                    0,
                    is_storage,
                    level,
                )?;
                upgraded += 1;
            }
        }
        Ok((upgraded, skipped))
    }

    /// Moves several Gems or Runes between Inventory and Storage (F6).
    /// Indices refer to the source list; they are processed from the highest so
    /// earlier indices stay valid. Callers run this on a copy of the save.
    pub fn move_upgrades(
        &mut self,
        upgrade_type: UpgradeType,
        mut indices: Vec<usize>,
        from: Location,
    ) -> Result<usize, Error> {
        indices.sort_unstable_by(|a, b| b.cmp(a));
        indices.dedup();
        let destination = match from {
            Location::Inventory => Location::Storage,
            Location::Storage => Location::Inventory,
        };
        if indices.is_empty() {
            return Ok(0);
        }
        if self.file.count_inv_empty_slots(destination) < indices.len() {
            return Err(Error::CustomError(
                "ERROR: Not enough free slots at the destination.",
            ));
        }
        for &index in &indices {
            self.move_upgrade(upgrade_type, index, from)?;
        }
        Ok(indices.len())
    }

    pub fn move_upgrade(
        &mut self,
        upgrade_type: UpgradeType,
        upgrade_index: usize,
        from: Location,
    ) -> Result<(), Error> {
        let destination = match from {
            Location::Inventory => Location::Storage,
            Location::Storage => Location::Inventory,
        };
        self.file
            .find_inv_empty_slot(destination)
            .ok_or(Error::CustomError(
                "ERROR: The destination inventory has no safe reusable slot.",
            ))?;

        match from {
            Location::Inventory => {
                let upgrade = self.inventory.remove_upgrade(
                    &mut self.file,
                    upgrade_type,
                    upgrade_index,
                    false,
                )?;
                self.storage.add_upgrade(&mut self.file, upgrade, true)?;
            }
            Location::Storage => {
                let upgrade = self.storage.remove_upgrade(
                    &mut self.file,
                    upgrade_type,
                    upgrade_index,
                    true,
                )?;
                self.inventory.add_upgrade(&mut self.file, upgrade, false)?;
            }
        };
        Ok(())
    }
}

#[cfg(test)]
#[path = "save_tests.rs"]
mod save_tests;
