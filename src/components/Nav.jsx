import { invoke } from "@tauri-apps/api/core";
import { basename } from "@tauri-apps/api/path";
import { useState } from "react";
import * as dialog from "@tauri-apps/plugin-dialog";

function Nav({ setLoading, setSave, save }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  async function readFile() {
    try {
      const selectedPath = await dialog.open({
        multiple: false,
        title: "Open decrypted Bloodborne save",
      });

      if (!selectedPath) return;

      setStatus("");
      setLoading(true);
      const parsedSave = await invoke("make_save", { path: selectedPath });

      setSave(parsedSave);
      setName(await basename(selectedPath));
      setStatus("Save loaded. A backup was created before editing.");
    } catch (error) {
      console.error(error);
      setSave(null);
      setName("");
      setStatus("");
      await dialog.message(
        "The selected file could not be parsed. Choose a decrypted Bloodborne character save and try again.",
        {
          title: "Unable to open save",
          kind: "error",
        },
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    if (!save) return;

    const path = await dialog.save({
      title: "Save edited character",
      defaultPath: name || "USER_DATA",
    });

    if (!path) return;

    const shouldSave = await dialog.confirm(
      "This writes the current edits to the selected file. Keep the automatic .bak backup until you have verified the save in-game.",
      {
        title: "Confirm save",
        kind: "warning",
        okLabel: "Save changes",
        cancelLabel: "Cancel",
      },
    );

    if (!shouldSave) return;

    try {
      setLoading(true);
      const saved = await invoke("save", { path });
      setStatus(saved);
      await dialog.message(`${saved}\n\nKeep your .bak backup until the edited save has been verified.`, {
        title: "Save completed",
        kind: "info",
      });
    } catch (error) {
      console.error(error);
      setStatus("");
      await dialog.message(
        "The edited save could not be written. Check the destination and available permissions, then try again.",
        {
          title: "Unable to save",
          kind: "error",
        },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <nav className="nav" aria-label="Save file controls">
      <div className="brand-lockup">
        <img className="brand-mark" src="/assets/icon.png" alt="" />
        <div>
          <p className="brand-eyebrow">Bloodborne</p>
          <p className="brand-title">Save Editor</p>
        </div>
      </div>

      <div className="save-summary" aria-live="polite">
        <span className={`save-indicator ${save ? "is-loaded" : ""}`} aria-hidden="true" />
        <div>
          <p className="summary-label">{save ? "Active save" : "No save loaded"}</p>
          <p className="summary-value">{name || "Open a decrypted character file to begin"}</p>
          {status ? <p className="summary-status">{status}</p> : null}
        </div>
      </div>

      <div className="nav-actions">
        <button className="control-button control-button--quiet" id="openSave" onClick={readFile}>
          Open save
        </button>
        <button
          className="control-button control-button--primary"
          disabled={!save}
          onClick={saveChanges}
        >
          Save changes
        </button>
      </div>
    </nav>
  );
}

export default Nav;
