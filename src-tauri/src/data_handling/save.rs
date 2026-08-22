use serde::{Deserialize, Serialize};

use crate::data_handling::position::Pos;
use serde_json::Value;
use std::{collections::HashSet, path::PathBuf};

use super::{
    article::Article,
    bosses::{self, Boss},
    enums::{ArticleType, Error, Location, SlotShape, TypeFamily, UpgradeType},
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
}

impl SaveData {
    pub fn build(save_path: &str, resources_path: PathBuf) -> Result<SaveData, Error> {
        let mut file = FileData::build(save_path, resources_path)?;
        let stats = stats::new(&file).unwrap();
        let bosses = bosses::new(&file).unwrap();
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
        let username = Username::build(&file);
        let playtime = file.get_playtime();
        let position = Pos::new(&file).unwrap();

        Ok(SaveData {
            file,
            stats,
            inventory,
            storage,
            username,
            bosses,
            playtime,
            position,
        })
    }

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

    /// Experimental direct allocation for weapons and armor. The operation
    /// consumes only a fixed inventory slot and a verified 60-byte garbage
    /// reservation in the equipment-slot area; it never shifts save data.
    pub fn add_direct_equipment(&mut self, id: u32, is_armor: bool) -> Result<Article, Error> {
        let empty_slot =
            self.file
                .find_inv_empty_slot(Location::Inventory)
                .ok_or(Error::CustomError(
                    "ERROR: No free inventory slot is available.",
                ))?;

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

        const EQUIPMENT_BLOCK_SIZE: usize = 60;
        const EQUIPMENT_RESERVATION_SIZE: usize = 64;
        const EQUIPMENT_PREFIX_MASK: u32 = 0xFF80_0000;
        const EQUIPMENT_SUFFIX_MASK: u32 = 0x007F_FFFF;
        const WEAPON_PREFIX: u32 = 0x8080_0000;
        const ARMOR_PREFIX: u32 = 0x9080_0000;

        let reserved_block = [0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF];
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
        let reservation_offset = after_last_block
            .checked_add(7)
            .map(|offset| offset & !7)
            .ok_or(Error::CustomError(
                "ERROR: Equipment-slot reservation alignment overflow.",
            ))?;
        let reservation_end = reservation_offset
            .checked_add(EQUIPMENT_RESERVATION_SIZE)
            .ok_or(Error::CustomError(
                "ERROR: Equipment-slot reservation overflow.",
            ))?;
        if reservation_end > slot_limit
            || !(0..(EQUIPMENT_RESERVATION_SIZE / reserved_block.len())).all(|block| {
                self.file.bytes[reservation_offset + block * reserved_block.len()
                    ..reservation_offset + (block + 1) * reserved_block.len()]
                    == reserved_block
            })
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
        let counter_offsets = [
            username + super::constants::USERNAME_TO_FIRST_INVENTORY_COUNTER,
            username + super::constants::USERNAME_TO_SECOND_INVENTORY_COUNTER,
        ];
        let next_counters: Vec<[u8; 4]> = counter_offsets
            .iter()
            .map(|offset| {
                u32::from_le_bytes(self.file.bytes[*offset..*offset + 4].try_into().unwrap())
                    .checked_add(1)
                    .ok_or(Error::CustomError("ERROR: Inventory counter overflow."))
                    .map(u32::to_le_bytes)
            })
            .collect::<Result<_, _>>()?;

        let closed_shape: [u8; 4] = SlotShape::Closed.into();
        let mut block = [0u8; 60];
        block[0..4].copy_from_slice(&first_part.to_le_bytes());
        block[4..8].copy_from_slice(&second_part.to_le_bytes());
        block[8..12].copy_from_slice(&250u32.to_le_bytes());
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
        let articles = self.inventory.articles.entry(article_type).or_default();
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

        let catalog: Value = serde_json::from_str(include_str!("../../resources/upgrades.json"))
            .map_err(|_| Error::CustomError("ERROR: Failed to read the effect catalog."))?;
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
        let referenced_ids: HashSet<u32> = self
            .inventory
            .upgrades
            .values()
            .chain(self.storage.upgrades.values())
            .flat_map(|entries| entries.iter().map(|upgrade| upgrade.id))
            .chain(raw_slot_upgrade_ids)
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
            .collect();
        let mut available_offset = None;
        for offset in (self.file.offsets.upgrades.0..self.file.offsets.upgrades.1).step_by(40) {
            let id = u32::from_le_bytes(self.file.bytes[offset..offset + 4].try_into().unwrap());
            if !referenced_ids.contains(&id) {
                available_offset = Some(offset);
                break;
            }
        }
        let offset = available_offset.ok_or(Error::CustomError(
            "ERROR: No safe unreferenced gem or rune record is available. Create a slot in-game or use the [CUT] workflow.",
        ))?;

        let id = u32::from_le_bytes(self.file.bytes[offset..offset + 4].try_into().unwrap());
        let source =
            u32::from_le_bytes(self.file.bytes[offset + 4..offset + 8].try_into().unwrap());
        self.file.bytes[offset + 8] = match upgrade_type {
            UpgradeType::Gem => 0x01,
            UpgradeType::Rune => 0x02,
        };
        self.file.bytes[offset + 9..offset + 16].fill(0);
        self.file.bytes[offset + 12] = shape_number;
        for (index, effect_id) in normalized_effects.iter().enumerate() {
            let start = offset + 16 + index * 4;
            self.file.bytes[start..start + 4].copy_from_slice(&effect_id.to_le_bytes());
        }

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
        match location {
            Location::Inventory => self.inventory.add_upgrade(&mut self.file, upgrade, false),
            Location::Storage => self.storage.add_upgrade(&mut self.file, upgrade, true),
        }

        let inserted = match location {
            Location::Inventory => self.inventory.upgrades.get(&upgrade_type),
            Location::Storage => self.storage.upgrades.get(&upgrade_type),
        }
        .and_then(|entries| entries.last())
        .cloned()
        .ok_or(Error::CustomError(
            "ERROR: Direct upgrade insertion failed.",
        ))?;

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

    #[cfg_attr(not(test), allow(dead_code))]
    pub fn move_upgrade(
        &mut self,
        upgrade_type: UpgradeType,
        upgrade_index: usize,
        from: Location,
    ) -> Result<(), Error> {
        match from {
            Location::Inventory => {
                let upgrade = self.inventory.remove_upgrade(
                    &mut self.file,
                    upgrade_type,
                    upgrade_index,
                    false,
                )?;
                self.storage.add_upgrade(&mut self.file, upgrade, true);
            }
            Location::Storage => {
                let upgrade = self.storage.remove_upgrade(
                    &mut self.file,
                    upgrade_type,
                    upgrade_index,
                    true,
                )?;
                self.inventory.add_upgrade(&mut self.file, upgrade, false);
            }
        };
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::{path::PathBuf, time::Instant};

    use super::*;
    use crate::data_handling::{
        enums::SlotShape,
        utils::test_utils::{build_save_data, check_bytes},
    };

    fn reserve_equipment_blocks(save: &mut SaveData, count: usize) -> usize {
        const RESERVATION: [u8; 8] = [0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF];
        const RESERVATION_SIZE: usize = 64;
        let start = (save.file.offsets.equipped_gems.1 + 8) & !7;
        let end = start + count * RESERVATION_SIZE;
        assert!(end <= save.file.offsets.username - 147);
        for offset in (start..end).step_by(RESERVATION.len()) {
            save.file.bytes[offset..offset + RESERVATION.len()].copy_from_slice(&RESERVATION);
        }
        start
    }

    #[test]
    fn direct_upgrade_reclaims_only_an_orphaned_record() {
        let mut save = build_save_data("testsave9");
        let original = save
            .inventory
            .upgrades
            .get(&UpgradeType::Rune)
            .and_then(|runes| runes.first())
            .cloned()
            .expect("test save must contain a free rune");
        let initial_file = save.file.clone();

        assert!(save
            .add_direct_upgrade(
                UpgradeType::Rune,
                "-".to_string(),
                Vec::new(),
                Location::Inventory,
            )
            .is_err());
        assert_eq!(save.file, initial_file);

        let runes = save.inventory.upgrades.get_mut(&UpgradeType::Rune).unwrap();
        runes.remove(0);
        for (index, rune) in runes.iter_mut().enumerate() {
            rune.index = index;
        }

        let added = save
            .add_direct_upgrade(
                UpgradeType::Rune,
                "-".to_string(),
                vec![1_100_000],
                Location::Inventory,
            )
            .expect("an orphaned record must be reusable");
        assert_eq!(added.id, original.id);
        assert_eq!(added.upgrade_type, UpgradeType::Rune);
        assert_eq!(added.shape, "-");
        assert_eq!(added.effects[0].0, 1_100_000);

        let mut parsed = parse_upgrades(&save.file);
        let mut slots = parse_equipped_gems(&mut save.file, &mut parsed);
        let rebuilt = Inventory::build(
            &save.file,
            save.file.offsets.inventory,
            save.file.offsets.key_inventory,
            &mut parsed,
            &mut slots,
        );
        assert!(rebuilt
            .upgrades
            .get(&UpgradeType::Rune)
            .is_some_and(|runes| runes.iter().any(|rune| rune.id == added.id)));
    }

    #[test]
    fn direct_equipment_uses_explicit_reserved_slot_block() {
        let mut save = build_save_data("testsave9");
        let original = save
            .inventory
            .articles
            .get(&ArticleType::RightHand)
            .and_then(|weapons| weapons.first())
            .cloned()
            .expect("test save must contain a right-hand weapon");
        let original_block_offset = (save.file.offsets.equipped_gems.0
            ..save.file.offsets.username - 147)
            .find(|offset| {
                save.file.bytes[*offset..*offset + 4] == original.first_part.to_le_bytes()
                    && save.file.bytes[*offset + 4..*offset + 8]
                        == original.second_part.to_le_bytes()
            })
            .expect("weapon slot block must exist");
        let original_block =
            save.file.bytes[original_block_offset..original_block_offset + 60].to_vec();
        let reserved_offset = reserve_equipment_blocks(&mut save, 1);

        let added = save
            .add_direct_equipment(original.id, false)
            .expect("an explicit reservation must be reusable");
        assert_eq!(added.id, original.id);
        assert_eq!(added.type_family, TypeFamily::Weapon);
        assert_eq!(added.slots.as_ref().map(Vec::len), Some(5));
        assert_eq!(
            save.file.bytes[original_block_offset..original_block_offset + 60],
            original_block
        );
        assert_eq!(
            u32::from_le_bytes(
                save.file.bytes[reserved_offset..reserved_offset + 4]
                    .try_into()
                    .unwrap()
            ),
            added.first_part
        );

        let mut parsed = parse_upgrades(&save.file);
        let mut slots = parse_equipped_gems(&mut save.file, &mut parsed);
        let rebuilt = Inventory::build(
            &save.file,
            save.file.offsets.inventory,
            save.file.offsets.key_inventory,
            &mut parsed,
            &mut slots,
        );
        assert!(rebuilt
            .articles
            .get(&ArticleType::RightHand)
            .is_some_and(|weapons| weapons
                .iter()
                .any(|weapon| weapon.first_part == added.first_part
                    && weapon.slots.as_ref().map(Vec::len) == Some(5))));
    }

    #[test]
    fn direct_armor_uses_explicit_reserved_slot_block() {
        let mut save = build_save_data("testsave9");
        let original = save
            .inventory
            .articles
            .get(&ArticleType::Armor)
            .and_then(|armors| armors.first())
            .cloned()
            .expect("test save must contain armor");
        let reserved_offset = reserve_equipment_blocks(&mut save, 1);

        let added = save
            .add_direct_equipment(original.id, true)
            .expect("an explicit reservation must be reusable");
        assert_eq!(added.id, original.id);
        assert_eq!(added.type_family, TypeFamily::Armor);
        assert_eq!(added.second_part & 0xFF00_0000, 0x1000_0000);
        assert_eq!(added.slots.as_ref().map(Vec::len), Some(5));
        assert_eq!(
            u32::from_le_bytes(
                save.file.bytes[reserved_offset..reserved_offset + 4]
                    .try_into()
                    .unwrap()
            ),
            added.first_part
        );

        let mut parsed = parse_upgrades(&save.file);
        let mut slots = parse_equipped_gems(&mut save.file, &mut parsed);
        let rebuilt = Inventory::build(
            &save.file,
            save.file.offsets.inventory,
            save.file.offsets.key_inventory,
            &mut parsed,
            &mut slots,
        );
        assert!(rebuilt
            .articles
            .get(&ArticleType::Armor)
            .is_some_and(|armors| armors
                .iter()
                .any(|armor| armor.first_part == added.first_part
                    && armor.slots.as_ref().map(Vec::len) == Some(5))));
    }

    #[test]
    fn direct_equipment_preserves_raw_inventory_slot_references() {
        let mut save = build_save_data("testsave9");
        let original = save
            .inventory
            .articles
            .get(&ArticleType::RightHand)
            .and_then(|weapons| weapons.first())
            .cloned()
            .expect("test save must contain a right-hand weapon");
        let record_offset = save
            .file
            .find_article_offset(original.number, original.id, TypeFamily::Weapon, false)
            .expect("weapon record must exist");
        let block_limit = save.file.offsets.username - 147;
        let block_offset = (save.file.offsets.equipped_gems.0..block_limit)
            .find(|offset| {
                save.file.bytes[*offset..*offset + 4] == original.first_part.to_le_bytes()
                    && save.file.bytes[*offset + 4..*offset + 8]
                        == original.second_part.to_le_bytes()
            })
            .expect("weapon slot block must exist");
        let original_block = save.file.bytes[block_offset..block_offset + 60].to_vec();
        let original_record = save.file.bytes[record_offset + 4..record_offset + 12].to_vec();

        // Simulate an entry the editor currently cannot parse while keeping its
        // raw inventory record intact. The allocator must still treat the slot
        // block as owned and never overwrite it.
        let weapons = save
            .inventory
            .articles
            .get_mut(&ArticleType::RightHand)
            .expect("weapon category must exist");
        weapons.remove(0);
        for (index, weapon) in weapons.iter_mut().enumerate() {
            weapon.index = index;
        }

        let _ = save.add_direct_equipment(original.id, false);

        assert_eq!(
            save.file.bytes[block_offset..block_offset + 60],
            original_block
        );
        assert_eq!(
            save.file.bytes[record_offset + 4..record_offset + 12],
            original_record
        );
    }

    #[test]
    fn test_build() {
        assert!(SaveData::build("saves/testsave0", PathBuf::from("resources")).is_ok());
    }

    #[test]
    fn test_get_slot_mut() {
        //Inventory
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();
        let articles = save.inventory.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.get(0).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.get(0).unwrap();
        let slot2 = save
            .get_slot_mut(Location::Inventory, ArticleType::RightHand, 0, 0)
            .unwrap();
        assert_eq!(*slot1, *slot2);
        assert_eq!(slot1.shape, SlotShape::Droplet);

        slot2.shape = SlotShape::Triangle;

        let articles = save.inventory.articles;
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.get(0).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.get(0).unwrap();
        assert_eq!(slot1.shape, SlotShape::Triangle);

        //Storage
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();
        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article = articles_of_type.get(0).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.get(0).unwrap();
        let slot2 = save
            .get_slot_mut(Location::Storage, ArticleType::Armor, 0, 0)
            .unwrap();
        assert_eq!(*slot1, *slot2);
        assert_eq!(slot1.shape, SlotShape::Closed);

        slot2.shape = SlotShape::Waning;

        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article = articles_of_type.get(0).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.get(0).unwrap();
        assert_eq!(slot1.shape, SlotShape::Waning);

        //Not found
        assert!(save
            .get_slot_mut(Location::Storage, ArticleType::Chalice, 0, 0)
            .is_none());
        assert!(save
            .get_slot_mut(Location::Storage, ArticleType::Armor, usize::MAX, 0)
            .is_none());
        assert!(save
            .get_slot_mut(Location::Storage, ArticleType::Armor, 0, usize::MAX)
            .is_none());
    }

    #[test]
    fn test_get_article_mut() {
        //Inventory
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();
        let articles = save.inventory.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article1 = articles_of_type.get(0).unwrap();
        let article2 = save
            .get_article_mut(Location::Inventory, ArticleType::RightHand, 0)
            .unwrap();
        assert_eq!(*article1, *article2);
        assert_eq!(article1.id, 28001000);

        article2.id = 0;

        let articles = save.inventory.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article1 = articles_of_type.get(0).unwrap();
        assert_eq!(article1.id, 0);

        //Storage
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();
        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article1 = articles_of_type.get(0).unwrap();
        let article2 = save
            .get_article_mut(Location::Storage, ArticleType::Armor, 0)
            .unwrap();
        assert_eq!(*article1, *article2);
        assert_eq!(article1.id, 351000);

        article2.id = 0;

        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article1 = articles_of_type.get(0).unwrap();
        assert_eq!(article1.id, 0);

        //Not found
        assert!(save
            .get_article_mut(Location::Storage, ArticleType::Chalice, 0)
            .is_none());
        assert!(save
            .get_article_mut(Location::Storage, ArticleType::Armor, usize::MAX)
            .is_none());
    }

    #[test]
    fn test_get_equipped_upgrade_mut() {
        //Inventory
        let mut save = SaveData::build("saves/testsave8", PathBuf::from("resources")).unwrap();
        let articles = save.inventory.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.get(0).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot = slots.get(0).unwrap();
        let gem1 = slot.gem.as_ref().unwrap();
        let gem2 = save
            .get_equipped_upgrade_mut(Location::Inventory, ArticleType::RightHand, 0, 0)
            .unwrap();
        assert_eq!(*gem1, *gem2);
        assert_eq!(gem1.id, 3229615259);

        gem2.id = 0;

        let articles = save.inventory.articles;
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.get(0).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot = slots.get(0).unwrap();
        let gem1 = slot.gem.as_ref().unwrap();
        assert_eq!(gem1.id, 0);

        //Storage
        let mut save = SaveData::build("saves/testsave8", PathBuf::from("resources")).unwrap();
        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.get(17).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot = slots.get(0).unwrap();
        let gem1 = slot.gem.as_ref().unwrap();
        let gem2 = save
            .get_equipped_upgrade_mut(Location::Storage, ArticleType::RightHand, 17, 0)
            .unwrap();
        assert_eq!(*gem1, *gem2);
        assert_eq!(gem1.id, 3229614569);

        gem2.id = 0;

        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.get(17).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot = slots.get(0).unwrap();
        let gem1 = slot.gem.as_ref().unwrap();
        assert_eq!(gem1.id, 0);

        //Not found
        assert!(save
            .get_equipped_upgrade_mut(Location::Storage, ArticleType::Chalice, 0, 0)
            .is_none());
        assert!(save
            .get_equipped_upgrade_mut(Location::Storage, ArticleType::Armor, usize::MAX, 0)
            .is_none());
        assert!(save
            .get_equipped_upgrade_mut(Location::Storage, ArticleType::Armor, 0, usize::MAX)
            .is_none());
    }

    #[test]
    fn test_get_upgrade_mut() {
        //Inventory
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();
        let upgrades = save.inventory.upgrades.clone();
        let upgrades_of_type = upgrades.get(&UpgradeType::Rune).unwrap();
        let upgrade1 = upgrades_of_type.get(0).unwrap();
        let upgrade2 = save
            .get_upgrade_mut(Location::Inventory, UpgradeType::Rune, 0)
            .unwrap();
        assert_eq!(*upgrade1, *upgrade2);
        assert_eq!(upgrade1.id, 3229614361);

        upgrade2.id = 0;

        let upgrades = save.inventory.upgrades.clone();
        let upgrades_of_type = upgrades.get(&UpgradeType::Rune).unwrap();
        let upgrade1 = upgrades_of_type.get(0).unwrap();
        assert_eq!(upgrade1.id, 0);

        //Storage
        let mut save = SaveData::build("saves/testsave9", PathBuf::from("resources")).unwrap();
        let upgrades = save.storage.upgrades.clone();
        let upgrades_of_type = upgrades.get(&UpgradeType::Gem).unwrap();
        let upgrade1 = upgrades_of_type.get(0).unwrap();
        let upgrade2 = save
            .get_upgrade_mut(Location::Storage, UpgradeType::Gem, 0)
            .unwrap();
        assert_eq!(*upgrade1, *upgrade2);
        assert_eq!(upgrade1.id, 3229614193);

        upgrade2.id = 0;

        let upgrades = save.storage.upgrades.clone();
        let upgrades_of_type = upgrades.get(&UpgradeType::Gem).unwrap();
        let upgrade1 = upgrades_of_type.get(0).unwrap();
        assert_eq!(upgrade1.id, 0);

        //Not found
        assert!(save
            .get_upgrade_mut(Location::Storage, UpgradeType::Rune, 0)
            .is_none());
        assert!(save
            .get_upgrade_mut(Location::Storage, UpgradeType::Gem, usize::MAX)
            .is_none());
    }

    #[test]
    #[ignore] //cargo test -- --include-ignored
    fn test_save_data_get_muts_runtime() {
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();

        //Test get_slot_mut() runtime
        let now = Instant::now();
        save.get_slot_mut(Location::Inventory, ArticleType::RightHand, 0, 0)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(elapsed < 10);

        //Test get_article_mut() runtime
        let now = Instant::now();
        save.get_article_mut(Location::Inventory, ArticleType::RightHand, 0)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(elapsed < 10);

        //Test get_equipped_upgrade_mut() runtime
        let now = Instant::now();
        save.get_equipped_upgrade_mut(Location::Inventory, ArticleType::RightHand, 0, 3)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(elapsed < 10);

        //Test get_upgrade_mut() runtime
        let now = Instant::now();
        save.get_upgrade_mut(Location::Inventory, UpgradeType::Rune, 0)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(elapsed < 10);
    }

    #[test]
    fn test_move_upgrade() {
        let mut save = build_save_data("testsave9");

        //Test error cases
        let result = save.move_upgrade(UpgradeType::Rune, 500, Location::Storage);
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Save error: ERROR: There are no upgrades of the specified type."
            );
        }

        let result = save.move_upgrade(UpgradeType::Gem, 500, Location::Storage);
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Save error: ERROR: upgrade_index is invalid."
            );
        }

        //The inventory has 2 gems
        assert_eq!(
            save.inventory
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            2
        );
        //The storage has 2 gems
        assert_eq!(
            save.storage
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            2
        );
        //Get the gem to be moved
        let gem = save.inventory.upgrades.get_mut(&UpgradeType::Gem).unwrap()[0].clone();
        //Slot of the inventory with the gem
        assert!(check_bytes(
            &save.file,
            0x8fe8,
            &[
                0x51, 0x40, 0x89, 0x13, 0x73, 0x00, 0x80, 0xc0, 0xf0, 0x49, 0x02, 0x80, 0x01, 0x00,
                0x00, 0x00
            ]
        ));
        //Last slot of the storage
        assert!(check_bytes(
            &save.file,
            0x11524,
            &[
                0x69, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00,
                0x00, 0x00
            ]
        ));

        //Move the gem
        save.move_upgrade(UpgradeType::Gem, 0, Location::Inventory)
            .unwrap();

        //The inventory now has 1 gem
        assert_eq!(
            save.inventory
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            1
        );
        //The storage now has 3 gems
        assert_eq!(
            save.storage
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            3
        );
        //Get the moved gem
        let mut moved_gem = save
            .storage
            .upgrades
            .get_mut(&UpgradeType::Gem)
            .unwrap()
            .last_mut()
            .unwrap()
            .clone();
        assert_eq!(moved_gem.index, 2);
        moved_gem.index = 0;
        assert_eq!(gem, moved_gem);
        //Now the inventory slot in which the gem was is empty
        assert!(check_bytes(
            &save.file,
            0x8fe8,
            &[0x51, 0x40, 0x89, 0x13, 0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0]
        ));
        //And the last slot of the storage has the gem
        assert!(check_bytes(
            &save.file,
            0x11524,
            &[
                0x69, 0x00, 0x00, 0x00, 0x73, 0x00, 0x80, 0xc0, 0xf0, 0x49, 0x02, 0x80, 0x01, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
                0x00, 0x00, 0x00, 0x00
            ]
        ));

        //Try again but from the storage

        //The inventory has 1 gems
        assert_eq!(
            save.inventory
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            1
        );
        //The storage has 3 gems
        assert_eq!(
            save.storage
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            3
        );
        //Get the gem to be moved
        let gem = save.storage.upgrades.get_mut(&UpgradeType::Gem).unwrap()[0].clone();
        //Slot of the storage with the gem
        assert!(check_bytes(
            &save.file,
            0x11504,
            &[
                0x44, 0x40, 0x89, 0x13, 0x71, 0x00, 0x80, 0xc0, 0x48, 0xe8, 0x01, 0x80, 0x01, 0x00,
                0x00, 0x00
            ]
        ));
        //Empty slot of the inventory
        assert!(check_bytes(
            &save.file,
            0x8fe8,
            &[0x51, 0x40, 0x89, 0x13, 0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0]
        ));

        //Move the gem
        save.move_upgrade(UpgradeType::Gem, 0, Location::Storage)
            .unwrap();

        //The inventory now has 2 gem
        assert_eq!(
            save.inventory
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            2
        );
        //The storage now has 2 gems
        assert_eq!(
            save.storage
                .upgrades
                .get_mut(&UpgradeType::Gem)
                .unwrap()
                .len(),
            2
        );
        //Get the moved gem
        let mut moved_gem = save
            .inventory
            .upgrades
            .get_mut(&UpgradeType::Gem)
            .unwrap()
            .last_mut()
            .unwrap()
            .clone();
        assert_eq!(moved_gem.index, 1);
        moved_gem.index = 0;
        assert_eq!(gem, moved_gem);
        //Now the storage slot in which the gem was is empty
        assert!(check_bytes(
            &save.file,
            0x11504,
            &[0x44, 0x40, 0x89, 0x13, 0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0]
        ));
        //The slot now has the gem
        assert!(check_bytes(
            &save.file,
            0x8fe8,
            &[
                0x51, 0x40, 0x89, 0x13, 0x71, 0x00, 0x80, 0xc0, 0x48, 0xe8, 0x01, 0x80, 0x01, 0x00,
                0x00, 0x00
            ]
        ));
    }
}

#[cfg(test)]
mod direct_equipment_safety_regression_tests {
    use std::collections::HashSet;

    use super::*;
    use crate::data_handling::{
        constants::{USERNAME_TO_FIRST_INVENTORY_COUNTER, USERNAME_TO_SECOND_INVENTORY_COUNTER},
        utils::test_utils::build_save_data,
    };

    const RESERVATION: [u8; 8] = [0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF];
    const RESERVATION_SIZE: usize = 64;
    const EQUIPMENT_PREFIX_MASK: u32 = 0xFF80_0000;
    const EQUIPMENT_SUFFIX_MASK: u32 = 0x007F_FFFF;
    const WEAPON_PREFIX: u32 = 0x8080_0000;
    const ARMOR_PREFIX: u32 = 0x9080_0000;

    fn reserve_equipment_blocks(save: &mut SaveData, count: usize) -> usize {
        let start = (save.file.offsets.equipped_gems.1 + 8) & !7;
        let end = start + count * RESERVATION_SIZE;
        assert!(end <= save.file.offsets.username - 147);
        for offset in (start..end).step_by(RESERVATION.len()) {
            save.file.bytes[offset..offset + RESERVATION.len()].copy_from_slice(&RESERVATION);
        }
        start
    }

    fn find_equipment_block(save: &SaveData, first_part: u32, second_part: u32) -> usize {
        (save.file.offsets.equipped_gems.0..save.file.offsets.username - 147)
            .find(|offset| {
                save.file.bytes[*offset..*offset + 4] == first_part.to_le_bytes()
                    && save.file.bytes[*offset + 4..*offset + 8] == second_part.to_le_bytes()
            })
            .expect("equipment block must exist")
    }

    fn highest_observed_equipment_suffix(save: &SaveData) -> u32 {
        let slot_limit = save.file.offsets.username - 147;
        let mut codes = HashSet::new();
        for (start, end) in [
            save.file.offsets.inventory,
            save.file.offsets.key_inventory,
            save.file.offsets.storage,
        ] {
            for offset in (start..end).step_by(16) {
                let first =
                    u32::from_le_bytes(save.file.bytes[offset + 4..offset + 8].try_into().unwrap());
                let second = u32::from_le_bytes(
                    save.file.bytes[offset + 8..offset + 12].try_into().unwrap(),
                );
                if first != 0 || second != u32::MAX {
                    codes.insert(first);
                }
            }
        }
        for offset in save.file.offsets.equipped_gems.0..=slot_limit.saturating_sub(60) {
            let first = u32::from_le_bytes(save.file.bytes[offset..offset + 4].try_into().unwrap());
            let marker = u32::from_le_bytes(
                save.file.bytes[offset + 16..offset + 20]
                    .try_into()
                    .unwrap(),
            );
            let shapes_are_valid = (0..5).all(|slot| {
                let start = offset + 20 + slot * 8;
                let shape: [u8; 4] = save.file.bytes[start..start + 4].try_into().unwrap();
                SlotShape::try_from(&shape).is_ok()
            });
            if first != 0 && marker == 1 && shapes_are_valid {
                codes.insert(first);
            }
        }
        codes
            .into_iter()
            .filter(|code| matches!(*code & EQUIPMENT_PREFIX_MASK, WEAPON_PREFIX | ARMOR_PREFIX))
            .map(|code| code & EQUIPMENT_SUFFIX_MASK)
            .max()
            .unwrap_or(0)
    }

    fn rebuild_inventory(save: &SaveData) -> Inventory {
        let mut file = save.file.clone();
        let mut upgrades = parse_upgrades(&file);
        let mut slots = parse_equipped_gems(&mut file, &mut upgrades);
        Inventory::build(
            &file,
            file.offsets.inventory,
            file.offsets.key_inventory,
            &mut upgrades,
            &mut slots,
        )
    }

    #[test]
    fn direct_equipment_refuses_to_reclaim_a_valid_unreferenced_block() {
        let mut save = build_save_data("testsave9");
        let protected = save
            .inventory
            .articles
            .get(&ArticleType::RightHand)
            .and_then(|weapons| weapons.first())
            .cloned()
            .expect("test save must contain a right-hand weapon");
        let protected_record = save
            .file
            .find_article_offset(protected.number, protected.id, TypeFamily::Weapon, false)
            .expect("weapon record must exist");
        let protected_block_offset =
            find_equipment_block(&save, protected.first_part, protected.second_part);
        let protected_block =
            save.file.bytes[protected_block_offset..protected_block_offset + 60].to_vec();

        save.file.bytes[protected_record + 4..protected_record + 16]
            .copy_from_slice(&[0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0]);
        let weapons = save
            .inventory
            .articles
            .get_mut(&ArticleType::RightHand)
            .expect("weapon category must exist");
        weapons.remove(0);
        for (index, weapon) in weapons.iter_mut().enumerate() {
            weapon.index = index;
        }

        let before = save.file.clone();
        assert!(save.add_direct_equipment(2_020_000, false).is_err());
        assert_eq!(save.file, before);
        assert_eq!(
            save.file.bytes[protected_block_offset..protected_block_offset + 60],
            protected_block
        );
    }

    #[test]
    fn direct_equipment_uses_reservation_and_monotonic_code_without_overwrite() {
        let mut save = build_save_data("testsave9");
        let protected = save
            .inventory
            .articles
            .get(&ArticleType::RightHand)
            .and_then(|weapons| weapons.first())
            .cloned()
            .expect("test save must contain a right-hand weapon");
        let protected_block_offset =
            find_equipment_block(&save, protected.first_part, protected.second_part);
        let protected_block =
            save.file.bytes[protected_block_offset..protected_block_offset + 60].to_vec();
        let highest_suffix = highest_observed_equipment_suffix(&save);
        let reserved_offset = reserve_equipment_blocks(&mut save, 1);

        let added = save
            .add_direct_equipment(2_020_000, false)
            .expect("Lost Chikage must use the explicit reservation");
        assert_eq!(added.article_type, ArticleType::RightHand);
        assert_eq!(added.id, 2_020_000);
        assert_eq!(added.first_part & EQUIPMENT_PREFIX_MASK, WEAPON_PREFIX);
        assert!(added.first_part & EQUIPMENT_SUFFIX_MASK > highest_suffix);
        assert_eq!(
            u32::from_le_bytes(
                save.file.bytes[reserved_offset..reserved_offset + 4]
                    .try_into()
                    .unwrap()
            ),
            added.first_part
        );
        assert_eq!(
            save.file.bytes[protected_block_offset..protected_block_offset + 60],
            protected_block
        );
    }

    #[test]
    fn lost_chikage_and_wooden_shield_allocate_distinct_reserved_records() {
        let mut save = build_save_data("testsave9");
        let reserved_offset = reserve_equipment_blocks(&mut save, 2);
        let username = save.file.offsets.username;
        let first_counter_before = u32::from_le_bytes(
            save.file.bytes[username + USERNAME_TO_FIRST_INVENTORY_COUNTER
                ..username + USERNAME_TO_FIRST_INVENTORY_COUNTER + 4]
                .try_into()
                .unwrap(),
        );
        let second_counter_before = u32::from_le_bytes(
            save.file.bytes[username + USERNAME_TO_SECOND_INVENTORY_COUNTER
                ..username + USERNAME_TO_SECOND_INVENTORY_COUNTER + 4]
                .try_into()
                .unwrap(),
        );

        let chikage = save
            .add_direct_equipment(2_020_000, false)
            .expect("Lost Chikage must be added");
        let shield = save
            .add_direct_equipment(19_000_000, false)
            .expect("Wooden Shield must be added");
        assert_eq!(chikage.article_type, ArticleType::RightHand);
        assert_eq!(shield.article_type, ArticleType::LeftHand);
        assert_eq!(
            shield.first_part & EQUIPMENT_SUFFIX_MASK,
            (chikage.first_part & EQUIPMENT_SUFFIX_MASK) + 1
        );
        assert_eq!(
            find_equipment_block(&save, chikage.first_part, chikage.second_part),
            reserved_offset
        );
        assert_eq!(
            find_equipment_block(&save, shield.first_part, shield.second_part),
            reserved_offset + RESERVATION_SIZE
        );
        assert_eq!(
            u32::from_le_bytes(
                save.file.bytes[username + USERNAME_TO_FIRST_INVENTORY_COUNTER
                    ..username + USERNAME_TO_FIRST_INVENTORY_COUNTER + 4]
                    .try_into()
                    .unwrap(),
            ),
            first_counter_before + 2
        );
        assert_eq!(
            u32::from_le_bytes(
                save.file.bytes[username + USERNAME_TO_SECOND_INVENTORY_COUNTER
                    ..username + USERNAME_TO_SECOND_INVENTORY_COUNTER + 4]
                    .try_into()
                    .unwrap(),
            ),
            second_counter_before + 2
        );

        let rebuilt = rebuild_inventory(&save);
        assert!(rebuilt
            .articles
            .get(&ArticleType::RightHand)
            .is_some_and(|weapons| weapons
                .iter()
                .any(|weapon| weapon.first_part == chikage.first_part)));
        assert!(rebuilt
            .articles
            .get(&ArticleType::LeftHand)
            .is_some_and(|weapons| weapons
                .iter()
                .any(|weapon| weapon.first_part == shield.first_part)));
    }

    #[test]
    fn full_charred_hunter_set_allocates_four_distinct_reserved_records() {
        let mut save = build_save_data("testsave9");
        let reserved_offset = reserve_equipment_blocks(&mut save, 4);
        let armor_ids = [10_000u32, 11_000u32, 12_000u32, 13_000u32];
        let mut added = Vec::new();
        for id in armor_ids {
            added.push(
                save.add_direct_equipment(id, true)
                    .expect("each Charred Hunter armor piece must be added"),
            );
        }

        let codes: HashSet<u32> = added.iter().map(|article| article.first_part).collect();
        assert_eq!(codes.len(), armor_ids.len());
        for (index, article) in added.iter().enumerate() {
            assert_eq!(article.article_type, ArticleType::Armor);
            assert_eq!(article.id, armor_ids[index]);
            assert_eq!(article.first_part & EQUIPMENT_PREFIX_MASK, ARMOR_PREFIX);
            assert_eq!(article.second_part & 0x00FF_FFFF, armor_ids[index]);
            assert_eq!(
                find_equipment_block(&save, article.first_part, article.second_part),
                reserved_offset + index * RESERVATION_SIZE
            );
        }

        let rebuilt = rebuild_inventory(&save);
        let rebuilt_armors = rebuilt
            .articles
            .get(&ArticleType::Armor)
            .expect("rebuild must retain armor entries");
        for article in &added {
            assert!(rebuilt_armors
                .iter()
                .any(|armor| armor.first_part == article.first_part && armor.id == article.id));
        }
    }
}

#[cfg(test)]
mod complete_equipment_catalogue_tests {
    use std::collections::HashSet;

    use super::*;
    use crate::data_handling::{
        inventory::{get_info_armor, get_info_weapon},
        utils::test_utils::build_save_data,
    };
    use serde_json::Value;

    const RESERVATION: [u8; 8] = [0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF];
    const RESERVATION_SIZE: usize = 64;

    #[derive(Debug)]
    struct CatalogueEntry {
        id: u32,
        is_armor: bool,
        article_type: ArticleType,
        name: String,
    }

    fn reserve_equipment_blocks(save: &mut SaveData, count: usize) -> usize {
        let start = (save.file.offsets.equipped_gems.1 + 8) & !7;
        let end = start + count * RESERVATION_SIZE;
        assert!(
            end <= save.file.offsets.username - 147,
            "the fixture must have enough explicit safe reservation space"
        );
        for offset in (start..end).step_by(RESERVATION.len()) {
            save.file.bytes[offset..offset + RESERVATION.len()].copy_from_slice(&RESERVATION);
        }
        start
    }

    fn catalogue_entries() -> Vec<CatalogueEntry> {
        let weapons: Value = serde_json::from_str(include_str!("../../resources/weapons.json"))
            .expect("weapons catalogue must be valid JSON");
        let armors: Value = serde_json::from_str(include_str!("../../resources/armors.json"))
            .expect("armors catalogue must be valid JSON");
        let mut entries = Vec::new();

        for (category, expected_type) in [
            ("rightHand", ArticleType::RightHand),
            ("leftHand", ArticleType::LeftHand),
        ] {
            for (id, entry) in weapons[category]
                .as_object()
                .expect("weapon category must be an object")
            {
                entries.push(CatalogueEntry {
                    id: id.parse().expect("weapon IDs must be numeric"),
                    is_armor: false,
                    article_type: expected_type,
                    name: entry["item_name"]
                        .as_str()
                        .expect("weapon name must be text")
                        .to_owned(),
                });
            }
        }
        for (id, entry) in armors
            .as_object()
            .expect("armor catalogue must be an object")
        {
            entries.push(CatalogueEntry {
                id: id.parse().expect("armor IDs must be numeric"),
                is_armor: true,
                article_type: ArticleType::Armor,
                name: entry["item_name"]
                    .as_str()
                    .expect("armor name must be text")
                    .to_owned(),
            });
        }
        entries.sort_by_key(|entry| (entry.is_armor, entry.id));
        entries
    }

    fn rebuild_inventory(save: &SaveData) -> Inventory {
        let mut file = save.file.clone();
        let mut upgrades = parse_upgrades(&file);
        let mut slots = parse_equipped_gems(&mut file, &mut upgrades);
        Inventory::build(
            &file,
            file.offsets.inventory,
            file.offsets.key_inventory,
            &mut upgrades,
            &mut slots,
        )
    }

    #[test]
    fn every_weapon_and_armor_catalogue_entry_is_safe_to_allocate_and_rebuild() {
        let entries = catalogue_entries();
        let weapon_count = entries.iter().filter(|entry| !entry.is_armor).count();
        let armor_count = entries.iter().filter(|entry| entry.is_armor).count();
        assert_eq!(
            weapon_count, 97,
            "catalogue weapon coverage must be complete"
        );
        assert_eq!(
            armor_count, 255,
            "catalogue armor coverage must be complete"
        );

        let mut save = build_save_data("testsave9");
        let reservation_offset = reserve_equipment_blocks(&mut save, entries.len());
        let mut added = Vec::with_capacity(entries.len());
        let mut codes = HashSet::new();

        for (index, entry) in entries.iter().enumerate() {
            let (catalogue_info, catalogue_type) = if entry.is_armor {
                get_info_armor(entry.id, &save.file.resources_path)
            } else {
                get_info_weapon(entry.id, &save.file.resources_path)
            }
            .unwrap_or_else(|error| panic!("catalogue lookup failed for {}: {error}", entry.name));
            assert_eq!(
                catalogue_type, entry.article_type,
                "wrong catalogue family for {}",
                entry.name
            );
            assert_eq!(
                catalogue_info.item_name, entry.name,
                "wrong catalogue name for id {}",
                entry.id
            );

            let article = save
                .add_direct_equipment(entry.id, entry.is_armor)
                .unwrap_or_else(|error| {
                    panic!("direct allocation failed for {}: {error}", entry.name)
                });
            assert_eq!(
                article.article_type, entry.article_type,
                "wrong allocated family for {}",
                entry.name
            );
            assert_eq!(
                article.info.item_name, entry.name,
                "wrong allocated name for id {}",
                entry.id
            );
            assert_eq!(article.slots.as_ref().map(Vec::len), Some(5));
            assert!(
                codes.insert(article.first_part),
                "duplicate equipment code for {}",
                entry.name
            );

            let expected_block = reservation_offset + index * RESERVATION_SIZE;
            assert_eq!(
                u32::from_le_bytes(
                    save.file.bytes[expected_block..expected_block + 4]
                        .try_into()
                        .unwrap()
                ),
                article.first_part,
                "wrong reserved block for {}",
                entry.name
            );
            assert_eq!(
                u32::from_le_bytes(
                    save.file.bytes[expected_block + 4..expected_block + 8]
                        .try_into()
                        .unwrap()
                ),
                article.second_part,
                "wrong equipment key for {}",
                entry.name
            );
            added.push(article);
        }

        let rebuilt = rebuild_inventory(&save);
        for article in added {
            assert!(
                rebuilt
                    .articles
                    .get(&article.article_type)
                    .is_some_and(|articles| articles.iter().any(|candidate| {
                        candidate.first_part == article.first_part
                            && candidate.second_part == article.second_part
                            && candidate.id == article.id
                    })),
                "rebuild lost {}",
                article.info.item_name
            );
        }
    }
}
