//! Game catalogs embedded in the binary, parsed once.
//!
//! They used to be parsed again for every article and upgrade read, so a
//! reparse of a big save (after each added Gem or weapon) took about a second.

use serde_json::Value;
use std::sync::OnceLock;

fn cached(cell: &'static OnceLock<Value>, source: &str) -> &'static Value {
    cell.get_or_init(|| serde_json::from_str(source).expect("embedded catalog is valid JSON"))
}

pub fn items() -> &'static Value {
    static CELL: OnceLock<Value> = OnceLock::new();
    cached(&CELL, include_str!("../../resources/items.json"))
}

pub fn armors() -> &'static Value {
    static CELL: OnceLock<Value> = OnceLock::new();
    cached(&CELL, include_str!("../../resources/armors.json"))
}

pub fn weapons() -> &'static Value {
    static CELL: OnceLock<Value> = OnceLock::new();
    cached(&CELL, include_str!("../../resources/weapons.json"))
}

pub fn upgrades() -> &'static Value {
    static CELL: OnceLock<Value> = OnceLock::new();
    cached(&CELL, include_str!("../../resources/upgrades.json"))
}
