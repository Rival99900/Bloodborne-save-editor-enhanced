use super::enums::Error;
use super::file::FileData;
use serde::{Deserialize, Serialize};
use std::f32;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Coordinates {
    offset: usize,
    x: String,
    y: String,
    z: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Pos {
    pub coordinates: Coordinates,
    loaded_map: u32,
}

impl Pos {
    pub fn new(file: &FileData) -> Result<Pos, Error> {
        let map_bytes: [u8; 4] = file
            .bytes
            .get(4..8)
            .ok_or(Error::CustomError("Save is too short to contain map data."))?
            .try_into()
            .map_err(|_| Error::CustomError("Save map data has an invalid length."))?;
        Ok(Pos {
            coordinates: Coordinates::new(file)?,
            loaded_map: u32::from_le_bytes(map_bytes),
        })
    }
}

impl Coordinates {
    pub fn new(file: &FileData) -> Result<Coordinates, Error> {
        const COORDINATE_MARKER: [u8; 12] = [
            0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ];
        const COORDINATE_RECORD_SIZE: usize = 24;

        let bytes = &file.bytes;
        let lced_offset = file.offsets.lced_offset;
        let search_region = bytes
            .get(lced_offset..)
            .ok_or(Error::CustomError("Save has an invalid LCED offset."))?;

        for (relative_offset, record) in search_region.windows(COORDINATE_RECORD_SIZE).enumerate() {
            if record[..COORDINATE_MARKER.len()] != COORDINATE_MARKER {
                continue;
            }
            let x_bytes: [u8; 4] = record[12..16]
                .try_into()
                .map_err(|_| Error::CustomError("Coordinate X data has an invalid length."))?;
            let y_bytes: [u8; 4] = record[16..20]
                .try_into()
                .map_err(|_| Error::CustomError("Coordinate Y data has an invalid length."))?;
            let z_bytes: [u8; 4] = record[20..24]
                .try_into()
                .map_err(|_| Error::CustomError("Coordinate Z data has an invalid length."))?;
            let x = f32::from_le_bytes(x_bytes);
            let y = f32::from_le_bytes(y_bytes);
            let z = f32::from_le_bytes(z_bytes);

            return Ok(Coordinates {
                offset: lced_offset + relative_offset,
                x: format!("{:.3}", x),
                y: format!("{:.3}", y),
                z: format!("{:.3}", z),
            });
        }
        Err(Error::CustomError("Coordinates could not be found."))
    }

    pub fn edit(&self, file: &mut FileData, x: f32, y: f32, z: f32) {
        let bytes = &mut file.bytes;
        let coords = [
            f32::to_le_bytes(x),
            f32::to_le_bytes(y),
            f32::to_le_bytes(z),
        ];

        for i in 0..3 {
            bytes[self.offset + 12 + 4 * i..=self.offset + 15 + 4 * i].copy_from_slice(&coords[i]);
        }
    }
}

#[cfg(test)]
mod malformed_coordinate_reproduction {
    use super::*;
    use crate::data_handling::file::FileData;
    use std::path::PathBuf;

    #[test]
    fn coordinate_scan_returns_an_error_when_marker_is_missing() {
        let mut file = FileData::build("saves/testsave9", PathBuf::from("resources")).unwrap();
        file.bytes[file.offsets.lced_offset..].fill(0);
        assert!(Coordinates::new(&file).is_err());
    }
}
