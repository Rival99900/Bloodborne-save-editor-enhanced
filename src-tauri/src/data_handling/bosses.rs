use super::file::FileData;
use serde::{Deserialize, Serialize};

use super::enums::Error;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Flag {
    rel_offset: usize,
    dead_value: u8,
    alive_value: u8,
    current_value: u8,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Boss {
    name: String,
    flags: Vec<Flag>,
}

pub fn new(file: &FileData) -> Result<Vec<Boss>, Error> {
    let bosses_str = include_str!("../../resources/bosses.json");

    let mut bosses: Vec<Boss> = serde_json::from_str(bosses_str)
        .map_err(|_| Error::CustomError("Failed to parse the bundled boss schema."))?;
    for boss in &mut bosses {
        for flag in &mut boss.flags {
            flag.current_value = file.get_flag(flag.rel_offset)?;
        }
    }

    Ok(bosses)
}
