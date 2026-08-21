use serde::{Deserialize, Serialize};

use crate::data_handling::position::Pos;
use std::{collections::HashSet, path::PathBuf};
use serde_json::Value;

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
        let empty_slot = self
            .file
            .find_inv_empty_slot(Location::Inventory)
            .ok_or(Error::CustomError("ERROR: No free inventory slot is available."))?;

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

        let reserved_block = [0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF];
        let slot_limit = self.file.offsets.username.saturating_sub(147);
        let referenced_pairs: HashSet<(u32, u32)> = self
            .inventory
            .articles
            .values()
            .chain(self.storage.articles.values())
            .flat_map(|entries| entries.iter())
            .map(|article| (article.first_part, article.second_part))
            .collect();
        let is_valid_slot_block = |offset: usize| {
            offset + 60 <= slot_limit
                && self.file.bytes[offset..offset + 8] != [0; 8]
                && self.file.bytes[offset + 16..offset + 20] == [1, 0, 0, 0]
                && (0..5).all(|slot| {
                    let start = offset + 20 + slot * 8;
                    let shape: [u8; 4] = self.file.bytes[start..start + 4].try_into().unwrap();
                    SlotShape::try_from(&shape).is_ok()
                })
        };
        let orphan_block = (self.file.offsets.equipped_gems.0..slot_limit.saturating_sub(60))
            .find(|offset| {
                let first = u32::from_le_bytes(self.file.bytes[*offset..*offset + 4].try_into().unwrap());
                let second = u32::from_le_bytes(self.file.bytes[*offset + 4..*offset + 8].try_into().unwrap());
                is_valid_slot_block(*offset) && !referenced_pairs.contains(&(first, second))
            });
        let reserved_offset = (self.file.offsets.equipped_gems.1 + 1..slot_limit.saturating_sub(60))
            .find(|offset| {
                (0..8).all(|block| {
                    self.file.bytes[*offset + block * 8..*offset + (block + 1) * 8]
                        == reserved_block
                })
            });
        let block_offset = orphan_block.or(reserved_offset).ok_or(Error::CustomError(
            "ERROR: No safe orphaned or reserved equipment-slot block is available in this save.",
        ))?;

        let used_codes: HashSet<u32> = referenced_pairs.iter().map(|(first, _)| *first).collect();
        let prefix = if is_armor { 0x9080_0000 } else { 0x8080_0000 };
        let first_part = (1..=0x00FF_FFFF)
            .map(|suffix| prefix | suffix)
            .find(|candidate| !used_codes.contains(candidate))
            .ok_or(Error::CustomError("ERROR: No unique equipment code is available."))?;
        let second_part = if is_armor {
            (id & 0x00FF_FFFF) | 0x1000_0000
        } else {
            id
        };

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
        self.file.offsets.equipped_gems.1 = self.file.offsets.equipped_gems.1.max(block_offset + 59);
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

        let raw_slot_upgrade_ids: HashSet<u32> = (self.file.offsets.upgrades.1.saturating_sub(16)..self.file.offsets.username.saturating_sub(163))
            .flat_map(|offset| {
                let block_id = u64::from_le_bytes(self.file.bytes[offset..offset + 8].try_into().unwrap());
                if block_id == 0 {
                    return Vec::new();
                }
                let mut ids = Vec::new();
                for slot in 0..5 {
                    let start = offset + 20 + slot * 8;
                    let shape: [u8; 4] = self.file.bytes[start..start + 4].try_into().unwrap();
                    match SlotShape::try_from(&shape) {
                        Ok(SlotShape::Closed) => {}
                        Ok(_) => ids.push(u32::from_le_bytes(self.file.bytes[start + 4..start + 8].try_into().unwrap())),
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
        let source = u32::from_le_bytes(self.file.bytes[offset + 4..offset + 8].try_into().unwrap());
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
        .ok_or(Error::CustomError("ERROR: Direct upgrade insertion failed."))?;

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
    fn direct_equipment_reclaims_only_an_orphaned_slot_block() {
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
            .find_article_offset(
                original.number,
                original.id,
                TypeFamily::Weapon,
                false,
            )
            .expect("weapon record must exist");
        save.file.bytes[record_offset + 4..record_offset + 16].copy_from_slice(&[
            0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0,
        ]);
        let weapons = save.inventory.articles.get_mut(&ArticleType::RightHand).unwrap();
        weapons.remove(0);
        for (index, weapon) in weapons.iter_mut().enumerate() {
            weapon.index = index;
        }

        let added = save
            .add_direct_equipment(original.id, false)
            .expect("an orphaned weapon block must be reusable");
        assert_eq!(added.id, original.id);
        assert_eq!(added.type_family, TypeFamily::Weapon);
        assert_eq!(added.slots.as_ref().map(Vec::len), Some(5));
        assert!(added
            .slots
            .as_ref()
            .is_some_and(|slots| slots.iter().all(|slot| slot.shape == SlotShape::Closed && slot.gem.is_none())));

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
            .is_some_and(|weapons| weapons.iter().any(|weapon| weapon.first_part == added.first_part && weapon.slots.as_ref().map(Vec::len) == Some(5))));
    }

    #[test]
    fn direct_armor_reclaims_only_an_orphaned_slot_block() {
        let mut save = build_save_data("testsave9");
        let original = save
            .inventory
            .articles
            .get(&ArticleType::Armor)
            .and_then(|armors| armors.first())
            .cloned()
            .expect("test save must contain armor");
        let record_offset = save
            .file
            .find_article_offset(original.number, original.id, TypeFamily::Armor, false)
            .expect("armor record must exist");
        save.file.bytes[record_offset + 4..record_offset + 16].copy_from_slice(&[
            0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0,
        ]);
        let armors = save.inventory.articles.get_mut(&ArticleType::Armor).unwrap();
        armors.remove(0);
        for (index, armor) in armors.iter_mut().enumerate() {
            armor.index = index;
        }

        let added = save
            .add_direct_equipment(original.id, true)
            .expect("an orphaned armor block must be reusable");
        assert_eq!(added.id, original.id);
        assert_eq!(added.type_family, TypeFamily::Armor);
        assert_eq!(added.second_part & 0xFF00_0000, 0x1000_0000);
        assert_eq!(added.slots.as_ref().map(Vec::len), Some(5));

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
            .is_some_and(|armors| armors.iter().any(|armor| armor.first_part == added.first_part && armor.slots.as_ref().map(Vec::len) == Some(5))));
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
                0x00, 0x00, 0x6a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
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
