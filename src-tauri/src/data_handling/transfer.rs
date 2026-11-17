//! Import of an Inventory or Storage export (JSON or CSV parsed by the UI).
//!
//! The import only adds or raises: items are set to the exported amount,
//! missing equipment and missing Gems/Runes are added, nothing is removed.
//! Equipment and upgrades are compared by count, so importing the same file
//! twice adds nothing the second time. Callers run this on a copy of the save.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::{
    enums::{ArticleType, Error, Location, SlotShape, TypeFamily, UpgradeType},
    inventory::{weapon_is_upgradable, Inventory},
    save::SaveData,
    upgrades::Upgrade,
};

const NO_EFFECT: u32 = u32::MAX;
const MAX_WEAPON_LEVEL: u8 = 10;

#[derive(Deserialize, Debug, Clone)]
pub struct ImportItem {
    pub id: u32,
    pub amount: u32,
}

#[derive(Deserialize, Debug, Clone)]
pub struct ImportEquipment {
    pub id: u32,
    pub armor: bool,
    #[serde(default)]
    pub level: u8,
    /// Slot shapes and equipped Gems to restore. Empty: the piece keeps the
    /// slots the game gives it.
    #[serde(default)]
    pub slots: Vec<ImportSlot>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct ImportSlot {
    pub shape: SlotShape,
    #[serde(default)]
    pub gem: Option<ImportUpgrade>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct ImportUpgrade {
    pub upgrade_type: UpgradeType,
    pub shape: String,
    pub effects: Vec<u32>,
}

#[derive(Deserialize, Debug, Clone, Default)]
pub struct ContainerImport {
    #[serde(default)]
    pub items: Vec<ImportItem>,
    #[serde(default)]
    pub equipment: Vec<ImportEquipment>,
    #[serde(default)]
    pub upgrades: Vec<ImportUpgrade>,
}

#[derive(Serialize, Debug, Default, PartialEq, Eq)]
pub struct ImportReport {
    pub items_added: usize,
    pub items_updated: usize,
    pub equipment_added: usize,
    pub upgrades_added: usize,
    pub gems_equipped: usize,
    pub unchanged: usize,
    /// Gems/Runes with an effect the editor does not know (written by
    /// another tool): left out instead of failing the whole import.
    pub skipped: usize,
}

fn is_unknown_effect(error: &Error) -> bool {
    matches!(error, Error::CustomError(message) if message.contains("validated"))
}

/// Highest slot count the game reads on a weapon or armor piece.
const MAX_SLOTS: usize = 5;

/// Weapon ids carry the reinforcement level in their last four digits.
fn equipment_base(id: u32, armor: bool) -> u32 {
    if armor {
        id
    } else {
        id - id % 10_000
    }
}

fn signature(upgrade_type: UpgradeType, shape: &str, effects: &[u32]) -> String {
    let mut ids: Vec<u32> = effects
        .iter()
        .copied()
        .filter(|id| *id != NO_EFFECT)
        .collect();
    ids.sort_unstable();
    format!("{upgrade_type:?}|{shape}|{ids:?}")
}

fn upgrade_signature(upgrade: &Upgrade) -> String {
    let ids: Vec<u32> = upgrade.effects.iter().map(|(id, _)| *id).collect();
    signature(upgrade.upgrade_type, &upgrade.shape, &ids)
}

fn count_existing(container: &Inventory) -> (HashMap<u32, usize>, HashMap<String, usize>) {
    let mut equipment = HashMap::new();
    let mut upgrades = HashMap::new();
    for (article_type, articles) in &container.articles {
        let family: TypeFamily = (*article_type).into();
        if family == TypeFamily::Item {
            continue;
        }
        for article in articles {
            let base = equipment_base(article.id, family == TypeFamily::Armor);
            *equipment.entry(base).or_insert(0) += 1;
            for slot in article.slots.iter().flatten() {
                if let Some(gem) = &slot.gem {
                    *upgrades.entry(upgrade_signature(gem)).or_insert(0) += 1;
                }
            }
        }
    }
    for list in container.upgrades.values() {
        for upgrade in list {
            *upgrades.entry(upgrade_signature(upgrade)).or_insert(0) += 1;
        }
    }
    (equipment, upgrades)
}

fn container_mut(save: &mut SaveData, is_storage: bool) -> &mut Inventory {
    if is_storage {
        &mut save.storage
    } else {
        &mut save.inventory
    }
}

fn find_article(
    save: &SaveData,
    is_storage: bool,
    kind: ArticleType,
    first_part: u32,
) -> Result<usize, Error> {
    let container = if is_storage {
        &save.storage
    } else {
        &save.inventory
    };
    container
        .articles
        .get(&kind)
        .and_then(|list| {
            list.iter()
                .position(|article| article.first_part == first_part)
        })
        .ok_or(Error::CustomError(
            "ERROR: The imported equipment could not be found after adding it.",
        ))
}

impl SaveData {
    #[cfg(test)]
    pub fn import_container(
        &mut self,
        data: &ContainerImport,
        is_storage: bool,
    ) -> Result<ImportReport, Error> {
        self.import_container_with_progress(data, is_storage, &mut |_, _| {})
    }

    /// `progress(done, total)` is called after each entry of the file.
    pub fn import_container_with_progress(
        &mut self,
        data: &ContainerImport,
        is_storage: bool,
        progress: &mut dyn FnMut(usize, usize),
    ) -> Result<ImportReport, Error> {
        let mut report = ImportReport::default();
        let location = Location::from(is_storage);
        let total = data.items.len() + data.equipment.len() + data.upgrades.len();
        let mut done = 0;
        let mut step = || {
            done += 1;
            progress(done, total);
        };

        // Items: set the exported amount, add the missing ones.
        for item in &data.items {
            if item.amount == 0 {
                report.unchanged += 1;
                step();
                continue;
            }
            let existing = {
                let container = container_mut(self, is_storage);
                container
                    .articles
                    .iter()
                    .filter(|(kind, _)| TypeFamily::from(**kind) == TypeFamily::Item)
                    .flat_map(|(_, list)| list.iter())
                    .find(|article| article.id == item.id)
                    .map(|article| (article.number, article.amount))
            };
            let (file, container) = if is_storage {
                (&mut self.file, &mut self.storage)
            } else {
                (&mut self.file, &mut self.inventory)
            };
            match existing {
                Some((_, amount)) if amount == item.amount => report.unchanged += 1,
                Some((number, _)) => {
                    container.edit_item(file, number, item.id, item.amount, is_storage)?;
                    report.items_updated += 1;
                }
                None => {
                    container.add_item(file, item.id, item.amount, is_storage)?;
                    report.items_added += 1;
                }
            }
            step();
        }

        // Equipment and upgrades: add only what the file has in excess.
        let (mut equipment_count, mut upgrade_count) =
            count_existing(container_mut(self, is_storage));
        for equipment in &data.equipment {
            let base = equipment_base(equipment.id, equipment.armor);
            let have = equipment_count.entry(base).or_insert(0);
            if *have > 0 {
                *have -= 1;
                report.unchanged += 1;
                step();
                continue;
            }
            let added = self.add_experimental_equipment(base, equipment.armor, location)?;
            report.equipment_added += 1;
            let kind: ArticleType = added.article_type;
            let level = equipment.level.min(MAX_WEAPON_LEVEL);
            if !equipment.armor && level > 0 && weapon_is_upgradable(base) {
                let index = find_article(self, is_storage, kind, added.first_part)?;
                let container = container_mut_split(self, is_storage);
                container
                    .1
                    .change_weapon_level(container.0, kind, index, 0, is_storage, level)?;
            }
            for (slot_index, slot) in equipment.slots.iter().enumerate().take(MAX_SLOTS) {
                if slot.shape != SlotShape::Closed {
                    let index = find_article(self, is_storage, kind, added.first_part)?;
                    let (file, container) = container_mut_split(self, is_storage);
                    let article = container
                        .articles
                        .get_mut(&kind)
                        .and_then(|list| list.get_mut(index))
                        .ok_or(Error::CustomError("ERROR: Imported equipment is missing."))?;
                    let current = article
                        .slots
                        .as_ref()
                        .and_then(|slots| slots.get(slot_index))
                        .map(|current| current.shape);
                    if current.is_some() && current != Some(slot.shape) {
                        article.change_slot_shape(file, slot_index, slot.shape)?;
                    }
                }
                let Some(gem) = &slot.gem else { continue };
                if slot.shape == SlotShape::Closed || gem.upgrade_type != UpgradeType::Gem {
                    continue;
                }
                let upgrade = match self.add_direct_upgrade(
                    UpgradeType::Gem,
                    gem.shape.clone(),
                    gem.effects.clone(),
                    location,
                ) {
                    Ok(upgrade) => upgrade,
                    Err(error) if is_unknown_effect(&error) => {
                        report.skipped += 1;
                        continue;
                    }
                    Err(error) => return Err(error),
                };
                // add_direct_upgrade reparses the save: look everything up again.
                let index = find_article(self, is_storage, kind, added.first_part)?;
                let (file, container) = container_mut_split(self, is_storage);
                let upgrade_index = container
                    .upgrades
                    .get(&UpgradeType::Gem)
                    .and_then(|list| list.iter().position(|entry| entry.id == upgrade.id))
                    .ok_or(Error::CustomError(
                        "ERROR: The imported Gem could not be found.",
                    ))?;
                container.equip_gem(file, upgrade_index, kind, index, slot_index, is_storage)?;
                report.gems_equipped += 1;
            }
            step();
        }
        for upgrade in &data.upgrades {
            let key = signature(upgrade.upgrade_type, &upgrade.shape, &upgrade.effects);
            let have = upgrade_count.entry(key).or_insert(0);
            if *have > 0 {
                *have -= 1;
                report.unchanged += 1;
                step();
                continue;
            }
            match self.add_direct_upgrade(
                upgrade.upgrade_type,
                upgrade.shape.clone(),
                upgrade.effects.clone(),
                location,
            ) {
                Ok(_) => report.upgrades_added += 1,
                Err(error) if is_unknown_effect(&error) => report.skipped += 1,
                Err(error) => return Err(error),
            }
            step();
        }
        Ok(report)
    }
}

fn container_mut_split(
    save: &mut SaveData,
    is_storage: bool,
) -> (&mut super::file::FileData, &mut Inventory) {
    if is_storage {
        (&mut save.file, &mut save.storage)
    } else {
        (&mut save.file, &mut save.inventory)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;
    use std::path::PathBuf;

    fn export(container: &Inventory) -> ContainerImport {
        let mut data = ContainerImport::default();
        for (kind, list) in &container.articles {
            let family: TypeFamily = (*kind).into();
            for article in list {
                match family {
                    TypeFamily::Item => data.items.push(ImportItem {
                        id: article.id,
                        amount: article.amount,
                    }),
                    _ => data.equipment.push(ImportEquipment {
                        id: article.id,
                        armor: family == TypeFamily::Armor,
                        level: ((article.id % 10_000) / 100) as u8,
                        slots: article
                            .slots
                            .iter()
                            .flatten()
                            .map(|slot| ImportSlot {
                                shape: slot.shape,
                                gem: slot.gem.as_ref().map(as_import),
                            })
                            .collect(),
                    }),
                }
            }
        }
        for list in container.upgrades.values() {
            for upgrade in list {
                data.upgrades.push(as_import(upgrade));
            }
        }
        data
    }

    fn as_import(upgrade: &Upgrade) -> ImportUpgrade {
        ImportUpgrade {
            upgrade_type: upgrade.upgrade_type,
            shape: upgrade.shape.clone(),
            effects: upgrade.effects.iter().map(|(id, _)| *id).collect(),
        }
    }

    #[test]
    fn weapons_come_back_with_their_slots_and_gems() {
        let mut save = build_save_data("testsave0");
        let source = export(&save.inventory);
        let with_gems: Vec<ImportEquipment> = source
            .equipment
            .iter()
            .filter(|piece| !piece.armor && piece.slots.iter().any(|slot| slot.gem.is_some()))
            .take(2)
            .cloned()
            .collect();
        assert!(!with_gems.is_empty(), "testsave0 has weapons with Gems");
        // Storage starts without these weapons: drop them there first.
        let data = ContainerImport {
            equipment: with_gems.clone(),
            ..Default::default()
        };
        let before = save.storage.articles.values().flatten().count();
        let report = save.import_container(&data, true).unwrap();
        let gems: usize = with_gems
            .iter()
            .map(|piece| {
                piece
                    .slots
                    .iter()
                    .filter(|slot| slot.gem.is_some() && slot.shape != SlotShape::Closed)
                    .count()
            })
            .sum();
        let reloaded = reload(&save);
        assert!(reloaded.storage.articles.values().flatten().count() >= before);
        assert!(report.equipment_added > 0, "{report:?}");
        {
            assert_eq!(report.gems_equipped, gems);
            for piece in with_gems {
                let base = equipment_base(piece.id, false);
                let found = reloaded
                    .storage
                    .articles
                    .values()
                    .flatten()
                    .filter(|article| equipment_base(article.id, false) == base)
                    .any(|article| {
                        article.slots.as_ref().is_some_and(|slots| {
                            piece.slots.iter().zip(slots).all(|(want, have)| {
                                want.shape == have.shape
                                    && want.gem.as_ref().map(|gem| {
                                        signature(gem.upgrade_type, &gem.shape, &gem.effects)
                                    }) == have.gem.as_ref().map(upgrade_signature)
                            })
                        })
                    });
                assert!(found, "weapon {base} restored with its slots");
            }
        }
    }

    fn reload(save: &SaveData) -> SaveData {
        let path = std::env::temp_dir().join(format!("bbse_import_{}", std::process::id()));
        save.file.save(path.to_str().unwrap()).unwrap();
        let reloaded =
            SaveData::inspect(path.to_str().unwrap(), PathBuf::from("resources")).unwrap();
        let _ = std::fs::remove_file(&path);
        reloaded
    }

    #[test]
    fn reimporting_an_export_changes_nothing() {
        for name in ["testsave0", "testsave9"] {
            let mut save = build_save_data(name);
            for is_storage in [false, true] {
                let data = export(if is_storage {
                    &save.storage
                } else {
                    &save.inventory
                });
                let report = save.import_container(&data, is_storage).unwrap();
                assert_eq!(
                    report.items_added
                        + report.items_updated
                        + report.equipment_added
                        + report.upgrades_added,
                    0,
                    "{name} storage={is_storage}"
                );
            }
        }
    }

    #[test]
    fn import_into_storage_adds_and_a_second_import_is_a_no_op() {
        let mut save = build_save_data("testsave0");
        let mut data = export(&save.inventory);
        data.items.truncate(3);
        data.equipment.truncate(2);
        data.upgrades.truncate(2);
        let wanted = data.items.len() + data.equipment.len() + data.upgrades.len();
        let report = save.import_container(&data, true).unwrap();
        assert_eq!(
            report.items_added
                + report.items_updated
                + report.equipment_added
                + report.upgrades_added
                + report.unchanged,
            wanted
        );

        let mut reloaded = reload(&save);
        let again = reloaded.import_container(&data, true).unwrap();
        assert_eq!(again.unchanged, wanted);
        for item in &data.items {
            let amount = reloaded
                .storage
                .articles
                .values()
                .flatten()
                .find(|article| article.id == item.id)
                .map(|article| article.amount);
            assert_eq!(amount, Some(item.amount));
        }
    }

    #[test]
    fn unknown_effects_are_skipped_not_fatal() {
        let mut save = build_save_data("testsave0");
        let data = ContainerImport {
            upgrades: vec![ImportUpgrade {
                upgrade_type: UpgradeType::Gem,
                shape: "Radial".into(),
                effects: vec![165624],
            }],
            ..Default::default()
        };
        let report = save.import_container(&data, false).unwrap();
        assert_eq!((report.skipped, report.upgrades_added), (1, 0));
    }
}
