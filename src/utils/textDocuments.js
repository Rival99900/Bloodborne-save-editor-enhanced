import { invoke } from "@tauri-apps/api/core";

// Dialog-chosen JSON/CSV files go through the backend: the fs plugin scope
// only covers the home folder, so another drive (D:\ on Windows) failed.
export const readTextDocument = (path) => invoke("read_text_document", { path });
export const writeTextDocument = (path, contents) =>
  invoke("write_text_document", { path, contents });
