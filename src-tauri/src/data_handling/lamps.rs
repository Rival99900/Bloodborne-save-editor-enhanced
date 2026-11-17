//! Lamps (travel points) of the Hunter's Dream headstones. Each lamp is one bit
//! of the game's event flags, stored after the username like the boss flags.
//! Lamp table from Argagaes' lamp controls (Noxde/Bloodborne-save-editor#67).

use super::{constants::USERNAME_TO_AOB, enums::Error, file::FileData};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Lamp {
    pub name: String,
    #[serde(rename = "eventFlag")]
    pub event_flag: u32,
    pub offset: usize,
    pub mask: u8,
    pub area: String,
}

#[derive(Deserialize, Debug, Clone, Copy)]
pub struct LampChange {
    #[serde(rename = "eventFlag")]
    pub event_flag: u32,
    pub enabled: bool,
}

pub fn catalogue() -> &'static [Lamp] {
    static LAMPS: OnceLock<Vec<Lamp>> = OnceLock::new();
    LAMPS.get_or_init(|| {
        serde_json::from_str(include_str!("../../resources/lamps.json"))
            .expect("lamps.json is valid")
    })
}

/// File offset of a lamp bit, refused outside the event-flag area.
fn byte_offset(file: &FileData, lamp: &Lamp) -> Result<usize, Error> {
    let offset = file
        .offsets
        .username
        .checked_add(USERNAME_TO_AOB)
        .and_then(|base| base.checked_add(lamp.offset))
        .ok_or(Error::CustomError("Lamp flag offset overflow."))?;
    if lamp.mask.count_ones() != 1
        || offset >= file.bytes.len()
        || file.offsets.lced_offset == 0
        || offset >= file.offsets.lced_offset
    {
        return Err(Error::CustomError(
            "Lamp flags are outside this save's flag area.",
        ));
    }
    Ok(offset)
}

/// Offset (relative to the lamp table base) and bit of the "lighting
/// request" the game sets when a lamp is lit. It has to be cleared with the
/// lamp, otherwise the game refuses to light it again (the prompt just
/// disappears). Request groups follow the same map order as the lamps:
/// Central Yharnam and Great Bridge were tested in game by Argagaes, the other
/// maps are inferred (Noxde/Bloodborne-save-editor#67, commit 30cbd5b).
pub fn lighting_request(lamp: &Lamp) -> Result<(usize, u8), Error> {
    let suffix = lamp.event_flag % 1000;
    if suffix < 810 || !(suffix - 810).is_multiple_of(20) || (suffix - 810) / 20 > 19 {
        return Err(Error::CustomError("Invalid lamp flag."));
    }
    let bit = 200 + (suffix - 810) / 20;
    let offset = lamp
        .offset
        .checked_sub((suffix / 8) as usize)
        .and_then(|value| value.checked_sub(92_000))
        .and_then(|value| value.checked_add((bit / 8) as usize))
        .ok_or(Error::CustomError("Invalid lamp request offset."))?;
    Ok((offset, 0x80 >> (bit % 8)))
}

/// File offset of the lighting request of a lamp, refused outside the
/// event-flag area like the lamp bit itself.
fn request_offset(file: &FileData, lamp: &Lamp) -> Result<(usize, u8), Error> {
    let (relative, mask) = lighting_request(lamp)?;
    let offset = file
        .offsets
        .username
        .checked_add(USERNAME_TO_AOB)
        .and_then(|base| base.checked_add(relative))
        .ok_or(Error::CustomError("Lamp request offset overflow."))?;
    if offset >= file.bytes.len().min(file.offsets.lced_offset) {
        return Err(Error::CustomError(
            "Lamp request flags are outside this save's flag area.",
        ));
    }
    Ok((offset, mask))
}

/// Lit state of every lamp, in catalogue order.
pub fn states(file: &FileData) -> Result<Vec<bool>, Error> {
    catalogue()
        .iter()
        .map(|lamp| Ok(file.bytes[byte_offset(file, lamp)?] & lamp.mask != 0))
        .collect()
}

/// Lights or puts out the given lamps. Every change is checked before any byte
/// is written, so an unknown lamp leaves the save untouched.
pub fn apply(file: &mut FileData, changes: &[LampChange]) -> Result<Vec<bool>, Error> {
    let mut writes = Vec::with_capacity(changes.len());
    for change in changes {
        let lamp = catalogue()
            .iter()
            .find(|lamp| lamp.event_flag == change.event_flag)
            .ok_or(Error::CustomError("Unknown lamp."))?;
        writes.push((byte_offset(file, lamp)?, lamp.mask, change.enabled));
        // Putting a lamp out also clears its lighting request, so it can
        // be lit again in game.
        if !change.enabled {
            let (offset, mask) = request_offset(file, lamp)?;
            writes.push((offset, mask, false));
        }
    }
    for (offset, mask, enabled) in writes {
        if enabled {
            file.bytes[offset] |= mask;
        } else {
            file.bytes[offset] &= !mask;
        }
    }
    states(file)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn central_yharnam_lighting_requests() {
        // Values checked in game (Noxde/Bloodborne-save-editor#67).
        for (id, mask) in [(12417830, 0x40), (12417850, 0x20)] {
            let lamp = catalogue()
                .iter()
                .find(|lamp| lamp.event_flag == id)
                .unwrap();
            assert_eq!(lighting_request(lamp).unwrap(), (15902, mask));
        }
        // Every lamp has a request bit, and no request lands on a lamp bit.
        for lamp in catalogue() {
            let request = lighting_request(lamp).unwrap();
            assert!(catalogue()
                .iter()
                .all(|other| (other.offset, other.mask) != request));
        }
    }

    #[test]
    fn catalogue_has_unique_single_bit_flags() {
        let lamps = catalogue();
        assert_eq!(lamps.len(), 44);
        let mut keys: Vec<(usize, u8)> =
            lamps.iter().map(|lamp| (lamp.offset, lamp.mask)).collect();
        keys.sort();
        keys.dedup();
        assert_eq!(keys.len(), lamps.len(), "two lamps share a bit");
        assert!(lamps.iter().all(|lamp| lamp.mask.count_ones() == 1));
    }

    #[test]
    fn lamps_toggle_only_their_own_bit_and_survive_a_reload() {
        for name in ["testsave0", "testsave1", "testsave5", "testsave9"] {
            let mut file =
                FileData::build(&format!("saves/{name}"), PathBuf::from("resources")).unwrap();
            let before = file.bytes.clone();
            let initial = states(&file).unwrap();
            let lamps = catalogue();
            // Flip two lamps of the same byte group and one elsewhere.
            let picks = [0usize, 1, 20];
            let changes: Vec<LampChange> = picks
                .iter()
                .map(|&index| LampChange {
                    event_flag: lamps[index].event_flag,
                    enabled: !initial[index],
                })
                .collect();
            let after = apply(&mut file, &changes).unwrap();
            for (index, state) in after.iter().enumerate() {
                assert_eq!(
                    *state,
                    initial[index] ^ picks.contains(&index),
                    "{name} lamp {index}"
                );
            }
            // Only the lamp bits and, for lamps put out, their request bits.
            let mut allowed: Vec<usize> = Vec::new();
            for (change, &index) in changes.iter().zip(picks.iter()) {
                allowed.push(byte_offset(&file, &lamps[index]).unwrap());
                if !change.enabled {
                    allowed.push(request_offset(&file, &lamps[index]).unwrap().0);
                }
            }
            for (i, (old, new)) in before.iter().zip(&file.bytes).enumerate() {
                if old != new {
                    assert!(allowed.contains(&i), "{name}: unexpected byte {i} changed");
                }
            }
            // Restoring gives back the original bytes.
            let undo: Vec<LampChange> = changes
                .iter()
                .map(|c| LampChange {
                    enabled: !c.enabled,
                    ..*c
                })
                .collect();
            assert_eq!(apply(&mut file, &undo).unwrap(), initial, "{name}");
        }
    }

    #[test]
    fn unknown_lamps_change_nothing() {
        let mut file = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        let before = file.bytes.clone();
        let changes = [
            LampChange {
                event_flag: catalogue()[0].event_flag,
                enabled: true,
            },
            LampChange {
                event_flag: 1,
                enabled: true,
            },
        ];
        assert!(apply(&mut file, &changes).is_err());
        assert_eq!(file.bytes, before);
    }
}

#[cfg(test)]
mod request_tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn putting_a_lamp_out_clears_its_lighting_request() {
        let mut file = FileData::build("saves/testsave9", PathBuf::from("resources")).unwrap();
        let lamp = &catalogue()[0];
        let (offset, mask) = request_offset(&file, lamp).unwrap();
        file.bytes[offset] |= mask;
        let change = LampChange {
            event_flag: lamp.event_flag,
            enabled: false,
        };
        apply(&mut file, &[change]).unwrap();
        assert_eq!(file.bytes[offset] & mask, 0);
        // Lighting it again leaves the request alone (the game sets it).
        let change = LampChange {
            enabled: true,
            ..change
        };
        apply(&mut file, &[change]).unwrap();
        assert_eq!(file.bytes[offset] & mask, 0);
    }
}
