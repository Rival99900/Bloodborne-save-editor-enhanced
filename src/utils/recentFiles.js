// Recently opened saves (F10), kept on this device only.
const STORAGE_KEY = "bloodborne-save-editor.recent-files.v1";
const MAX_RECENT = 8;

export function readRecentFiles() {
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((entry) => typeof entry?.path === "string") : [];
  } catch {
    return [];
  }
}

function write(entries) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Optional convenience: the editor works without local storage.
  }
  return entries;
}

// `remote` describes a PS4 file ({ host, port, path }) when the save came over FTP.
export function rememberRecentFile(path, name, remote = null) {
  const entry = { path, name: name || path, openedAt: Date.now(), ...(remote ? { remote } : {}) };
  return write([entry, ...readRecentFiles().filter((item) => item.path !== path)].slice(0, MAX_RECENT));
}

export function forgetRecentFile(path) {
  return write(readRecentFiles().filter((item) => item.path !== path));
}

export function clearRecentFiles() {
  return write([]);
}
