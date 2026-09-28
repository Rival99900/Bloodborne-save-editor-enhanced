//! Preview tickets bind an immutable candidate to the exact current bytes.
use super::{
    patches::{self, Preview},
    save::SaveData,
};
use serde::Serialize;
#[derive(Serialize)]
pub struct Review {
    pub token: String,
    #[serde(flatten)]
    pub preview: Preview,
}
struct Pending {
    token: String,
    before: Vec<u8>,
    candidate: SaveData,
    changed: usize,
}
#[derive(Default)]
pub struct PatchSession {
    sequence: u64,
    pending: Option<Pending>,
}
impl PatchSession {
    pub fn invalidate(&mut self) {
        self.pending = None;
    }
    pub fn preview(
        &mut self,
        save: &SaveData,
        title_id: &str,
        game_version: &str,
        ids: &[String],
    ) -> Result<Review, String> {
        self.invalidate();
        let (bytes, preview) = patches::plan(&save.file.bytes, title_id, game_version, ids)?;
        validate_targets(save, title_id, ids, &preview)?;
        let candidate = save.from_patched_bytes(bytes)?;
        self.sequence = self.sequence.checked_add(1).ok_or("patchErrors.stale")?;
        let token = self.sequence.to_string();
        self.pending = Some(Pending {
            token: token.clone(),
            before: save.file.bytes.clone(),
            candidate,
            changed: preview.changed_bytes,
        });
        Ok(Review { token, preview })
    }
    pub fn apply(
        &mut self,
        save: &mut SaveData,
        token: &str,
        acknowledged: bool,
    ) -> Result<SaveData, String> {
        if !acknowledged {
            return Err("patchErrors.acknowledge".into());
        }
        let p = self.pending.as_ref().ok_or("patchErrors.stale")?;
        if p.token != token || p.before != save.file.bytes {
            return Err("patchErrors.stale".into());
        }
        if p.changed == 0 {
            return Err("patchErrors.unchanged".into());
        }
        let next = self.pending.take().ok_or("patchErrors.stale")?.candidate;
        *save = next;
        Ok(save.clone())
    }
}

// A byte-pattern match alone is not proof of the target field. Restrict every
// changed byte to fields the existing Bloodborne parser has independently found.
fn validate_targets(
    save: &SaveData,
    title_id: &str,
    ids: &[String],
    preview: &Preview,
) -> Result<(), String> {
    use super::constants::{START_TO_UPGRADE, USERNAME_TO_ISZ_GLITCH};
    use std::collections::HashSet;
    let cat = patches::catalog(title_id)?;
    let kinds: HashSet<_> = cat
        .patches
        .iter()
        .filter(|p| ids.contains(&p.id))
        .map(|p| p.kind.as_str())
        .collect();
    let mut allowed = HashSet::new();
    for (start, end) in [save.file.offsets.inventory, save.file.offsets.storage] {
        for record in (start..end).step_by(16) {
            if kinds.contains("quantity")
                && save.file.bytes.get(record + 14..record + 16) == Some(&[0, 0])
            {
                allowed.extend(record + 12..record + 14);
            }
            if kinds.contains("conversion")
                || kinds.contains("coldblood")
                || kinds.contains("guidance")
            {
                allowed.extend(record + 4..record + 12);
            }
        }
    }
    if kinds.contains("weapon") || kinds.contains("guidance") {
        super::ga::scan(&save.file.bytes, save.file.offsets.username)
            .map_err(|_| "patchErrors.structure")?;
        let boundary = save
            .file
            .offsets
            .username
            .checked_sub(151)
            .ok_or("patchErrors.structure")?;
        let mut cursor = START_TO_UPGRADE;
        while cursor < boundary {
            let kind = save.file.bytes[cursor + 3];
            match kind {
                0x80 | 0x90 => {
                    if kinds.contains("weapon") {
                        allowed.extend(cursor + 4..cursor + 8);
                        for slot in 0..5 {
                            allowed.extend(cursor + 20 + 8 * slot..cursor + 24 + 8 * slot);
                        }
                    }
                    cursor += 60;
                }
                0xc0 => {
                    if kinds.contains("guidance") {
                        allowed.extend(cursor + 4..cursor + 8);
                        allowed.extend(cursor + 16..cursor + 20);
                    }
                    cursor += 40;
                }
                0 => cursor += 8,
                _ => return Err("patchErrors.structure".into()),
            }
        }
    }
    if kinds.contains("isz") {
        allowed.insert(save.file.offsets.username + USERNAME_TO_ISZ_GLITCH + 1);
    }
    if preview.changes.iter().any(|c| !allowed.contains(&c.offset)) {
        return Err("patchErrors.structure".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data_handling::utils::test_utils::build_save_data;
    #[test]
    fn preview_is_read_only_and_apply_requires_current_ticket_and_acknowledgement() {
        let mut save = build_save_data("testsave9");
        let baseline = save.file.bytes.clone();
        let id = patches::catalog("CUSA00207")
            .unwrap()
            .patches
            .into_iter()
            .find(|p| p.name.starts_with("Max Twin"))
            .unwrap()
            .id;
        let mut session = PatchSession::default();
        let review = session
            .preview(&save, "CUSA00207", "01.09", &[id.clone()])
            .unwrap();
        assert_eq!(save.file.bytes, baseline);
        assert!(review.preview.changed_bytes > 0);
        assert!(session.apply(&mut save, &review.token, false).is_err());
        assert_eq!(save.file.bytes, baseline);
        assert!(session.apply(&mut save, "wrong", true).is_err());
        // A real intervening edit makes the old ticket unusable.
        save.file.bytes[0] ^= 1;
        assert!(session.apply(&mut save, &review.token, true).is_err());
        save.file.bytes = baseline.clone();
        let next = session.apply(&mut save, &review.token, true).unwrap();
        assert_ne!(next.file.bytes, baseline);
        assert!(session.apply(&mut save, &review.token, true).is_err());
        let restored = next.from_patched_bytes(baseline.clone()).unwrap();
        assert_eq!(restored.file.bytes, baseline);
        let after = session.preview(&save, "CUSA00207", "01.09", &[id]).unwrap();
        assert_eq!(after.preview.changed_bytes, 0);
        assert!(session.apply(&mut save, &after.token, true).is_err());
        session.invalidate();
        assert!(session.apply(&mut save, &after.token, true).is_err());
    }
    #[test]
    fn incomplete_item_conversion_is_rejected_without_mutation() {
        let save = build_save_data("testsave5");
        let baseline = save.file.bytes.clone();
        let p = patches::catalog("CUSA00900")
            .unwrap()
            .patches
            .into_iter()
            .find(|p| p.kind == "conversion")
            .unwrap();
        let (bytes, preview) = patches::plan(&baseline, "CUSA00900", "", &[p.id.clone()]).unwrap();
        assert!(preview.changed_bytes > 0);
        assert!(save.from_patched_bytes(bytes).is_err());
        let mut session = PatchSession::default();
        assert!(session.preview(&save, "CUSA00900", "", &[p.id]).is_err());
        assert_eq!(save.file.bytes, baseline);
    }
    #[test]
    fn failed_selection_and_wrong_fields_leave_save_unchanged() {
        let save = build_save_data("testsave9");
        let baseline = save.file.bytes.clone();
        let mut session = PatchSession::default();
        assert!(session
            .preview(&save, "CUSA03173", "01.09", &["CUSA00207-001".into()])
            .is_err());
        let preview = Preview {
            title_id: "CUSA00207".into(),
            game_version: String::new(),
            changed_bytes: 1,
            changes: vec![patches::ByteChange {
                offset: 0,
                before: 0,
                after: 1,
            }],
            results: vec![],
        };
        assert!(validate_targets(&save, "CUSA00207", &["CUSA00207-001".into()], &preview).is_err());
        assert_eq!(save.file.bytes, baseline);
    }
}
