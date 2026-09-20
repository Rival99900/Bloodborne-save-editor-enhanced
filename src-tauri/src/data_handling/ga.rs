//! Typed GA record traversal, based on valentinoamato's upstream f562c289 fix.
//! Equipment: 60 bytes, upgrades: 40 bytes, vacancies: 8 bytes, 4096 slots.
use super::constants::START_TO_UPGRADE;

pub const GA_SECTION_SLOTS: usize = 4096;

pub struct Layout {
    pub empty: Option<usize>,
    pub max_handle: u16,
}

pub fn scan(bytes: &[u8], username: usize) -> Result<Layout, &'static str> {
    let boundary = username.checked_sub(151).ok_or("Invalid GA boundary.")?;
    let mut cursor = START_TO_UPGRADE;
    let mut empty = None;
    let mut max_handle = 0;
    for _ in 0..GA_SECTION_SLOTS {
        let header = bytes.get(cursor..cursor + 8).ok_or("Truncated GA record.")?;
        let kind = header[3];
        let size = match kind {
            0x80 | 0x90 => 60,
            0xC0 => {
                // The current upgrade parser supports a contiguous prefix.
                if empty.is_some() { return Err("Unsupported interleaved upgrade records."); }
                40
            }
            0x00 => {
                if header != [0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff] {
                    return Err("Invalid GA vacancy marker.");
                }
                empty.get_or_insert(cursor);
                8
            }
            _ => return Err("Invalid GA record type."),
        };
        if kind != 0 { max_handle = max_handle.max(u16::from_le_bytes([header[0], header[1]])); }
        cursor = cursor.checked_add(size).ok_or("GA offset overflow.")?;
        if cursor > boundary || cursor > bytes.len() { return Err("GA record exceeds section boundary."); }
    }
    if cursor != boundary { return Err("GA slot count does not match section boundary."); }
    Ok(Layout { empty, max_handle })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn empty_section() -> Vec<u8> {
        let mut bytes = vec![0; START_TO_UPGRADE];
        for _ in 0..GA_SECTION_SLOTS { bytes.extend([0, 0, 0, 0, 255, 255, 255, 255]); }
        bytes
    }
    #[test]
    fn rejects_truncation_unknown_types_and_wrong_slot_count() {
        let original = empty_section();
        let username = original.len() + 151;
        assert_eq!(scan(&original, username).unwrap().empty, Some(START_TO_UPGRADE));
        assert!(scan(&original[..original.len() - 1], username).is_err());
        assert!(scan(&original, username + 8).is_err());
        let mut bad = original; bad[START_TO_UPGRADE + 3] = 0x42;
        assert!(scan(&bad, username).is_err());
    }
}
