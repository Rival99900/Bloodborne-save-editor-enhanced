//! PS4 bridge over FTP (F12). GoldHEN's FTP server (port 2121 by default,
//! anonymous login) gives access to the decrypted save that Apollo exports.
//! The editor downloads it into its cache, opens it like any local file, and
//! uploads it back on request. Only Bloodborne save files (`userdataNNNN`)
//! can be opened, replaced, imported or deleted; every other file is listed
//! read-only. A local copy is always taken before a save is overwritten or
//! deleted on the console. The same protocol works with PS5 FTP payloads
//! (etaHEN uses port 1337, ftpsrv 2121).

use std::{
    io::Cursor,
    net::{SocketAddr, ToSocketAddrs},
    path::{Path, PathBuf},
    str::FromStr,
    time::Duration,
};

use serde::Serialize;
use suppaftp::{list::File, types::FileType, FtpStream};

const TIMEOUT: Duration = Duration::from_secs(8);
/// A Bloodborne character save is about 1.3 MB; refuse anything far larger.
const MAX_DOWNLOAD: usize = 16 * 1024 * 1024;

/// Bloodborne title IDs (EU, US, Asia/JP and Game of the Year editions).
pub const BLOODBORNE_TITLE_IDS: [&str; 5] = ["CUSA00207", "CUSA00900", "CUSA01363", "CUSA03023", "CUSA03173"];

/// Folders where Apollo Save Tool exports decrypted saves, most specific first.
pub const SAVE_ROOTS: [&str; 5] = [
    "/data/apollo",
    "/data/fakeusb/PS4/APOLLO",
    "/mnt/usb0/PS4/APOLLO",
    "/mnt/usb1/PS4/APOLLO",
    "/mnt/sandbox",
];

#[derive(Serialize, Debug, Clone, PartialEq, Eq)]
pub struct RemoteEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: usize,
    /// True only for Bloodborne character saves; everything else is read-only.
    pub is_save: bool,
}

/// `userdata0000` to `userdata0009` (any four digits), as exported by Apollo.
pub fn is_save_name(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower
        .strip_prefix("userdata")
        .is_some_and(|digits| digits.len() == 4 && digits.bytes().all(|byte| byte.is_ascii_digit()))
}

fn file_name(remote: &str) -> &str {
    remote.rsplit('/').next().unwrap_or(remote)
}

fn require_save(remote: &str) -> Result<(), String> {
    if is_save_name(file_name(remote)) && !remote.contains("/../") { Ok(()) } else { Err("FTP_NOT_A_SAVE".into()) }
}

fn address(host: &str, port: u16) -> Result<SocketAddr, String> {
    let host = host.trim();
    if host.is_empty() {
        return Err("FTP_HOST_REQUIRED".into());
    }
    (host, port)
        .to_socket_addrs()
        .map_err(|_| "FTP_HOST_INVALID".to_string())?
        .next()
        .ok_or_else(|| "FTP_HOST_INVALID".to_string())
}

fn connect(host: &str, port: u16) -> Result<FtpStream, String> {
    let mut ftp = FtpStream::connect_timeout(address(host, port)?, TIMEOUT)
        .map_err(|_| "FTP_CONNECT_FAILED".to_string())?;
    let _ = ftp.get_ref().set_read_timeout(Some(TIMEOUT));
    let _ = ftp.get_ref().set_write_timeout(Some(TIMEOUT));
    ftp.login("anonymous", "anonymous").map_err(|_| "FTP_LOGIN_FAILED".to_string())?;
    ftp.transfer_type(FileType::Binary).map_err(|error| error.to_string())?;
    Ok(ftp)
}

fn join_remote(dir: &str, name: &str) -> String {
    if dir.ends_with('/') { format!("{dir}{name}") } else { format!("{dir}/{name}") }
}

fn list_in(ftp: &mut FtpStream, dir: &str) -> Result<Vec<RemoteEntry>, String> {
    let lines = ftp.list(Some(dir)).map_err(|_| "FTP_LIST_FAILED".to_string())?;
    let mut entries: Vec<RemoteEntry> = lines
        .iter()
        .filter_map(|line| File::from_str(line).ok())
        .filter(|file| file.name() != "." && file.name() != "..")
        .map(|file| RemoteEntry {
            name: file.name().to_string(),
            path: join_remote(dir, file.name()),
            is_dir: file.is_directory(),
            size: file.size(),
            is_save: !file.is_directory() && is_save_name(file.name()),
        })
        .collect();
    entries.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    Ok(entries)
}

/// Lists a remote folder, folders first then by name.
pub fn list(host: &str, port: u16, dir: &str) -> Result<Vec<RemoteEntry>, String> {
    let mut ftp = connect(host, port)?;
    let dir = if dir.trim().is_empty() { "/" } else { dir.trim() };
    let entries = list_in(&mut ftp, dir);
    let _ = ftp.quit();
    entries
}

fn is_bloodborne_dir(name: &str) -> bool {
    let upper = name.to_ascii_uppercase();
    BLOODBORNE_TITLE_IDS.iter().any(|id| upper.contains(id))
}

/// Every folder that holds Bloodborne saves on a PS4 (Apollo exports on the
/// internal drive and on USB drives, mounted save folders), most specific
/// first. Several copies of the same save can exist: the player chooses.
pub fn find_save_folders(host: &str, port: u16) -> Result<Vec<String>, String> {
    const MAX_FOLDERS: usize = 12;
    let mut ftp = connect(host, port)?;
    let mut found: Vec<String> = Vec::new();
    for root in SAVE_ROOTS {
        let Ok(entries) = list_in(&mut ftp, root) else { continue };
        if entries.iter().any(|entry| entry.is_save) {
            found.push(root.to_string());
        }
        // Apollo: <root>/<user id>/CUSA00900/ or <root>/<user>_CUSA00900_<dir>/.
        let mut queue: Vec<(String, u8)> = entries.iter().filter(|entry| entry.is_dir).map(|entry| (entry.path.clone(), 1)).collect();
        while let Some((dir, depth)) = queue.pop() {
            if found.len() >= MAX_FOLDERS {
                break;
            }
            if is_bloodborne_dir(file_name(&dir)) {
                let children = list_in(&mut ftp, &dir).unwrap_or_default();
                if children.iter().any(|entry| entry.is_save) {
                    found.push(dir);
                } else if let Some(nested) = children.iter().find(|entry| entry.is_dir && entry.name.eq_ignore_ascii_case("savedata0")) {
                    // Some exports keep the files in a `savedata0` sub-folder.
                    found.push(nested.path.clone());
                } else {
                    found.push(dir);
                }
                continue;
            }
            if depth < 2 && !root.starts_with("/mnt/sandbox") {
                if let Ok(children) = list_in(&mut ftp, &dir) {
                    queue.extend(children.into_iter().filter(|entry| entry.is_dir).map(|entry| (entry.path, depth + 1)));
                }
            }
        }
    }
    let _ = ftp.quit();
    found.dedup();
    Ok(found)
}

/// First folder found by [`find_save_folders`], or `/`.
#[cfg(test)]
pub fn find_save_root(host: &str, port: u16) -> Result<String, String> {
    Ok(find_save_folders(host, port)?.into_iter().next().unwrap_or_else(|| "/".to_string()))
}

pub fn download_bytes(host: &str, port: u16, remote: &str) -> Result<Vec<u8>, String> {
    require_save(remote)?;
    let mut ftp = connect(host, port)?;
    if let Ok(size) = ftp.size(remote) {
        if size > MAX_DOWNLOAD {
            return Err("FTP_FILE_TOO_LARGE".into());
        }
    }
    let buffer = ftp.retr_as_buffer(remote).map_err(|_| "FTP_DOWNLOAD_FAILED".to_string())?;
    let _ = ftp.quit();
    let bytes = buffer.into_inner();
    if bytes.is_empty() {
        return Err("FTP_FILE_EMPTY".into());
    }
    Ok(bytes)
}

/// Local copy of a remote file: `<cache>/ps4/<host>/<remote path with / as _>`.
pub fn local_path(cache: &Path, host: &str, remote: &str) -> PathBuf {
    let clean = |value: &str| -> String {
        value
            .chars()
            .map(|c| if c.is_ascii_alphanumeric() || c == '.' || c == '-' { c } else { '_' })
            .collect::<String>()
            .trim_matches('_')
            .to_string()
    };
    cache.join("ps4").join(clean(host)).join(clean(remote))
}

pub fn download_to(cache: &Path, host: &str, port: u16, remote: &str) -> Result<PathBuf, String> {
    let bytes = download_bytes(host, port, remote)?;
    let target = local_path(cache, host, remote);
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    std::fs::write(&target, bytes).map_err(|error| error.to_string())?;
    Ok(target)
}

/// Uploads `local` to `remote`. The console's current file is first added to
/// the local backup history of `local`, so it can be restored afterwards.
pub fn upload(host: &str, port: u16, local: &Path, remote: &str) -> Result<(), String> {
    require_save(remote)?;
    let bytes = std::fs::read(local).map_err(|error| error.to_string())?;
    if let Ok(current) = download_bytes(host, port, remote) {
        super::backups::record(local, &current).map_err(|error| error.to_string())?;
    }
    put_verified(host, port, remote, &bytes)
}

/// Writes `bytes` to `remote`, then reads the file back. Some console FTP
/// servers keep the old file when STOR targets an existing one: in that case
/// the file is deleted and written again. Fails if the console still differs.
fn put_verified(host: &str, port: u16, remote: &str, bytes: &[u8]) -> Result<(), String> {
    let mut ftp = connect(host, port)?;
    ftp.put_file(remote, &mut Cursor::new(bytes.to_vec())).map_err(|_| "FTP_UPLOAD_FAILED".to_string())?;
    let _ = ftp.quit();
    if download_bytes(host, port, remote).ok().as_deref() == Some(bytes) {
        return Ok(());
    }
    let mut ftp = connect(host, port)?;
    let _ = ftp.rm(remote);
    ftp.put_file(remote, &mut Cursor::new(bytes.to_vec())).map_err(|_| "FTP_UPLOAD_FAILED".to_string())?;
    let _ = ftp.quit();
    if download_bytes(host, port, remote).ok().as_deref() == Some(bytes) {
        Ok(())
    } else {
        Err("FTP_VERIFY_FAILED".to_string())
    }
}

/// Copies `source` (a local save) into the console folder `dir`, keeping the
/// file name. An existing console save with that name is backed up first
/// into the editor cache. Returns the remote path.
pub fn import(cache: &Path, host: &str, port: u16, source: &Path, dir: &str, name: Option<&str>) -> Result<String, String> {
    let name = match name {
        Some(name) => name.to_string(),
        None => source.file_name().map(|name| name.to_string_lossy().to_string()).unwrap_or_default(),
    };
    if !is_save_name(&name) {
        return Err("FTP_NOT_A_SAVE".into());
    }
    let remote = join_remote(dir.trim_end_matches('/'), &name);
    let remote = if remote.starts_with('/') { remote } else { format!("/{remote}") };
    let local = local_path(cache, host, &remote);
    if let Some(parent) = local.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    if let Ok(current) = download_bytes(host, port, &remote) {
        super::backups::record(&local, &current).map_err(|error| error.to_string())?;
    }
    let bytes = std::fs::read(source).map_err(|error| error.to_string())?;
    put_verified(host, port, &remote, &bytes)?;
    Ok(remote)
}

/// Deletes a console save after keeping a copy in the local backup history
/// of its cache file. Returns the local copy's path.
pub fn delete(cache: &Path, host: &str, port: u16, remote: &str) -> Result<PathBuf, String> {
    require_save(remote)?;
    let current = download_bytes(host, port, remote)?;
    let local = local_path(cache, host, remote);
    if let Some(parent) = local.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    // `record` skips a copy identical to the newest one: that copy is the backup.
    let kept = match super::backups::record(&local, &current).map_err(|error| error.to_string())? {
        Some(path) => path,
        None => super::backups::list(&local)
            .map_err(|error| error.to_string())?
            .first()
            .map(|entry| PathBuf::from(&entry.path))
            .ok_or_else(|| "FTP_DELETE_FAILED".to_string())?,
    };
    let mut ftp = connect(host, port)?;
    ftp.rm(remote).map_err(|_| "FTP_DELETE_FAILED".to_string())?;
    let _ = ftp.quit();
    Ok(kept)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn local_paths_stay_inside_the_cache() {
        let cache = Path::new("/cache");
        let path = local_path(cache, "192.168.1.20", "/mnt/usb0/../../etc/userdata0000");
        assert!(path.starts_with("/cache/ps4/192.168.1.20"));
        assert!(!path.to_string_lossy().contains("/../"));
        assert_eq!(join_remote("/data/", "a"), "/data/a");
        assert_eq!(join_remote("/data", "a"), "/data/a");
    }

    #[test]
    fn only_bloodborne_saves_are_editable() {
        for name in ["userdata0000", "USERDATA0009", "userdata1234"] {
            assert!(is_save_name(name), "{name}");
        }
        for name in ["userdata", "userdata0000.bak", "userdata00", "eboot.elf", "payload.js", "tool.py", "param.sfo", "userdata000a"] {
            assert!(!is_save_name(name), "{name}");
        }
        assert_eq!(require_save("/data/apollo/1/CUSA00900/payload.elf").unwrap_err(), "FTP_NOT_A_SAVE");
        assert_eq!(require_save("/data/../userdata0000").unwrap_err(), "FTP_NOT_A_SAVE");
        assert!(require_save("/data/apollo/1/CUSA00900/userdata0000").is_ok());
        // Refused before any network access.
        assert_eq!(download_bytes("127.0.0.1", 1, "/data/eboot.bin").unwrap_err(), "FTP_NOT_A_SAVE");
        assert_eq!(delete(Path::new("/tmp"), "127.0.0.1", 1, "/data/script.js").unwrap_err(), "FTP_NOT_A_SAVE");
        assert_eq!(
            import(Path::new("/tmp"), "127.0.0.1", 1, Path::new("/tmp/notes.txt"), "/data", None).unwrap_err(),
            "FTP_NOT_A_SAVE"
        );
    }

    #[test]
    fn rejects_empty_or_invalid_hosts() {
        assert_eq!(address("", 2121).unwrap_err(), "FTP_HOST_REQUIRED");
        assert!(address("not a host name", 2121).is_err());
    }

    /// Runs only when a test FTP server is available (BBSE_FTP_TEST=host:port:dir
    /// with a file named `userdata0000` in `dir`).
    #[test]
    fn round_trip_against_a_local_server_when_available() {
        let Ok(spec) = std::env::var("BBSE_FTP_TEST") else { return };
        let mut parts = spec.splitn(3, ':');
        let (host, port, dir) = (parts.next().unwrap(), parts.next().unwrap().parse().unwrap(), parts.next().unwrap());
        let entries = list(host, port, dir).unwrap();
        let file = entries.iter().find(|entry| entry.name == "userdata0000").expect("listed");
        let cache = std::env::temp_dir().join(format!("bbse-ftp-{}", std::process::id()));
        let local = download_to(&cache, host, port, &file.path).unwrap();
        let mut bytes = std::fs::read(&local).unwrap();
        bytes[0] ^= 0xFF;
        std::fs::write(&local, &bytes).unwrap();
        upload(host, port, &local, &file.path).unwrap();
        assert_eq!(download_bytes(host, port, &file.path).unwrap(), bytes);
        // The console's previous version was kept locally.
        assert_eq!(super::super::backups::list(&local).unwrap().len(), 1);

        // Non-save files are listed read-only.
        assert!(entries.iter().filter(|entry| !entry.is_dir).all(|entry| entry.is_save == is_save_name(&entry.name)));

        // Import a copy under another save name, then delete it.
        let source_dir = cache.join("import");
        std::fs::create_dir_all(&source_dir).unwrap();
        let source = source_dir.join("userdata0007");
        std::fs::write(&source, &bytes).unwrap();
        let remote = import(&cache, host, port, &source, dir, None).unwrap();
        // Sending under another save name (the open save into a chosen slot).
        let renamed = import(&cache, host, port, &source, dir, Some("userdata0008")).unwrap();
        assert!(renamed.ends_with("/userdata0008"));
        assert_eq!(download_bytes(host, port, &renamed).unwrap(), bytes);
        delete(&cache, host, port, &renamed).unwrap();
        assert_eq!(import(&cache, host, port, &source, dir, Some("eboot.bin")).unwrap_err(), "FTP_NOT_A_SAVE");
        assert!(list(host, port, dir).unwrap().iter().any(|entry| entry.path == remote && entry.is_save));
        let kept = delete(&cache, host, port, &remote).unwrap();
        assert_eq!(std::fs::read(kept).unwrap(), bytes);
        assert!(!list(host, port, dir).unwrap().iter().any(|entry| entry.path == remote));

        // The saves folder is found from the console root.
        if let Ok(expected) = std::env::var("BBSE_FTP_ROOT") {
            assert_eq!(find_save_root(host, port).unwrap(), expected);
            // Every copy is listed (e.g. the internal export and a USB export).
            let folders = find_save_folders(host, port).unwrap();
            assert!(folders.contains(&expected), "{folders:?}");
            if let Ok(second) = std::env::var("BBSE_FTP_SECOND") {
                assert!(folders.contains(&second), "{folders:?}");
            }
        }
    }
}
