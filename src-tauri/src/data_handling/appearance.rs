use super::{enums::Error, file::FileData};
use std::{
    fs::{self, File},
    io::Read,
};

pub fn export(file_data: &FileData, path: &str) -> Result<(), Error> {
    let mut export_bytes = Vec::new();
    export_bytes.extend_from_slice(
        &file_data.bytes[file_data.offsets.appearance.0..=file_data.offsets.appearance.1],
    );

    fs::write(path, &export_bytes).map_err(Error::IoError)
}

pub fn import(file_data: &mut FileData, path: &str) -> Result<(), Error> {
    // Read the exported file into a vector of bytes
    let mut file = File::open(path).map_err(Error::IoError)?;
    let mut bytes = Vec::new();

    file.read_to_end(&mut bytes).map_err(Error::IoError)?;
    if bytes.len() != 0xEB {
        return Err(Error::CustomError("Not correct size"));
    }
    let start = file_data.offsets.appearance;
    for i in start.0..=start.1 {
        file_data.bytes[i] = bytes[i - start.0];
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data_handling::{constants::APPEARANCE_BYTES_AMOUNT, stats};
    use std::{env, fs, path::PathBuf, process};

    fn temporary_export_path(label: &str) -> PathBuf {
        env::temp_dir().join(format!(
            "bloodborne-save-editor-appearance-{}-{}.bin",
            process::id(),
            label
        ))
    }

    fn assert_export_matches(file_data: &FileData, path: &PathBuf) {
        let bytes = fs::read(path).unwrap();
        assert_eq!(bytes.len(), APPEARANCE_BYTES_AMOUNT);
        let start = file_data.offsets.appearance;
        assert_eq!(bytes, file_data.bytes[start.0..=start.1]);
    }

    #[test]
    fn test_export() {
        for (index, save_path) in [
            "saves/testsave0",
            "saves/testsave1",
            "saves/testsave2",
            "saves/testsave3",
        ]
        .into_iter()
        .enumerate()
        {
            let file_data = FileData::build(save_path, PathBuf::from("resources")).unwrap();
            let path = temporary_export_path(&format!("export-{index}"));
            export(&file_data, path.to_str().unwrap()).unwrap();
            assert_export_matches(&file_data, &path);
            let _ = fs::remove_file(path);
        }
    }

    #[test]
    fn import_preserves_all_character_statistics() {
        for (index, (target_save, source_save)) in [
            ("saves/testsave0", "saves/testsave3"),
            ("saves/testsave1", "saves/testsave2"),
            ("saves/testsave2", "saves/testsave1"),
            ("saves/testsave3", "saves/testsave0"),
        ]
        .into_iter()
        .enumerate()
        {
            let source_data = FileData::build(source_save, PathBuf::from("resources")).unwrap();
            let mut target_data = FileData::build(target_save, PathBuf::from("resources")).unwrap();
            let stats_before = stats::new(&target_data).unwrap();
            let path = temporary_export_path(&format!("statistics-{index}"));

            export(&source_data, path.to_str().unwrap()).unwrap();
            import(&mut target_data, path.to_str().unwrap()).unwrap();

            assert_eq!(
                stats::new(&target_data).unwrap(),
                stats_before,
                "face import must never change Health, Stamina, or any character statistic"
            );
            let _ = fs::remove_file(path);
        }
    }

    #[test]
    fn test_import() {
        for (index, (target_save, source_save)) in [
            ("saves/testsave0", "saves/testsave3"),
            ("saves/testsave1", "saves/testsave2"),
            ("saves/testsave2", "saves/testsave1"),
            ("saves/testsave3", "saves/testsave0"),
        ]
        .into_iter()
        .enumerate()
        {
            let source_data = FileData::build(source_save, PathBuf::from("resources")).unwrap();
            let mut target_data = FileData::build(target_save, PathBuf::from("resources")).unwrap();
            let path = temporary_export_path(&format!("import-{index}"));

            export(&source_data, path.to_str().unwrap()).unwrap();
            import(&mut target_data, path.to_str().unwrap()).unwrap();
            assert_export_matches(&target_data, &path);
            let _ = fs::remove_file(path);
        }

        let mut file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        let empty_path = temporary_export_path("empty");
        fs::write(&empty_path, []).unwrap();
        let result = import(&mut file_data, empty_path.to_str().unwrap());
        let _ = fs::remove_file(empty_path);
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(error.to_string(), "Save error: Not correct size");
        }
    }
}
