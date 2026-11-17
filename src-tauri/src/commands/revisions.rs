//! Undo/redo history of the open save.

use crate::data_handling::save::SaveData;
use crate::{begin_revision, MutexSave, MAX_REVISION_HISTORY};
use serde_json::Value;

#[tauri::command]
pub(crate) fn start_revision(state_save: tauri::State<MutexSave>) -> Result<(), String> {
    begin_revision(state_save.inner())
}

#[tauri::command]
pub(crate) fn discard_revision(state_save: tauri::State<MutexSave>) {
    // A failed multi-step mutation may already have changed bytes. Restore the snapshot
    // captured by start_revision so a failed operation is atomic from the user’s view.
    if let (Ok(mut history), Ok(mut data)) = (state_save.history.lock(), state_save.data.lock()) {
        if let Some(snapshot) = history.past.pop() {
            *data = Some(snapshot);
        }
    }
}

pub(crate) fn undo_revision_inner(state_save: &MutexSave) -> Result<SaveData, String> {
    let mut history = state_save
        .history
        .lock()
        .map_err(|_| "Revision history is unavailable.".to_string())?;
    let mut data = state_save
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let previous = history
        .past
        .pop()
        .ok_or_else(|| "There is no change to undo.".to_string())?;
    let current = data
        .as_ref()
        .cloned()
        .ok_or_else(|| "Open a decrypted save before undoing a change.".to_string())?;

    history.future.push(current);
    if history.future.len() > MAX_REVISION_HISTORY {
        history.future.remove(0);
    }
    *data = Some(previous.clone());
    Ok(previous)
}

pub(crate) fn redo_revision_inner(state_save: &MutexSave) -> Result<SaveData, String> {
    let mut history = state_save
        .history
        .lock()
        .map_err(|_| "Revision history is unavailable.".to_string())?;
    let mut data = state_save
        .data
        .lock()
        .map_err(|_| "Save state is unavailable.".to_string())?;
    let next = history
        .future
        .pop()
        .ok_or_else(|| "There is no change to redo.".to_string())?;
    let current = data
        .as_ref()
        .cloned()
        .ok_or_else(|| "Open a decrypted save before redoing a change.".to_string())?;

    history.past.push(current);
    if history.past.len() > MAX_REVISION_HISTORY {
        history.past.remove(0);
    }
    *data = Some(next.clone());
    Ok(next)
}

#[tauri::command]
pub(crate) fn undo_revision(state_save: tauri::State<MutexSave>) -> Result<Value, String> {
    serde_json::to_value(undo_revision_inner(state_save.inner())?)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn redo_revision(state_save: tauri::State<MutexSave>) -> Result<Value, String> {
    serde_json::to_value(redo_revision_inner(state_save.inner())?)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod revision_history_tests {
    use super::*;
    use crate::commands::tools::{compare_flag_bytes, FlagDifference, NPC_FLAG_COMPARISON_LENGTH};
    use crate::data_handling::utils::test_utils::build_save_data;
    use crate::{MutexSave, SaveHistory};
    use std::sync::Mutex;

    #[test]
    fn revision_history_restores_and_reapplies_backend_bytes() {
        let original = build_save_data("testsave9");
        let state = MutexSave {
            data: Mutex::new(Some(original.clone())),
            history: Mutex::new(SaveHistory::default()),
        };

        begin_revision(&state).expect("the original save must be captured before mutation");
        let changed = {
            let mut data = state.data.lock().unwrap();
            let save = data.as_mut().unwrap();
            save.file.bytes[0] ^= 0x5A;
            save.clone()
        };

        let undone = undo_revision_inner(&state).expect("the saved snapshot must be restored");
        assert_eq!(undone.file, original.file);

        let redone = redo_revision_inner(&state).expect("the changed snapshot must be reapplied");
        assert_eq!(redone.file, changed.file);
    }

    #[test]
    fn npc_flag_comparison_reports_only_changed_relative_bytes() {
        let before = vec![0_u8; NPC_FLAG_COMPARISON_LENGTH];
        let mut after = before.clone();
        after[42] = 0x80;
        after[21_714] = 0x08;

        assert_eq!(
            compare_flag_bytes(&before, &after).unwrap(),
            vec![
                FlagDifference {
                    rel_offset: 42,
                    before_value: 0,
                    after_value: 0x80,
                },
                FlagDifference {
                    rel_offset: 21_714,
                    before_value: 0,
                    after_value: 0x08,
                },
            ],
        );
    }

    #[test]
    fn npc_flag_comparison_rejects_truncated_regions() {
        let truncated = vec![0_u8; NPC_FLAG_COMPARISON_LENGTH - 1];
        assert!(compare_flag_bytes(&truncated, &truncated).is_err());
    }
}
