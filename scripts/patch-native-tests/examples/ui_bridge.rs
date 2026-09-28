// Local browser validation bridge. No save command or output-file writes.
use bloodborne_patch_tests::data_handling::{patch_session::PatchSession, patches, save::SaveData};
use serde_json::{json, Value};
use std::{
    io::{self, BufRead, Write},
    path::PathBuf,
};
fn main() {
    let mut save = SaveData::build("saves/testsave9", PathBuf::from("resources")).unwrap();
    let mut session = PatchSession::default();
    let mut past = Vec::new();
    let mut future = Vec::new();
    for line in io::stdin().lock().lines() {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        let a = &request["args"];
        let result: Result<Value, String> = (|| {
            Ok(match request["cmd"].as_str().unwrap_or("") {
                "make_save" => {
                    save = SaveData::build("saves/testsave9", PathBuf::from("resources"))
                        .map_err(|e| e.to_string())?;
                    session.invalidate();
                    past.clear();
                    future.clear();
                    json!(save)
                }
                "bloodborne_patch_catalog" => {
                    json!(patches::catalog(a["titleId"].as_str().unwrap_or(""))?)
                }
                "preview_bloodborne_patches" => json!(session.preview(
                    &save,
                    a["titleId"].as_str().unwrap_or(""),
                    a["gameVersion"].as_str().unwrap_or(""),
                    &serde_json::from_value::<Vec<String>>(a["ids"].clone())
                        .map_err(|e| e.to_string())?
                )?),
                "apply_bloodborne_patches" => json!(session.apply(
                    &mut save,
                    a["token"].as_str().unwrap_or(""),
                    a["acknowledged"].as_bool().unwrap_or(false)
                )?),
                "start_revision" => {
                    past.push(save.clone());
                    future.clear();
                    Value::Null
                }
                "discard_revision" => {
                    if let Some(s) = past.pop() {
                        save = s;
                    }
                    Value::Null
                }
                "undo_revision" => {
                    future.push(save.clone());
                    save = past.pop().ok_or("no undo")?;
                    json!(save)
                }
                "redo_revision" => {
                    past.push(save.clone());
                    save = future.pop().ok_or("no redo")?;
                    json!(save)
                }
                "get_isz" => json!(save.file.get_isz()),
                "get_capacity_summary" => {
                    json!({"inventory_free":0,"storage_free":0,"gems_free":0,"runes_free":0,"shared_upgrade_pool":true})
                }
                "state" => json!(save),
                _ => Value::Null,
            })
        })();
        let response = match result {
            Ok(v) => json!({"ok":v}),
            Err(e) => json!({"error":e}),
        };
        println!("{}", response);
        io::stdout().flush().unwrap();
    }
}
