//! Offline Bloodborne-only subset of the Apollo Save Wizard format.
//! Reference: bucanero/apollo-lib 190e8f1718bd34fb5b081e05ecb982323510dcf8.
//! Only immutable bundled codes are accepted. No user scripts or raw offsets.
use serde::Serialize;
use std::collections::{BTreeMap, HashSet};

pub const DATABASE_REVISION: &str = "0b364df6211f508ebda83b5a86fb68c103258730";
const EU: &str = include_str!("../../resources/patches/CUSA00207.savepatch");
const US: &str = include_str!("../../resources/patches/CUSA00900.savepatch");

#[derive(Clone, Serialize, Debug)]
pub struct Patch {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub item_name: String,
    pub codes: String,
}
#[derive(Serialize)]
pub struct Catalog {
    pub title_ids: Vec<&'static str>,
    pub revision: &'static str,
    pub file_pattern: &'static str,
    pub patches: Vec<Patch>,
}
#[derive(Clone, Serialize, Debug)]
pub struct ByteChange {
    pub offset: usize,
    pub before: u8,
    pub after: u8,
}
#[derive(Clone, Serialize, Debug)]
pub struct PatchResult {
    pub id: String,
    pub changed_bytes: usize,
    pub matched_searches: usize,
    pub skipped_searches: usize,
}
#[derive(Clone, Serialize, Debug)]
pub struct Preview {
    pub title_id: String,
    pub game_version: String,
    pub changed_bytes: usize,
    pub changes: Vec<ByteChange>,
    pub results: Vec<PatchResult>,
}

pub fn catalog(title_id: &str) -> Result<Catalog, String> {
    let source = match title_id {
        "CUSA00207" => EU,
        "CUSA00900" => US,
        _ => return Err("patchErrors.title".into()),
    };
    let mut sections: Vec<(String, Vec<String>)> = Vec::new();
    for line in source.lines().map(str::trim) {
        if line.is_empty() || line.starts_with(';') || line.starts_with(':') {
            continue;
        }
        if line.starts_with('[') && line.ends_with(']') {
            sections.push((line[1..line.len() - 1].into(), Vec::new()));
        } else if let Some((_, lines)) = sections.last_mut() {
            lines.push(line.into());
        }
    }
    let mut seen = HashSet::new();
    let mut patches = Vec::new();
    for (name, lines) in sections {
        if lines.is_empty() {
            continue;
        }
        let codes = lines.join("\n");
        if !seen.insert(codes.clone()) {
            continue;
        }
        let kind = if name.starts_with("Max ") {
            "quantity"
        } else if name.starts_with("Turn Pebble") {
            "conversion"
        } else if name.starts_with("Revered ") {
            "coldblood"
        } else if name.starts_with("Guidance Rune") {
            "guidance"
        } else if name.starts_with("Isz ") {
            "isz"
        } else {
            "weapon"
        };
        let item_name = name
            .strip_prefix("Max ")
            .unwrap_or(&name)
            .split(" (Must")
            .next()
            .unwrap_or(&name)
            .split("+10")
            .next()
            .unwrap_or(&name)
            .replace('’', "'");
        patches.push(Patch {
            id: format!("{title_id}-{:03}", patches.len() + 1),
            name,
            kind: kind.into(),
            item_name,
            codes,
        });
    }
    Ok(Catalog {
        title_ids: vec!["CUSA00207", "CUSA00900"],
        revision: DATABASE_REVISION,
        file_pattern: "userdata00*",
        patches,
    })
}

fn words(line: &str) -> Result<(u32, u32), String> {
    let v: Vec<_> = line.split_whitespace().collect();
    if v.len() != 2
        || v.iter()
            .any(|s| s.len() != 8 || !s.bytes().all(|c| c.is_ascii_hexdigit()))
    {
        return Err("patchErrors.code".into());
    }
    Ok((
        u32::from_str_radix(v[0], 16).map_err(|_| "patchErrors.code")?,
        u32::from_str_radix(v[1], 16).map_err(|_| "patchErrors.code")?,
    ))
}
fn checked_range(offset: usize, len: usize, size: usize) -> Result<std::ops::Range<usize>, String> {
    let end = offset
        .checked_add(len)
        .filter(|e| *e <= size)
        .ok_or("patchErrors.bounds")?;
    Ok(offset..end)
}

// Deliberately stricter than libapollo: any invalid instruction/range rejects
// the whole candidate; an absent secondary quantity record may be skipped.
fn execute(data: &mut [u8], patch: &Patch) -> Result<(usize, usize), String> {
    let lines: Vec<_> = patch.codes.lines().map(words).collect::<Result<_, _>>()?;
    let mut pc = 0;
    let mut pointer: Option<usize> = None;
    let mut matched = 0;
    let mut skipped = 0;
    while pc < lines.len() {
        let (a, b) = lines[pc];
        pc += 1;
        let kind = a >> 28;
        let mode = (a >> 24) & 15;
        let offset = (a & 0x00ff_ffff) as usize;
        match kind {
            8 if mode == 0 => {
                let count = (((a >> 16) & 255) as usize).max(1);
                let len = (a & 65535) as usize;
                if !(1..=8).contains(&len) || count > 2 {
                    return Err("patchErrors.code".into());
                }
                let mut pattern = b.to_be_bytes().to_vec();
                if len > 4 {
                    let (c, d) = *lines.get(pc).ok_or("patchErrors.code")?;
                    pc += 1;
                    pattern.extend(c.to_be_bytes());
                    pattern.extend(d.to_be_bytes());
                }
                pattern.truncate(len);
                let hits: Vec<_> = data
                    .windows(len)
                    .enumerate()
                    .filter_map(|(i, w)| (w == pattern).then_some(i))
                    .take(4)
                    .collect();
                if hits.len() > 2 {
                    return Err("patchErrors.ambiguous".into());
                }
                pointer = hits.get(count - 1).copied();
                if pointer.is_some() {
                    matched += 1;
                } else {
                    skipped += 1;
                    if patch.kind != "quantity" {
                        return Err("patchErrors.missing".into());
                    }
                    // Apollo skips to the next absolute search on a failed search.
                    while pc < lines.len() && lines[pc].0 >> 24 != 0x80 {
                        pc += 1;
                    }
                }
            }
            0..=2 if mode == 8 => {
                let at = pointer
                    .ok_or("patchErrors.missing")?
                    .checked_add(offset)
                    .ok_or("patchErrors.bounds")?;
                let range = checked_range(at, 1usize << kind, data.len())?;
                data[range].copy_from_slice(&b.to_le_bytes()[..1usize << kind]);
            }
            9 if a == 0x92000000 => {
                let at = pointer
                    .ok_or("patchErrors.missing")?
                    .checked_add(b as usize)
                    .ok_or("patchErrors.bounds")?;
                checked_range(at, 1, data.len())?;
                pointer = Some(at);
            }
            13 if mode == 8 => {
                let at = pointer
                    .ok_or("patchErrors.missing")?
                    .checked_add(offset)
                    .ok_or("patchErrors.bounds")?;
                let skip = (b >> 24) as usize;
                let width = (b >> 20) & 15;
                let op = (b >> 16) & 15;
                let range = checked_range(at, if width == 1 { 1 } else { 2 }, data.len())?;
                let bytes = &data[range];
                let value = match width {
                    0 => u16::from_be_bytes([bytes[0], bytes[1]]),
                    1 => bytes[0] as u16,
                    2 => u16::from_le_bytes([bytes[0], bytes[1]]),
                    _ => return Err("patchErrors.code".into()),
                };
                let expected = if width == 1 { b as u8 as u16 } else { b as u16 };
                let pass = match op {
                    0 => value == expected,
                    1 => value != expected,
                    2 => value > expected,
                    3 => value < expected,
                    _ => return Err("patchErrors.code".into()),
                };
                if !pass {
                    pc = pc
                        .checked_add(skip)
                        .filter(|p| *p <= lines.len())
                        .ok_or("patchErrors.code")?;
                }
            }
            _ => return Err("patchErrors.code".into()),
        }
    }
    if matched == 0 {
        return Err("patchErrors.missing".into());
    }
    Ok((matched, skipped))
}

pub fn plan(
    bytes: &[u8],
    title_id: &str,
    game_version: &str,
    ids: &[String],
) -> Result<(Vec<u8>, Preview), String> {
    let cat = catalog(title_id)?;
    if game_version.len() > 12
        || !game_version
            .bytes()
            .all(|b| b.is_ascii_digit() || b == b'.')
    {
        return Err("patchErrors.version".into());
    }
    if bytes.len() != 0x140000 {
        return Err("patchErrors.size".into());
    }
    if ids.is_empty() || ids.len() > 16 {
        return Err("patchErrors.selection".into());
    }
    let mut selected = HashSet::new();
    for id in ids {
        if !selected.insert(id) || !cat.patches.iter().any(|p| &p.id == id) {
            return Err("patchErrors.selection".into());
        }
    }
    let mut candidate = bytes.to_vec();
    let mut touched = BTreeMap::new();
    let mut results = Vec::new();
    // Canonical database order, independent of checkbox order.
    for patch in cat.patches.iter().filter(|p| selected.contains(&p.id)) {
        let before = candidate.clone();
        let (matched, skipped) = execute(&mut candidate, patch)?;
        let mut changed = 0;
        for (offset, (&a, &b)) in before.iter().zip(&candidate).enumerate() {
            if a != b {
                if let Some(old) = touched.insert(offset, b) {
                    if old != b {
                        return Err("patchErrors.conflict".into());
                    }
                }
                changed += 1;
            }
        }
        results.push(PatchResult {
            id: patch.id.clone(),
            changed_bytes: changed,
            matched_searches: matched,
            skipped_searches: skipped,
        });
    }
    let changes: Vec<_> = bytes
        .iter()
        .zip(&candidate)
        .enumerate()
        .filter_map(|(offset, (&before, &after))| {
            (before != after).then_some(ByteChange {
                offset,
                before,
                after,
            })
        })
        .collect();
    if changes.len() > 512 {
        return Err("patchErrors.bounds".into());
    }
    Ok((
        candidate,
        Preview {
            title_id: title_id.into(),
            game_version: game_version.into(),
            changed_bytes: changes.len(),
            changes,
            results,
        },
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn find(kind: &str, cusa: &str) -> Patch {
        catalog(cusa)
            .unwrap()
            .patches
            .into_iter()
            .find(|p| p.kind == kind)
            .unwrap()
    }
    #[test]
    fn catalogs_are_deduplicated_and_reject_other_titles() {
        assert!(catalog("CUSA03173").is_err());
        for c in ["CUSA00207", "CUSA00900"] {
            let cat = catalog(c).unwrap();
            let n = cat.patches.len();
            assert_eq!(
                n,
                cat.patches
                    .iter()
                    .map(|p| &p.codes)
                    .collect::<HashSet<_>>()
                    .len()
            );
            for p in cat.patches {
                for l in p.codes.lines() {
                    words(l).unwrap();
                }
            }
        }
    }
    #[test]
    fn quantities_use_two_little_endian_bytes_and_allow_one_record() {
        let p = find("quantity", "CUSA00207");
        let mut data = vec![0; 0x140000];
        data[100..108].copy_from_slice(&[0xb8, 0x0b, 0, 0x40, 1, 0, 0, 0]);
        let (out, report) = plan(&data, "CUSA00207", "01.09", &[p.id]).unwrap();
        assert_eq!(&out[104..108], &[0xe7, 3, 0, 0]);
        assert_eq!(report.changed_bytes, 2);
        assert_eq!(report.results[0].skipped_searches, 1);
        assert_eq!(data[104], 1);
    }
    #[test]
    fn missing_ambiguous_wrong_size_and_wrong_title_cannot_mutate_input() {
        let p = find("quantity", "CUSA00207");
        let mut data = vec![0; 0x140000];
        let orig = data.clone();
        assert!(plan(&data, "CUSA00207", "", &[p.id.clone()]).is_err());
        assert_eq!(data, orig);
        assert!(plan(&data[..10], "CUSA00207", "", &[p.id.clone()]).is_err());
        assert!(plan(&data, "CUSA00900", "", &[p.id.clone()]).is_err());
        for at in [100, 200, 300] {
            data[at..at + 4].copy_from_slice(&[0xb8, 11, 0, 64]);
        }
        assert_eq!(
            plan(&data, "CUSA00207", "", &[p.id]).unwrap_err(),
            "patchErrors.ambiguous"
        );
    }
    #[test]
    fn weapon_writes_match_documented_offsets() {
        let p = find("weapon", "CUSA00207");
        let mut data = vec![0; 200];
        data[40..44].copy_from_slice(&[0x80, 0x84, 0x1e, 0]);
        execute(&mut data, &p).unwrap();
        assert_eq!(&data[40..44], &[0x68, 0x88, 0x1e, 0]);
        for off in [0x10, 0x18, 0x20, 0x28, 0x30] {
            assert_eq!(&data[40 + off..44 + off], &[0x3f, 0, 0, 0]);
        }
    }
    #[test]
    fn isz_byte_tests_use_big_endian_and_skip_exactly() {
        let p = find("isz", "CUSA00207");
        for (old, expected) in [
            (0x30ffu16, 0x30ffu16),
            (0xbfff, 0xbf30),
            (0xc0ff, 0xc0ff),
            (0xc100, 0xc100),
        ] {
            let mut data = vec![0; 4096];
            data[20..28].copy_from_slice(&[3, 0, 0, 0, 5, 0, 1, 0]);
            let at = 20 + 0xdd1;
            data[at..at + 2].copy_from_slice(&old.to_be_bytes());
            execute(&mut data, &p).unwrap();
            assert_eq!(&data[at..at + 2], &expected.to_be_bytes());
        }
    }
    #[test]
    fn bounds_and_unknown_instructions_fail_closed() {
        let mut p = find("weapon", "CUSA00207");
        let mut data = vec![0x80, 0x84, 0x1e, 0];
        assert!(execute(&mut data, &p).is_err());
        p.codes = "F0000000 00000000".into();
        assert!(execute(&mut data, &p).is_err());
    }
}
