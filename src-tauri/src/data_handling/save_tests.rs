//! Tests of `save.rs`: loading, validation, equipment and Gem/Rune
//! additions, weapon levels. Kept apart so the save logic stays readable.

use super::*;

/// Writes the 8-byte reservation pattern (4 x 0x00, 4 x 0xFF) on a range.
fn fill_reservation(bytes: &mut [u8], range: std::ops::Range<usize>) {
    let start = range.start;
    for (offset, byte) in bytes[range].iter_mut().enumerate() {
        *byte = if (start + offset) % 8 < 4 { 0x00 } else { 0xFF };
    }
}

mod tests {
    use std::{path::PathBuf, time::Instant};

    use super::*;
    use crate::data_handling::{
        enums::SlotShape,
        utils::test_utils::{build_save_data, check_bytes},
    };

    fn reserve_equipment_blocks(save: &mut SaveData, count: usize) -> usize {
        const RESERVATION_SIZE: usize = 60;
        let start = save.file.offsets.equipped_gems.1 + 1;
        let end = start + count * RESERVATION_SIZE;
        assert!(end <= save.file.offsets.username - 147);
        fill_reservation(&mut save.file.bytes, start..end);
        start
    }

    #[test]
    fn experimental_equipment_uses_upstream_header_in_both_destinations() {
        for location in [Location::Inventory, Location::Storage] {
            for is_armor in [false, true] {
                let mut save = build_save_data("testsave9");
                let kind = if is_armor {
                    ArticleType::Armor
                } else {
                    ArticleType::RightHand
                };
                let id = save.inventory.articles[&kind][0].id;
                let offset =
                    crate::data_handling::ga::scan(&save.file.bytes, save.file.offsets.username)
                        .unwrap()
                        .empty
                        .unwrap();
                let original_len = save.file.bytes.len();
                let first = save
                    .add_experimental_equipment(id, is_armor, location)
                    .unwrap();
                let second = save
                    .add_experimental_equipment(id, is_armor, location)
                    .unwrap();
                assert_ne!(first.first_part, second.first_part);
                assert_eq!(save.file.bytes.len(), original_len);
                for start in [offset, offset + 60] {
                    assert_eq!(
                        &save.file.bytes[start + 8..start + 12],
                        &200u32.to_le_bytes()
                    );
                }
                let mut file = save.file.clone();
                let mut upgrades = parse_upgrades(&file);
                let mut slots = parse_equipped_gems(&mut file, &mut upgrades);
                let range = match location {
                    Location::Inventory => file.offsets.inventory,
                    Location::Storage => file.offsets.storage,
                };
                let rebuilt = Inventory::build(&file, range, (0, 0), &mut upgrades, &mut slots);
                for added in [first, second] {
                    assert!(rebuilt.articles[&kind]
                        .iter()
                        .any(|item| item.first_part == added.first_part && item.id == added.id));
                }
            }
        }
    }

    #[test]
    fn experimental_insertion_rebases_views_and_drops_stale_tail() {
        for location in [Location::Inventory, Location::Storage] {
            let mut save = build_save_data("testsave9");
            let original = save.clone();
            let id = save.inventory.articles[&ArticleType::RightHand][0].id;
            save.add_experimental_equipment(id, false, location)
                .unwrap();
            assert_eq!(
                save.file.offsets.username,
                original.file.offsets.username + 52
            );
            assert_eq!(
                save.file.offsets.inventory.0,
                original.file.offsets.inventory.0 + 52
            );
            assert_eq!(
                save.file.offsets.storage.0,
                original.file.offsets.storage.0 + 52
            );
            assert_eq!(
                serde_json::to_value(&save.stats).unwrap(),
                serde_json::to_value(&original.stats).unwrap()
            );
            assert_eq!(
                serde_json::to_value(&save.bosses).unwrap(),
                serde_json::to_value(&original.bosses).unwrap()
            );
            assert_eq!(save.playtime, original.playtime);
            let mut expected_position = serde_json::to_value(&original.position).unwrap();
            let offset = expected_position["coordinates"]["offset"].as_u64().unwrap();
            expected_position["coordinates"]["offset"] = serde_json::json!(offset + 52);
            assert_eq!(
                serde_json::to_value(&save.position).unwrap(),
                expected_position
            );
            // Stale bytes at the end of the file no longer block an insertion.
            let len = save.file.bytes.len();
            save.file.bytes[len - 1] = 0x42;
            let armor = save.inventory.articles[&ArticleType::Armor][0].id;
            save.add_experimental_equipment(armor, true, location)
                .unwrap();
            assert_eq!(save.file.bytes.len(), len);
        }
    }

    #[test]
    fn experimental_equipment_works_on_every_fixture_save() {
        let fixtures = [
            "testsave0",
            "testsave1",
            "testsave2",
            "testsave3",
            "testsave4",
            "testsave5",
            "testsave6",
            "testsave7",
            "testsave8",
            "testsave9",
            "weaponmods0",
            "savetestsave",
        ];
        for name in fixtures {
            for location in [Location::Inventory, Location::Storage] {
                let mut save = build_save_data(name);
                save.validate_game_load_safety()
                    .unwrap_or_else(|error| panic!("{name} refused before any addition: {error}"));
                let len = save.file.bytes.len();
                // Right-hand weapon, left-hand firearm and armor from the bundled catalogues.
                for (id, is_armor) in [(2_000_000u32, false), (6000000, false), (20_000, true)] {
                    let article = save
                        .add_experimental_equipment(id, is_armor, location)
                        .unwrap_or_else(|error| panic!("{name} {id}: {error}"));
                    let slots = article
                        .slots
                        .as_ref()
                        .expect("added equipment exposes its slots");
                    assert_eq!(slots.len(), 5, "{name}");
                    assert!(
                        slots.iter().all(|slot| slot.shape == SlotShape::Closed),
                        "{name}"
                    );
                }
                assert_eq!(save.file.bytes.len(), len, "{name}");
                save.validate_game_load_safety().unwrap();
            }
        }
    }

    #[test]
    fn added_weapon_with_open_empty_slots_can_be_saved() {
        // Reported in v0.7.0: opening the five slots of an added weapon without
        // Gems blocked saving. Real saves contain open empty slots.
        let mut save = build_save_data("testsave8");
        save.validate_game_load_safety()
            .expect("a completed save with open empty slots is valid");
        let added = save
            .add_experimental_equipment(2_000_000, false, Location::Inventory)
            .unwrap();
        let index = save.inventory.articles[&ArticleType::RightHand]
            .iter()
            .position(|article| article.number == added.number && article.id == added.id)
            .unwrap();
        let shapes = [
            SlotShape::Radial,
            SlotShape::Triangle,
            SlotShape::Waning,
            SlotShape::Circle,
            SlotShape::Droplet,
        ];
        for (slot, shape) in shapes.into_iter().enumerate() {
            let article = &mut save
                .inventory
                .articles
                .get_mut(&ArticleType::RightHand)
                .unwrap()[index];
            article
                .change_slot_shape(&mut save.file, slot, shape)
                .unwrap();
        }
        save.validate_game_load_safety()
            .expect("open empty slots must not block saving");

        let path = std::env::temp_dir().join("bbse_open_slots_test");
        std::fs::write(&path, &save.file.bytes).unwrap();
        let reparsed =
            SaveData::build(path.to_str().unwrap(), save.file.resources_path.clone()).unwrap();
        let weapon = reparsed.inventory.articles[&ArticleType::RightHand]
            .iter()
            .find(|article| article.number == added.number)
            .unwrap();
        let slots = weapon.slots.as_ref().unwrap();
        assert_eq!(
            slots.iter().map(|slot| slot.shape).collect::<Vec<_>>(),
            shapes.to_vec()
        );
        assert!(slots.iter().all(|slot| slot.gem.is_none()));
        reparsed.validate_game_load_safety().unwrap();
    }

    #[test]
    fn experimental_equipment_numbers_the_next_free_slot() {
        let mut save = build_save_data("testsave0");
        let id = save.inventory.articles[&ArticleType::RightHand][0].id;
        let first = save
            .add_experimental_equipment(id, false, Location::Inventory)
            .unwrap();
        let second = save
            .add_experimental_equipment(id, false, Location::Inventory)
            .unwrap();
        assert_ne!(first.number, 0);
        assert_eq!(second.number, first.number.wrapping_add(1));
    }

    #[test]
    fn experimental_equipment_failure_preserves_the_complete_save() {
        for location in [Location::Inventory, Location::Storage] {
            let mut save = build_save_data("testsave9");
            // Unknown record type must be rejected before any mutation.
            save.file.bytes[crate::data_handling::constants::START_TO_UPGRADE + 3] = 0x42;
            let original = save.clone();
            assert!(save
                .add_experimental_equipment(2_020_000, false, location)
                .is_err());
            assert_eq!(save.file, original.file);
            assert_eq!(
                serde_json::to_value(&save).unwrap(),
                serde_json::to_value(&original).unwrap()
            );
        }
    }

    /// Turns an upgrade into a real orphan: its Inventory/Storage entries in the
    /// file become empty slots, as when the player discards it in game.
    fn orphan_in_file(save: &mut SaveData, id: u32) {
        let empty = [0, 0, 0, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0];
        for (start, end) in [save.file.offsets.inventory, save.file.offsets.storage] {
            for entry in (start..end).step_by(16) {
                if save.file.bytes[entry + 4..entry + 8] == id.to_le_bytes() {
                    save.file.bytes[entry + 4..entry + 16].copy_from_slice(&empty);
                }
            }
        }
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

        assert!(
            !save.has_safe_reusable_upgrade_record(),
            "a fully referenced pool must be reported as unavailable"
        );

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
        orphan_in_file(&mut save, original.id);
        assert!(
            save.has_safe_reusable_upgrade_record(),
            "removing the inventory reference must expose the reusable record"
        );

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
    fn direct_gem_and_rune_storage_additions_rebuild_from_storage() {
        let mut save = build_save_data("testsave9");
        let original_file = save.file.clone();

        assert!(save
            .add_direct_upgrade(
                UpgradeType::Gem,
                "Radial".to_string(),
                Vec::new(),
                Location::Storage,
            )
            .is_err());
        assert_eq!(save.file, original_file);

        let orphaned_gem = save
            .storage
            .upgrades
            .get_mut(&UpgradeType::Gem)
            .and_then(|gems| (!gems.is_empty()).then(|| gems.remove(0)))
            .expect("test save must contain an unreferenced storage gem");
        if let Some(gems) = save.storage.upgrades.get_mut(&UpgradeType::Gem) {
            for (index, gem) in gems.iter_mut().enumerate() {
                gem.index = index;
            }
        }
        orphan_in_file(&mut save, orphaned_gem.id);

        let added_gem = save
            .add_direct_upgrade(
                UpgradeType::Gem,
                "Radial".to_string(),
                vec![13_101],
                Location::Storage,
            )
            .expect("an orphaned storage gem record must be reusable");
        assert_eq!(added_gem.id, orphaned_gem.id);
        assert_eq!(added_gem.upgrade_type, UpgradeType::Gem);
        assert_eq!(added_gem.shape, "Radial");
        assert_eq!(added_gem.effects[0].0, 13_101);

        let orphaned_rune = save
            .inventory
            .upgrades
            .get_mut(&UpgradeType::Rune)
            .and_then(|runes| (!runes.is_empty()).then(|| runes.remove(0)))
            .expect("test save must contain an unreferenced rune");
        if let Some(runes) = save.inventory.upgrades.get_mut(&UpgradeType::Rune) {
            for (index, rune) in runes.iter_mut().enumerate() {
                rune.index = index;
            }
        }
        orphan_in_file(&mut save, orphaned_rune.id);

        let added_rune = save
            .add_direct_upgrade(
                UpgradeType::Rune,
                "-".to_string(),
                vec![1_100_000],
                Location::Storage,
            )
            .expect("an orphaned rune record must be reusable in storage");
        assert_eq!(added_rune.id, orphaned_rune.id);
        assert_eq!(added_rune.upgrade_type, UpgradeType::Rune);
        assert_eq!(added_rune.shape, "-");
        assert_eq!(added_rune.effects[0].0, 1_100_000);

        let mut parsed = parse_upgrades(&save.file);
        let mut slots = parse_equipped_gems(&mut save.file, &mut parsed);
        let rebuilt_storage = Inventory::build(
            &save.file,
            save.file.offsets.storage,
            (0, 0),
            &mut parsed,
            &mut slots,
        );
        assert!(rebuilt_storage
            .upgrades
            .get(&UpgradeType::Gem)
            .is_some_and(|gems| gems.iter().any(|gem| gem.id == added_gem.id)));
        assert!(rebuilt_storage
            .upgrades
            .get(&UpgradeType::Rune)
            .is_some_and(|runes| runes.iter().any(|rune| rune.id == added_rune.id)));
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
        assert_eq!(
            u32::from_le_bytes(
                save.file.bytes[reserved_offset + 8..reserved_offset + 12]
                    .try_into()
                    .unwrap()
            ),
            250
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
        let article = articles_of_type.first().unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.first().unwrap();
        let slot2 = save
            .get_slot_mut(Location::Inventory, ArticleType::RightHand, 0, 0)
            .unwrap();
        assert_eq!(*slot1, *slot2);
        assert_eq!(slot1.shape, SlotShape::Droplet);

        slot2.shape = SlotShape::Triangle;

        let articles = save.inventory.articles;
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.first().unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.first().unwrap();
        assert_eq!(slot1.shape, SlotShape::Triangle);

        //Storage
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();
        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article = articles_of_type.first().unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.first().unwrap();
        let slot2 = save
            .get_slot_mut(Location::Storage, ArticleType::Armor, 0, 0)
            .unwrap();
        assert_eq!(*slot1, *slot2);
        assert_eq!(slot1.shape, SlotShape::Closed);

        slot2.shape = SlotShape::Waning;

        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article = articles_of_type.first().unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot1 = slots.first().unwrap();
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
        let article1 = articles_of_type.first().unwrap();
        let article2 = save
            .get_article_mut(Location::Inventory, ArticleType::RightHand, 0)
            .unwrap();
        assert_eq!(*article1, *article2);
        assert_eq!(article1.id, 28001000);

        article2.id = 0;

        let articles = save.inventory.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article1 = articles_of_type.first().unwrap();
        assert_eq!(article1.id, 0);

        //Storage
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();
        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article1 = articles_of_type.first().unwrap();
        let article2 = save
            .get_article_mut(Location::Storage, ArticleType::Armor, 0)
            .unwrap();
        assert_eq!(*article1, *article2);
        assert_eq!(article1.id, 351000);

        article2.id = 0;

        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::Armor).unwrap();
        let article1 = articles_of_type.first().unwrap();
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
        let article = articles_of_type.first().unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot = slots.first().unwrap();
        let gem1 = slot.gem.as_ref().unwrap();
        let gem2 = save
            .get_equipped_upgrade_mut(Location::Inventory, ArticleType::RightHand, 0, 0)
            .unwrap();
        assert_eq!(*gem1, *gem2);
        assert_eq!(gem1.id, 3229615259);

        gem2.id = 0;

        let articles = save.inventory.articles;
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.first().unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot = slots.first().unwrap();
        let gem1 = slot.gem.as_ref().unwrap();
        assert_eq!(gem1.id, 0);

        //Storage
        let mut save = SaveData::build("saves/testsave8", PathBuf::from("resources")).unwrap();
        let articles = save.storage.articles.clone();
        let articles_of_type = articles.get(&ArticleType::RightHand).unwrap();
        let article = articles_of_type.get(17).unwrap();
        let slots = &article.slots.as_ref().unwrap();
        let slot = slots.first().unwrap();
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
        let slot = slots.first().unwrap();
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
        let upgrade1 = upgrades_of_type.first().unwrap();
        let upgrade2 = save
            .get_upgrade_mut(Location::Inventory, UpgradeType::Rune, 0)
            .unwrap();
        assert_eq!(*upgrade1, *upgrade2);
        assert_eq!(upgrade1.id, 3229614361);

        upgrade2.id = 0;

        let upgrades = save.inventory.upgrades.clone();
        let upgrades_of_type = upgrades.get(&UpgradeType::Rune).unwrap();
        let upgrade1 = upgrades_of_type.first().unwrap();
        assert_eq!(upgrade1.id, 0);

        //Storage
        let mut save = SaveData::build("saves/testsave9", PathBuf::from("resources")).unwrap();
        let upgrades = save.storage.upgrades.clone();
        let upgrades_of_type = upgrades.get(&UpgradeType::Gem).unwrap();
        let upgrade1 = upgrades_of_type.first().unwrap();
        let upgrade2 = save
            .get_upgrade_mut(Location::Storage, UpgradeType::Gem, 0)
            .unwrap();
        assert_eq!(*upgrade1, *upgrade2);
        assert_eq!(upgrade1.id, 3229614193);

        upgrade2.id = 0;

        let upgrades = save.storage.upgrades.clone();
        let upgrades_of_type = upgrades.get(&UpgradeType::Gem).unwrap();
        let upgrade1 = upgrades_of_type.first().unwrap();
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
    fn test_save_data_get_muts_runtime() {
        let mut save = SaveData::build("saves/testsave5", PathBuf::from("resources")).unwrap();

        // Test get_slot_mut() runtime. A 10µs threshold is scheduler-sensitive
        // in a debug test run, so retain a one-second guard against pathological stalls.
        let now = Instant::now();
        save.get_slot_mut(Location::Inventory, ArticleType::RightHand, 0, 0)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(elapsed < 1_000_000, "get_slot_mut stalled for {elapsed}µs");

        // Test get_article_mut() runtime.
        let now = Instant::now();
        save.get_article_mut(Location::Inventory, ArticleType::RightHand, 0)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(
            elapsed < 1_000_000,
            "get_article_mut stalled for {elapsed}µs"
        );

        // Test get_equipped_upgrade_mut() runtime.
        let now = Instant::now();
        save.get_equipped_upgrade_mut(Location::Inventory, ArticleType::RightHand, 0, 3)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(
            elapsed < 1_000_000,
            "get_equipped_upgrade_mut stalled for {elapsed}µs"
        );

        // Test get_upgrade_mut() runtime.
        let now = Instant::now();
        save.get_upgrade_mut(Location::Inventory, UpgradeType::Rune, 0)
            .unwrap();
        let elapsed = now.elapsed().as_micros();
        assert!(
            elapsed < 1_000_000,
            "get_upgrade_mut stalled for {elapsed}µs"
        );
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

mod direct_equipment_safety_regression_tests {
    use std::{
        collections::HashSet,
        fs,
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    use super::*;
    use crate::data_handling::{
        constants::{
            USERNAME_TO_FIRST_INVENTORY_COUNTER, USERNAME_TO_FIRST_STORAGE_COUNTER,
            USERNAME_TO_SECOND_INVENTORY_COUNTER, USERNAME_TO_SECOND_STORAGE_COUNTER,
        },
        utils::test_utils::build_save_data,
    };

    const RESERVATION_SIZE: usize = 60;
    const EQUIPMENT_PREFIX_MASK: u32 = 0xFF80_0000;
    const EQUIPMENT_SUFFIX_MASK: u32 = 0x007F_FFFF;
    const WEAPON_PREFIX: u32 = 0x8080_0000;
    const ARMOR_PREFIX: u32 = 0x9080_0000;

    fn reserve_equipment_blocks(save: &mut SaveData, count: usize) -> usize {
        let start = save.file.offsets.equipped_gems.1 + 1;
        let end = start + count * RESERVATION_SIZE;
        assert!(end <= save.file.offsets.username - 147);
        fill_reservation(&mut save.file.bytes, start..end);
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

    fn rebuild_storage(save: &SaveData) -> Inventory {
        let mut file = save.file.clone();
        let mut upgrades = parse_upgrades(&file);
        let mut slots = parse_equipped_gems(&mut file, &mut upgrades);
        Inventory::build(
            &file,
            file.offsets.storage,
            (0, 0),
            &mut upgrades,
            &mut slots,
        )
    }

    fn temporary_save_path(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time must be after the Unix epoch")
            .as_nanos();
        std::env::temp_dir().join(format!("bloodborne-save-editor-{name}-{nonce}.bin"))
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

    #[test]
    fn storage_equipment_uses_storage_counters_and_survives_full_reload() {
        let mut save = build_save_data("testsave9");
        let reserved_offset = reserve_equipment_blocks(&mut save, 2);
        let username = save.file.offsets.username;
        let inventory_counters_before = [
            u32::from_le_bytes(
                save.file.bytes[username + USERNAME_TO_FIRST_INVENTORY_COUNTER
                    ..username + USERNAME_TO_FIRST_INVENTORY_COUNTER + 4]
                    .try_into()
                    .unwrap(),
            ),
            u32::from_le_bytes(
                save.file.bytes[username + USERNAME_TO_SECOND_INVENTORY_COUNTER
                    ..username + USERNAME_TO_SECOND_INVENTORY_COUNTER + 4]
                    .try_into()
                    .unwrap(),
            ),
        ];
        let storage_counters_before = [
            u32::from_le_bytes(
                save.file.bytes[username + USERNAME_TO_FIRST_STORAGE_COUNTER
                    ..username + USERNAME_TO_FIRST_STORAGE_COUNTER + 4]
                    .try_into()
                    .unwrap(),
            ),
            u32::from_le_bytes(
                save.file.bytes[username + USERNAME_TO_SECOND_STORAGE_COUNTER
                    ..username + USERNAME_TO_SECOND_STORAGE_COUNTER + 4]
                    .try_into()
                    .unwrap(),
            ),
        ];

        let chikage = save
            .add_direct_equipment_at(2_020_000, false, Location::Storage)
            .expect("Lost Chikage must be added to storage");
        let armor = save
            .add_direct_equipment_at(10_000, true, Location::Storage)
            .expect("armor must be added to storage");

        assert_eq!(
            find_equipment_block(&save, chikage.first_part, chikage.second_part),
            reserved_offset
        );
        assert_eq!(
            find_equipment_block(&save, armor.first_part, armor.second_part),
            reserved_offset + RESERVATION_SIZE
        );
        assert_eq!(
            armor.first_part & EQUIPMENT_SUFFIX_MASK,
            (chikage.first_part & EQUIPMENT_SUFFIX_MASK) + 1
        );
        assert_eq!(
            [
                u32::from_le_bytes(
                    save.file.bytes[username + USERNAME_TO_FIRST_INVENTORY_COUNTER
                        ..username + USERNAME_TO_FIRST_INVENTORY_COUNTER + 4]
                        .try_into()
                        .unwrap(),
                ),
                u32::from_le_bytes(
                    save.file.bytes[username + USERNAME_TO_SECOND_INVENTORY_COUNTER
                        ..username + USERNAME_TO_SECOND_INVENTORY_COUNTER + 4]
                        .try_into()
                        .unwrap(),
                ),
            ],
            inventory_counters_before
        );
        assert_eq!(
            [
                u32::from_le_bytes(
                    save.file.bytes[username + USERNAME_TO_FIRST_STORAGE_COUNTER
                        ..username + USERNAME_TO_FIRST_STORAGE_COUNTER + 4]
                        .try_into()
                        .unwrap(),
                ),
                u32::from_le_bytes(
                    save.file.bytes[username + USERNAME_TO_SECOND_STORAGE_COUNTER
                        ..username + USERNAME_TO_SECOND_STORAGE_COUNTER + 4]
                        .try_into()
                        .unwrap(),
                ),
            ],
            [
                storage_counters_before[0] + 2,
                storage_counters_before[1] + 2
            ]
        );

        let rebuilt_storage = rebuild_storage(&save);
        assert!(rebuilt_storage
            .articles
            .get(&ArticleType::RightHand)
            .is_some_and(|articles| articles
                .iter()
                .any(|article| article.first_part == chikage.first_part)));
        assert!(rebuilt_storage
            .articles
            .get(&ArticleType::Armor)
            .is_some_and(|articles| articles
                .iter()
                .any(|article| article.first_part == armor.first_part)));
        assert!(save.inventory.articles.values().all(|articles| articles
            .iter()
            .all(|article| article.first_part != chikage.first_part
                && article.first_part != armor.first_part)));

        let path = temporary_save_path("storage-equipment-reload");
        save.file
            .save(path.to_str().expect("temporary path must be UTF-8"))
            .expect("temporary save write must succeed");
        let reopened = SaveData::build(
            path.to_str().expect("temporary path must be UTF-8"),
            PathBuf::from("resources"),
        )
        .expect("the save with storage equipment must reload cleanly");
        assert!(reopened
            .storage
            .articles
            .get(&ArticleType::RightHand)
            .is_some_and(|articles| articles
                .iter()
                .any(|article| article.first_part == chikage.first_part)));
        assert!(reopened
            .storage
            .articles
            .get(&ArticleType::Armor)
            .is_some_and(|articles| articles
                .iter()
                .any(|article| article.first_part == armor.first_part)));

        fs::remove_file(&path).expect("temporary save cleanup must succeed");
        fs::remove_file(format!("{}.bak", path.display()))
            .expect("temporary backup cleanup must succeed");
    }

    #[test]
    fn mixed_weapon_and_armor_batch_is_contiguous_and_reloadable_in_each_destination() {
        for location in [Location::Inventory, Location::Storage] {
            let mut save = build_save_data("testsave9");
            let right_hand_id = save
                .inventory
                .articles
                .get(&ArticleType::RightHand)
                .and_then(|articles| articles.first())
                .expect("fixture must contain a right-hand weapon")
                .id;
            let left_hand_id = save
                .inventory
                .articles
                .get(&ArticleType::LeftHand)
                .and_then(|articles| articles.first())
                .expect("fixture must contain a left-hand weapon")
                .id;
            let armor_ids = save
                .inventory
                .articles
                .get(&ArticleType::Armor)
                .expect("fixture must contain armor")
                .iter()
                .take(4)
                .map(|article| article.id)
                .collect::<Vec<_>>();
            assert_eq!(
                armor_ids.len(),
                4,
                "fixture must contain four armor records"
            );

            let reservation_offset = reserve_equipment_blocks(&mut save, 6);
            let mut added = Vec::with_capacity(6);
            added.push(
                save.add_direct_equipment_at(right_hand_id, false, location)
                    .expect("right-hand addition must be safe"),
            );
            added.push(
                save.add_direct_equipment_at(left_hand_id, false, location)
                    .expect("left-hand addition must be safe"),
            );
            for armor_id in armor_ids {
                added.push(
                    save.add_direct_equipment_at(armor_id, true, location)
                        .expect("armor addition must be safe"),
                );
            }

            for (index, article) in added.iter().enumerate() {
                assert_eq!(
                    find_equipment_block(&save, article.first_part, article.second_part),
                    reservation_offset + index * RESERVATION_SIZE,
                    "new equipment blocks must remain exactly contiguous",
                );
            }
            save.validate_game_load_safety()
                .expect("mixed direct equipment batch must remain structurally safe");

            let path = temporary_save_path(match location {
                Location::Inventory => "mixed-inventory-equipment",
                Location::Storage => "mixed-storage-equipment",
            });
            save.file
                .save(path.to_str().expect("temporary path must be UTF-8"))
                .expect("temporary save write must succeed");
            let reopened = SaveData::build(
                path.to_str().expect("temporary path must be UTF-8"),
                PathBuf::from("resources"),
            )
            .expect("mixed direct equipment save must reload cleanly");
            let destination = match location {
                Location::Inventory => &reopened.inventory,
                Location::Storage => &reopened.storage,
            };
            for article in &added {
                assert!(
                    destination
                        .articles
                        .get(&article.article_type)
                        .is_some_and(|articles| articles.iter().any(|candidate| {
                            candidate.first_part == article.first_part
                                && candidate.second_part == article.second_part
                                && candidate.id == article.id
                        })),
                    "reloaded destination must retain each direct addition",
                );
            }
            fs::remove_file(&path).expect("temporary save cleanup must succeed");
            fs::remove_file(format!("{}.bak", path.display()))
                .expect("temporary backup cleanup must succeed");
        }
    }

    #[test]
    fn equipment_destination_reference_mismatch_is_rejected_before_save() {
        for location in [Location::Inventory, Location::Storage] {
            let mut save = build_save_data("testsave9");
            reserve_equipment_blocks(&mut save, 1);
            let article = save
                .add_direct_equipment_at(2_020_000, false, location)
                .expect("direct equipment fixture setup must succeed");
            let record_offset = save
                .file
                .find_article_offset(
                    article.number,
                    article.id,
                    TypeFamily::Weapon,
                    matches!(location, Location::Storage),
                )
                .expect("new article must have a destination record");
            save.file.bytes[record_offset + 4..record_offset + 8]
                .copy_from_slice(&0u32.to_le_bytes());

            let error = save
                .validate_game_load_safety()
                .expect_err("mismatched raw destination record must block save");
            assert!(error
                .to_string()
                .contains("Equipment reference validation failed"));
        }
    }

    #[test]
    fn storage_equipment_without_reservation_is_atomic() {
        let mut save = build_save_data("testsave9");
        let bytes_before = save.file.bytes.clone();
        let offsets_before = save.file.offsets.clone();
        let storage_before = serde_json::to_value(&save.storage)
            .expect("storage model must be serializable before rejection");

        let result = save.add_direct_equipment_at(2_020_000, false, Location::Storage);

        assert!(result.is_err());
        assert_eq!(save.file.bytes, bytes_before);
        assert_eq!(save.file.offsets, offsets_before);
        assert_eq!(
            serde_json::to_value(&save.storage)
                .expect("storage model must remain serializable after rejection"),
            storage_before
        );
    }
}

mod complete_equipment_catalogue_tests {
    use std::collections::HashSet;

    use super::*;
    use crate::data_handling::{
        inventory::{get_info_armor, get_info_weapon},
        utils::test_utils::build_save_data,
    };
    use serde_json::Value;

    const RESERVATION_SIZE: usize = 60;

    #[derive(Debug)]
    struct CatalogueEntry {
        id: u32,
        is_armor: bool,
        article_type: ArticleType,
        name: String,
    }

    fn reserve_equipment_blocks(save: &mut SaveData, count: usize) -> usize {
        let start = save.file.offsets.equipped_gems.1 + 1;
        let end = start + count * RESERVATION_SIZE;
        assert!(
            end <= save.file.offsets.username - 147,
            "the fixture must have enough explicit safe reservation space"
        );
        fill_reservation(&mut save.file.bytes, start..end);
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
        // v0.6.5 removed the three default `[CUT] Body/Arms/Legs` items.
        assert_eq!(
            armor_count, 252,
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

mod save_safety_validation_tests {
    use crate::data_handling::{
        enums::{ArticleType, SlotShape},
        utils::test_utils::build_save_data,
    };

    #[test]
    fn save_validation_accepts_open_empty_slots_and_rejects_closed_slots_with_gems() {
        let mut empty_slot_save = build_save_data("testsave9");
        let article = empty_slot_save
            .inventory
            .articles
            .get_mut(&ArticleType::RightHand)
            .and_then(|articles| articles.first_mut())
            .expect("test save must contain a right-hand weapon");
        let slots = article.slots.as_mut().expect("weapon must contain slots");
        assert!(slots[0].gem.is_some(), "fixture slot must hold a gem");
        // An open slot without a Gem is a normal game state.
        slots[0].gem = None;
        assert!(empty_slot_save.validate_game_load_safety().is_ok());

        let mut closed_slot_save = build_save_data("testsave9");
        let article = closed_slot_save
            .inventory
            .articles
            .get_mut(&ArticleType::RightHand)
            .and_then(|articles| articles.first_mut())
            .expect("test save must contain a right-hand weapon");
        article.slots.as_mut().expect("weapon must contain slots")[0].shape = SlotShape::Closed;
        assert!(closed_slot_save.validate_game_load_safety().is_err());
    }
}

mod direct_armor_header_regression_tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;

    #[test]
    fn direct_armor_header_matches_the_native_safe_default() {
        let mut save = build_save_data("testsave9");
        let native_armor = save
            .inventory
            .articles
            .get(&ArticleType::Armor)
            .and_then(|armors| {
                armors.iter().find_map(|armor| {
                    let offset = (save.file.offsets.equipped_gems.0
                        ..save.file.offsets.username - 147)
                        .find(|offset| {
                            save.file.bytes[*offset..*offset + 4] == armor.first_part.to_le_bytes()
                                && save.file.bytes[*offset + 4..*offset + 8]
                                    == armor.second_part.to_le_bytes()
                        })?;
                    (u32::from_le_bytes(
                        save.file.bytes[offset + 8..offset + 12].try_into().unwrap(),
                    ) == 1)
                        .then(|| armor.clone())
                })
            })
            .expect("test save must contain an armor block with header value one");

        let reserved_offset = save.file.offsets.equipped_gems.1 + 1;
        fill_reservation(&mut save.file.bytes, reserved_offset..reserved_offset + 60);
        save.add_direct_equipment(native_armor.id, true).unwrap();
        assert_eq!(
            u32::from_le_bytes(
                save.file.bytes[reserved_offset + 8..reserved_offset + 12]
                    .try_into()
                    .unwrap()
            ),
            1
        );
    }
}

mod load_regression_tests {
    use super::*;
    use crate::data_handling::offsets::Offsets;
    use std::{
        fs,
        panic::{self, AssertUnwindSafe},
        path::{Path, PathBuf},
        process,
    };

    fn temporary_save_path(test_name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "bloodborne-save-editor-{test_name}-{}.bin",
            process::id()
        ))
    }

    fn assert_rejected_without_panic(path: &Path) {
        let outcome = panic::catch_unwind(AssertUnwindSafe(|| {
            SaveData::build(path.to_str().unwrap(), PathBuf::from("resources"))
        }));
        assert!(outcome.is_ok(), "loading an invalid save must not panic");
        assert!(outcome.unwrap().is_err(), "invalid save must be rejected");
        assert!(
            !PathBuf::from(format!("{}.bak", path.display())).exists(),
            "rejected saves must not create a backup"
        );
    }

    fn cleanup(path: &Path) {
        let _ = fs::remove_file(path);
        let _ = fs::remove_file(format!("{}.bak", path.display()));
    }

    #[test]
    fn truncated_save_is_rejected_without_panic_or_backup() {
        let path = temporary_save_path("truncated-load");
        cleanup(&path);
        fs::write(&path, [0x00; 12]).unwrap();

        assert_rejected_without_panic(&path);
        cleanup(&path);
    }

    #[test]
    fn missing_coordinate_marker_is_rejected_without_panic_or_backup() {
        let mut bytes = fs::read("saves/testsave9").unwrap();
        let offsets = Offsets::build(&bytes).unwrap();
        // Coordinate discovery only searches after LCED. Clearing that suffix
        // guarantees the required marker is unavailable while preserving every
        // preceding parsed section of the valid fixture.
        bytes[offsets.lced_offset..].fill(0);

        let path = temporary_save_path("missing-coordinate-load");
        cleanup(&path);
        fs::write(&path, bytes).unwrap();

        assert_rejected_without_panic(&path);
        cleanup(&path);
    }

    #[test]
    fn valid_save_loads_without_panic_and_creates_backup_after_validation() {
        let path = temporary_save_path("valid-load");
        cleanup(&path);
        fs::copy("saves/testsave9", &path).unwrap();

        let outcome = panic::catch_unwind(AssertUnwindSafe(|| {
            SaveData::build(path.to_str().unwrap(), PathBuf::from("resources"))
        }));
        assert!(outcome.is_ok(), "valid save loading must not panic");
        assert!(
            outcome.unwrap().is_ok(),
            "valid save must load successfully"
        );
        assert!(
            PathBuf::from(format!("{}.bak", path.display())).exists(),
            "accepted saves must retain the automatic backup"
        );
        cleanup(&path);
    }
}

mod move_upgrades_tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;

    fn count(save: &SaveData, upgrade_type: UpgradeType, storage: bool) -> usize {
        let container = if storage {
            &save.storage
        } else {
            &save.inventory
        };
        container.upgrades.get(&upgrade_type).map_or(0, Vec::len)
    }

    #[test]
    fn moves_runes_to_storage_and_back() {
        let mut save = build_save_data("testsave5");
        let len = save.file.bytes.len();
        let runes = count(&save, UpgradeType::Rune, false);
        assert!(runes >= 3);
        let before_storage = count(&save, UpgradeType::Rune, true);
        let moved = save
            .move_upgrades(UpgradeType::Rune, vec![0, 2, 2, 1], Location::Inventory)
            .unwrap();
        assert_eq!(moved, 3);
        assert_eq!(count(&save, UpgradeType::Rune, false), runes - 3);
        assert_eq!(count(&save, UpgradeType::Rune, true), before_storage + 3);
        assert_eq!(save.file.bytes.len(), len);

        // The bytes reparse to the same lists.
        let path = std::env::temp_dir().join("bbse_move_upgrades_test");
        std::fs::write(&path, &save.file.bytes).unwrap();
        let reparsed =
            SaveData::build(path.to_str().unwrap(), save.file.resources_path.clone()).unwrap();
        assert_eq!(count(&reparsed, UpgradeType::Rune, false), runes - 3);
        assert_eq!(
            count(&reparsed, UpgradeType::Rune, true),
            before_storage + 3
        );

        let back: Vec<usize> = (before_storage..before_storage + 3).collect();
        save.move_upgrades(UpgradeType::Rune, back, Location::Storage)
            .unwrap();
        assert_eq!(count(&save, UpgradeType::Rune, false), runes);
        assert_eq!(count(&save, UpgradeType::Rune, true), before_storage);
    }

    #[test]
    fn rejects_invalid_indices_without_partial_changes_on_a_copy() {
        let save = build_save_data("testsave5");
        let mut candidate = save.clone();
        assert!(candidate
            .move_upgrades(UpgradeType::Rune, vec![0, 999], Location::Inventory)
            .is_err());
        // The command only commits the copy on success; the original is untouched.
        assert_eq!(
            count(&save, UpgradeType::Rune, false),
            count(&build_save_data("testsave5"), UpgradeType::Rune, false)
        );
    }
}

mod weapon_level_tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;

    fn weapons(save: &SaveData, storage: bool) -> Vec<Article> {
        let container = if storage {
            &save.storage
        } else {
            &save.inventory
        };
        [ArticleType::RightHand, ArticleType::LeftHand]
            .iter()
            .flat_map(|kind| container.articles.get(kind).cloned().unwrap_or_default())
            .collect()
    }

    #[test]
    fn upgrades_every_weapon_in_both_containers_keeping_variants() {
        for storage in [false, true] {
            let mut save = build_save_data("testsave8");
            let before = weapons(&save, storage);
            assert!(!before.is_empty());
            let (upgraded, skipped) = save.upgrade_all_weapons(storage, 10).unwrap();
            assert!(upgraded > 0, "storage={storage}");
            let after = weapons(&save, storage);
            for (old, new) in before.iter().zip(after.iter()) {
                let variant = |id: u32| (id % 100_000) - (id % 10_000);
                assert_eq!(
                    variant(old.second_part),
                    variant(new.second_part),
                    "{} keeps its variant",
                    old.info.item_name
                );
                assert_eq!(old.second_part / 100_000, new.second_part / 100_000);
                if crate::data_handling::inventory::weapon_is_upgradable(old.second_part) {
                    assert_eq!(
                        (new.second_part % 10_000) / 100,
                        10,
                        "{}",
                        old.info.item_name
                    );
                } else {
                    assert_eq!(
                        old.second_part, new.second_part,
                        "{} is left untouched",
                        old.info.item_name
                    );
                }
            }
            let _ = skipped;
            // Every weapon still matches its own equipment record (duplicates included).
            save.validate_game_load_safety().unwrap();
            let path = std::env::temp_dir().join(format!("bbse_upgrade_all_{storage}"));
            std::fs::write(&path, &save.file.bytes).unwrap();
            let reparsed =
                SaveData::build(path.to_str().unwrap(), save.file.resources_path.clone()).unwrap();
            assert_eq!(
                weapons(&reparsed, storage)
                    .iter()
                    .map(|weapon| weapon.second_part)
                    .collect::<Vec<_>>(),
                after
                    .iter()
                    .map(|weapon| weapon.second_part)
                    .collect::<Vec<_>>()
            );
        }
    }

    #[test]
    fn refuses_weapons_without_reinforced_versions_and_leaves_them_intact() {
        use crate::data_handling::inventory::weapon_is_upgradable;
        assert!(!weapon_is_upgradable(12_080_000), "Bloody Logarius' Wheel");
        assert!(!weapon_is_upgradable(900_000), "Adella's End-Quest Dagger");
        assert!(
            !weapon_is_upgradable(19_100_000),
            "Loch Shield disappears when reinforced"
        );
        assert!(!weapon_is_upgradable(19_100_500), "Loch Shield +5");
        assert!(weapon_is_upgradable(7_000_000));
        assert!(weapon_is_upgradable(7_010_300), "Uncanny Saw Cleaver +3");
    }
}

mod upgrade_allocation_tests {
    use super::*;
    use crate::data_handling::upgrades::{
        is_rune_source, is_unnamed_gem_source, rune_source_for_effect,
    };
    use crate::data_handling::utils::test_utils::build_save_data;
    use std::path::PathBuf;

    const FIXTURES: [&str; 10] = [
        "testsave0",
        "testsave1",
        "testsave2",
        "testsave3",
        "testsave4",
        "testsave5",
        "testsave6",
        "testsave7",
        "testsave8",
        "testsave9",
    ];

    fn reload(save: &SaveData, name: &str) -> SaveData {
        let path =
            std::env::temp_dir().join(format!("bbse_upgrade_alloc_{name}_{}", std::process::id()));
        save.file.save(path.to_str().unwrap()).unwrap();
        let reloaded = SaveData::build(path.to_str().unwrap(), PathBuf::from("resources")).unwrap();
        let _ = std::fs::remove_file(&path);
        let _ = std::fs::remove_file(path.with_extension("bak"));
        let _ = std::fs::remove_dir_all(PathBuf::from(format!("{}.backups", path.display())));
        reloaded
    }

    fn all_upgrades(save: &SaveData) -> Vec<Upgrade> {
        save.inventory
            .upgrades
            .values()
            .chain(save.storage.upgrades.values())
            .flatten()
            .cloned()
            .collect()
    }

    #[test]
    fn rune_item_ids_match_the_ones_found_in_real_saves() {
        let (mut checked, mut matched) = (0, 0);
        for name in FIXTURES {
            let save = build_save_data(name);
            let (start, end) = save.file.offsets.upgrades;
            for offset in (start..end).step_by(40) {
                let record = &save.file.bytes[offset..offset + 40];
                let source = u32::from_le_bytes(record[4..8].try_into().unwrap());
                let effect = u32::from_le_bytes(record[16..20].try_into().unwrap());
                if record[8] != 0x02 || (source & 0x7FFF_FFFF) > 999_999 {
                    continue;
                }
                if let Some(expected) = rune_source_for_effect(effect) {
                    checked += 1;
                    matched += usize::from(expected == source);
                }
            }
        }
        assert!(checked > 150, "only {checked} runes checked");
        assert!(
            matched * 100 >= checked * 98,
            "{matched}/{checked} rune ids match"
        );
        assert!(
            rune_source_for_effect(13_101).is_none(),
            "a Gem effect has no rune item"
        );
        assert!(is_rune_source(0x8001_86A1) && !is_rune_source(0x8001_6026));
    }

    #[test]
    fn gems_and_runes_get_new_records_when_none_can_be_reused() {
        for name in FIXTURES {
            let mut save = build_save_data(name);
            let length = save.file.bytes.len();
            let before = all_upgrades(&save).len();
            // Use up the reusable records first, then keep adding.
            let mut added = Vec::new();
            for round in 0..(save.safe_reusable_upgrade_record_count() + 3) {
                let location = if round % 2 == 0 {
                    Location::Inventory
                } else {
                    Location::Storage
                };
                let (kind, shape, effect) = if round % 3 == 0 {
                    (UpgradeType::Rune, "-", 1_107_002)
                } else {
                    (UpgradeType::Gem, "Droplet", 13_101)
                };
                match save.add_direct_upgrade(kind, shape.to_string(), vec![effect], location) {
                    Ok(upgrade) => added.push(upgrade),
                    Err(error) => panic!("{name} round {round}: {error}"),
                }
            }
            assert_eq!(
                save.file.bytes.len(),
                length,
                "{name}: the save size never changes"
            );
            let reloaded = reload(&save, name);
            let upgrades = all_upgrades(&reloaded);
            assert_eq!(
                upgrades.len(),
                before + added.len(),
                "{name}: every addition survives a reload"
            );
            for upgrade in &added {
                let stored = upgrades
                    .iter()
                    .find(|entry| entry.id == upgrade.id)
                    .expect("added upgrade is listed");
                match stored.upgrade_type {
                    UpgradeType::Rune => {
                        assert_eq!(Some(stored.source), rune_source_for_effect(1_107_002))
                    }
                    UpgradeType::Gem => {
                        assert!(
                            !is_rune_source(stored.source),
                            "{name}: gem keeps a gem item id"
                        );
                        assert!(
                            !is_unnamed_gem_source(stored.source),
                            "{name}: never a ?GemName? item id"
                        );
                    }
                }
            }
            reloaded.validate_game_load_safety().unwrap();
            assert!(crate::data_handling::ga::scan_for_insertion(
                &reloaded.file.bytes,
                reloaded.file.offsets.username
            )
            .is_ok());
        }
    }

    #[test]
    fn runes_accept_gem_effects_and_follow_their_first_rune_effect() {
        let mut save = build_save_data("testsave1");
        let rune = save
            .inventory
            .upgrades
            .get_mut(&UpgradeType::Rune)
            .unwrap()
            .first_mut()
            .unwrap();
        let rune_source = rune.source;
        // A Gem effect in first position keeps the rune's item id.
        rune.change_effect(&mut save.file, 13_101, 0).unwrap();
        assert_eq!(rune.source, rune_source);
        rune.change_effect(&mut save.file, 1_107_001, 0).unwrap();
        let (id, source) = (rune.id, rune.source);
        assert_eq!(Some(source), rune_source_for_effect(1_107_001));
        let reloaded = reload(&save, "rune_edit");
        let stored = all_upgrades(&reloaded)
            .into_iter()
            .find(|entry| entry.id == id)
            .unwrap();
        assert_eq!(
            stored.source, source,
            "record and inventory entry carry the rune item id"
        );
        let mixed = save
            .add_direct_upgrade(
                UpgradeType::Rune,
                "-".into(),
                vec![13_101, 1_107_001],
                Location::Inventory,
            )
            .unwrap();
        assert_eq!(mixed.effects[0].0, 13_101);
        assert_eq!(Some(mixed.source), rune_source_for_effect(1_107_001));
    }

    #[test]
    fn converting_between_gem_and_rune_changes_the_item_id() {
        let mut save = build_save_data("testsave1");
        let converted = save
            .transform_upgrade(UpgradeType::Gem, 0, Location::Inventory)
            .unwrap();
        assert_eq!(converted.upgrade_type, UpgradeType::Rune);
        assert!(is_rune_source(converted.source));
        let back = save
            .transform_upgrade(UpgradeType::Rune, converted.index, Location::Inventory)
            .unwrap();
        assert!(!is_rune_source(back.source));
        let reloaded = reload(&save, "transform");
        assert_eq!(
            all_upgrades(&reloaded)
                .into_iter()
                .find(|entry| entry.id == back.id)
                .unwrap()
                .source,
            back.source
        );
    }
}

mod bulk_action_tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;

    fn reload(save: &SaveData, name: &str) -> SaveData {
        // Unique per call: tests run in parallel and reuse the same save names.
        static NEXT: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
        let call = NEXT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let path =
            std::env::temp_dir().join(format!("bbse_bulk_{name}_{}_{call}", std::process::id()));
        save.file.save(path.to_str().unwrap()).unwrap();
        let reloaded =
            SaveData::inspect(path.to_str().unwrap(), PathBuf::from("resources")).unwrap();
        let _ = std::fs::remove_file(&path);
        reloaded
    }

    fn closed_slots(container: &Inventory) -> usize {
        [ArticleType::RightHand, ArticleType::LeftHand]
            .iter()
            .filter_map(|kind| container.articles.get(kind))
            .flatten()
            .filter_map(|article| article.slots.as_ref())
            .flat_map(|slots| slots.iter().take(WEAPON_GEM_SLOTS))
            .filter(|slot| slot.shape == SlotShape::Closed)
            .count()
    }

    #[test]
    fn opens_every_closed_weapon_slot_in_both_containers() {
        for name in ["testsave0", "testsave1", "testsave9"] {
            let mut save = build_save_data(name);
            for is_storage in [false, true] {
                let before = closed_slots(if is_storage {
                    &save.storage
                } else {
                    &save.inventory
                });
                let (_, opened) = save
                    .open_all_weapon_slots(is_storage, SlotShape::Radial, WEAPON_GEM_SLOTS)
                    .unwrap();
                assert_eq!(opened, before, "{name} storage={is_storage}");
            }
            let reloaded = reload(&save, name);
            assert_eq!(
                closed_slots(&reloaded.inventory) + closed_slots(&reloaded.storage),
                0,
                "{name}"
            );
            reloaded.validate_game_load_safety().unwrap();
            assert!(save
                .open_all_weapon_slots(false, SlotShape::Closed, WEAPON_GEM_SLOTS)
                .is_err());
        }
    }

    #[test]
    fn refills_vials_and_bullets_to_the_game_limits() {
        for name in ["testsave0", "testsave1", "testsave9"] {
            let mut save = build_save_data(name);
            save.refill_vials_and_bullets(false).unwrap();
            save.refill_vials_and_bullets(true).unwrap();
            assert_eq!(
                save.refill_vials_and_bullets(false).unwrap(),
                0,
                "{name}: second refill changes nothing"
            );
            let reloaded = reload(&save, name);
            for (container, limit) in [(&reloaded.inventory, 20), (&reloaded.storage, 600)] {
                for id in [1000, 900] {
                    let amount = container.articles[&ArticleType::Consumable]
                        .iter()
                        .find(|item| item.id == id)
                        .map(|item| item.amount);
                    assert_eq!(amount, Some(limit), "{name}: item {id}");
                }
            }
        }
    }
}

#[cfg(test)]
mod infinite_consumable_tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;

    #[test]
    fn infinite_consumables_round_trip_and_reload() {
        let mut save = build_save_data("testsave0");
        assert!(!save.infinite_consumables());
        assert_eq!(save.set_infinite_consumables(true).unwrap(), 2);
        assert!(save.infinite_consumables());
        assert_eq!(save.set_infinite_consumables(true).unwrap(), 0);

        let path = std::env::temp_dir().join(format!("bbse_infinite_{}", std::process::id()));
        save.file.save(path.to_str().unwrap()).unwrap();
        let mut reloaded = SaveData::inspect(
            path.to_str().unwrap(),
            std::path::PathBuf::from("resources"),
        )
        .unwrap();
        reloaded.validate_game_load_safety().unwrap();
        assert!(reloaded.infinite_consumables());
        // Refilling still works on the bare code.
        reloaded.refill_vials_and_bullets(false).unwrap();
        assert_eq!(reloaded.set_infinite_consumables(false).unwrap(), 2);
        assert!(!reloaded.infinite_consumables());
        let _ = std::fs::remove_file(&path);
    }
}
