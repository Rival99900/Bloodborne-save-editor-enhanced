use super::{enums::Error, file::FileData};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Username {
    pub string: String,
}

impl Username {
    pub fn try_build(file_data: &FileData) -> Result<Username, Error> {
        let start = file_data
            .offsets
            .username
            .checked_add(1)
            .ok_or(Error::CustomError("Save username offset overflow."))?;
        let end = start
            .checked_add(32)
            .ok_or(Error::CustomError("Save username range overflow."))?;
        let username_bytes = file_data.bytes.get(start..end).ok_or(Error::CustomError(
            "Save username data is outside the file.",
        ))?;
        let mut chars: Vec<char> = Vec::with_capacity(16);
        username_bytes
            .iter()
            .step_by(2)
            .take_while(|&c| *c != 0)
            .for_each(|c| chars.push(*c as char));
        Ok(Username {
            string: chars.into_iter().collect(),
        })
    }

    #[cfg(test)]
    pub fn build(file_data: &FileData) -> Username {
        Self::try_build(file_data).expect("Username::build requires a validated save")
    }

    pub fn set(&mut self, file_data: &mut FileData, username: String) -> Result<(), Error> {
        if !(1..=16).contains(&username.len()) {
            return Err(Error::CustomError(
                "The new username must have between 1 and 16 characters.",
            ));
        }
        let start = file_data.offsets.username + 1;
        let username_bytes = username.as_bytes();
        for (i, j) in (start..start + 31).step_by(2).enumerate() {
            file_data.bytes[j] = match username_bytes.get(i) {
                Some(b) => *b,
                None => 0,
            };
        }
        self.string = username;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn username_build() {
        //testsave0
        let file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Proyectito"));

        //testsave1
        let file_data = FileData::build("saves/testsave1", PathBuf::from("resources")).unwrap();
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Toe Taster"));

        //testsave2
        let file_data = FileData::build("saves/testsave2", PathBuf::from("resources")).unwrap();
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("I'm Here To Help"));

        //testsave3
        let file_data = FileData::build("saves/testsave3", PathBuf::from("resources")).unwrap();
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Yeezy"));

        //testsave6
        let file_data = FileData::build("saves/testsave6", PathBuf::from("resources")).unwrap();
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Touch Me"));
    }

    #[test]
    fn username_set() {
        //testsave0
        let mut file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        let mut username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Proyectito"));
        username
            .set(&mut file_data, String::from("testsave0"))
            .unwrap();
        assert_eq!(username.string, String::from("testsave0"));
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("testsave0"));

        //testsave1
        let mut file_data = FileData::build("saves/testsave1", PathBuf::from("resources")).unwrap();
        let mut username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Toe Taster"));
        username
            .set(&mut file_data, String::from("testsave1"))
            .unwrap();
        assert_eq!(username.string, String::from("testsave1"));
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("testsave1"));

        //testsave2
        let mut file_data = FileData::build("saves/testsave2", PathBuf::from("resources")).unwrap();
        let mut username = Username::build(&file_data);
        assert_eq!(username.string, String::from("I'm Here To Help"));
        username
            .set(&mut file_data, String::from("testsave2"))
            .unwrap();
        assert_eq!(username.string, String::from("testsave2"));
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("testsave2"));

        //testsave3
        let mut file_data = FileData::build("saves/testsave3", PathBuf::from("resources")).unwrap();
        let mut username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Yeezy"));
        username
            .set(&mut file_data, String::from("testsave3"))
            .unwrap();
        assert_eq!(username.string, String::from("testsave3"));
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("testsave3"));

        //testsave6
        let mut file_data = FileData::build("saves/testsave6", PathBuf::from("resources")).unwrap();
        let mut username = Username::build(&file_data);
        assert_eq!(username.string, String::from("Touch Me"));
        username
            .set(&mut file_data, String::from("testsave6"))
            .unwrap();
        assert_eq!(username.string, String::from("testsave6"));
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("testsave6"));

        //Special cases
        let mut file_data = FileData::build("saves/testsave0", PathBuf::from("resources")).unwrap();
        let mut username = Username::build(&file_data);
        //Test using 0 characters
        let result = username.set(&mut file_data, String::from(""));
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Save error: The new username must have between 1 and 16 characters."
            );
        }
        //Test using 17 characters
        let result = username.set(&mut file_data, String::from("12345678901234567"));
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Save error: The new username must have between 1 and 16 characters."
            );
        }
        //Test using 1 characters
        username.set(&mut file_data, String::from("1")).unwrap();
        assert_eq!(username.string, String::from("1"));
        let mut username = Username::build(&file_data);
        assert_eq!(username.string, String::from("1"));
        //Test using 16 characters
        username.set(&mut file_data, String::from("16")).unwrap();
        assert_eq!(username.string, String::from("16"));
        let username = Username::build(&file_data);
        assert_eq!(username.string, String::from("16"));
    }
}
