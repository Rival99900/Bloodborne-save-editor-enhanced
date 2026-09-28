use bloodborne_patch_tests::data_handling::{file::FileData, patches};
use std::path::PathBuf;
fn main() {
    let mut rows = Vec::new();
    for fixture in ["testsave0", "testsave5", "testsave9"] {
        let file =
            FileData::build(&format!("saves/{fixture}"), PathBuf::from("resources")).unwrap();
        for cusa in ["CUSA00207", "CUSA00900"] {
            for p in patches::catalog(cusa).unwrap().patches {
                if let Ok((_, report)) = patches::plan(&file.bytes, cusa, "", &[p.id.clone()]) {
                    rows.push(serde_json::json!({"fixture":fixture,"id":p.id,"codes":p.codes,"changes":report.changes}));
                }
            }
        }
    }
    println!("{}", serde_json::to_string(&rows).unwrap());
}
