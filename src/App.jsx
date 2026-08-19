import "./App.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { basename } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import * as dialog from "@tauri-apps/plugin-dialog";
import { exit } from "@tauri-apps/plugin-process";
import Nav from "./components/Nav";
import Main from "./pages/main/Main";
import { ImagesProvider } from "./context/imagesContext";
import { UpdateModal } from "./Update";

function UnsavedChangesDialog({ onSave, onDiscard, onCancel, saving }) {
  return (
    <div className="unsaved-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
      <section className="unsaved-dialog__card">
        <span className="unsaved-dialog__eyebrow">Unsaved changes</span>
        <h2 id="unsaved-title">Save before closing?</h2>
        <p>
          Your current edits have not been written to a save file. Choose <strong>Save changes</strong>
          to keep them, or close without saving to discard them.
        </p>
        <div className="unsaved-dialog__actions">
          <button onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="unsaved-dialog__discard" onClick={onDiscard} disabled={saving}>
            Close without saving
          </button>
          <button className="unsaved-dialog__save" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [save, setSave] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [exitRequested, setExitRequested] = useState(false);
  const dirtyRef = useRef(false);
  const forceCloseRef = useRef(false);

  const setDirtyState = useCallback((nextDirty) => {
    dirtyRef.current = nextDirty;
    setIsDirty(nextDirty);
  }, []);

  const applyEditorSave = useCallback(
    (nextSave) => {
      setSave(nextSave);
      if (nextSave) {
        setDirtyState(true);
        setSaveStatus("Unsaved changes");
      } else {
        setDirtyState(false);
      }
    },
    [setDirtyState],
  );

  const openSave = useCallback(async () => {
    if (dirtyRef.current) {
      const discardCurrent = await dialog.confirm(
        "You have unsaved changes. Opening another save will discard the current edits.",
        {
          title: "Discard unsaved changes?",
          kind: "warning",
          okLabel: "Discard and open",
          cancelLabel: "Keep editing",
        },
      );
      if (!discardCurrent) return false;
    }

    try {
      const selectedPath = await dialog.open({
        multiple: false,
        title: "Open decrypted Bloodborne save",
      });
      if (!selectedPath) return false;

      setSaveStatus("");
      setLoading(true);
      const parsedSave = await invoke("make_save", { path: selectedPath });
      setSave(parsedSave);
      setSaveName(await basename(selectedPath));
      setSaveStatus("Save loaded. A backup was created before editing.");
      setDirtyState(false);
      return true;
    } catch (error) {
      console.error(error);
      setSave(null);
      setSaveName("");
      setSaveStatus("");
      setDirtyState(false);
      await dialog.message(
        "The selected file could not be parsed. Choose a decrypted Bloodborne character save and try again.",
        {
          title: "Unable to open save",
          kind: "error",
        },
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [setDirtyState]);

  const saveChanges = useCallback(async () => {
    if (!save) return false;

    const path = await dialog.save({
      title: "Save edited character",
      defaultPath: saveName || "USER_DATA",
    });
    if (!path) return false;

    const shouldSave = await dialog.confirm(
      "This writes the current edits to the selected file. Keep the automatic .bak backup until you have verified the save in-game.",
      {
        title: "Confirm save",
        kind: "warning",
        okLabel: "Save changes",
        cancelLabel: "Cancel",
      },
    );
    if (!shouldSave) return false;

    try {
      setLoading(true);
      const saved = await invoke("save", { path });
      setSaveStatus(saved);
      setSaveName(await basename(path));
      setDirtyState(false);
      await dialog.message(`${saved}\n\nKeep your .bak backup until the edited save has been verified.`, {
        title: "Save completed",
        kind: "info",
      });
      return true;
    } catch (error) {
      console.error(error);
      setSaveStatus("Unsaved changes");
      await dialog.message(
        "The edited save could not be written. Check the destination and available permissions, then try again.",
        {
          title: "Unable to save",
          kind: "error",
        },
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [save, saveName, setDirtyState]);

  const closeApplication = useCallback(async () => {
    forceCloseRef.current = true;
    setExitRequested(false);

    try {
      // This exits the Tauri process itself, so it cannot be intercepted again by
      // the regular window close guard that opened the unsaved-changes dialog.
      await exit(0);
    } catch (exitError) {
      console.error("Native application exit failed; trying the window fallback.", exitError);
      try {
        await getCurrentWindow().destroy();
      } catch (destroyError) {
        try {
          await getCurrentWindow().close();
        } catch (closeError) {
          console.error("Unable to close the application.", destroyError, closeError);
          window.close();
        }
      }
    }
  }, []);

  const discardAndClose = useCallback(async () => {
    setDirtyState(false);
    setExitRequested(false);
    await closeApplication();
  }, [closeApplication, setDirtyState]);

  const saveAndClose = useCallback(async () => {
    const didSave = await saveChanges();
    if (didSave) {
      setExitRequested(false);
      await closeApplication();
    }
  }, [closeApplication, saveChanges]);

  useEffect(() => {
    const preventContextMenu = (event) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.ctrlKey && event.code === "KeyO") {
        event.preventDefault();
        openSave();
        return;
      }

      if (event.ctrlKey && event.code === "KeyS") {
        event.preventDefault();
        saveChanges();
        return;
      }

      if (!event.ctrlKey || !["Equal", "Minus", "Digit0"].includes(event.code)) return;

      event.preventDefault();
      const currentZoom = Number.parseFloat(document.body.style.zoom) || 1;
      if (event.code === "Digit0") {
        document.body.style.zoom = "1";
        return;
      }

      const delta = event.code === "Equal" ? 0.1 : -0.1;
      document.body.style.zoom = String(
        Math.min(1.5, Math.max(0.8, Number((currentZoom + delta).toFixed(2)))),
      );
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [openSave, saveChanges]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (forceCloseRef.current || !dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    let unlisten;
    let disposed = false;

    getCurrentWindow()
      .onCloseRequested((event) => {
        if (forceCloseRef.current || !dirtyRef.current) return;
        event.preventDefault();
        setExitRequested(true);
      })
      .then((listener) => {
        if (disposed) listener();
        else unlisten = listener;
      })
      .catch((error) => console.error("Unable to register the close guard.", error));

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  return (
    <div className="App">
      <UpdateModal />
      {exitRequested && isDirty ? (
        <UnsavedChangesDialog
          saving={loading}
          onSave={saveAndClose}
          onDiscard={discardAndClose}
          onCancel={() => setExitRequested(false)}
        />
      ) : null}
      <Router>
        <Nav
          save={save}
          name={saveName}
          status={saveStatus}
          onOpenSave={openSave}
          onSaveChanges={saveChanges}
        />
        <ImagesProvider>
          <Main save={save} setSave={applyEditorSave} loading={loading} />
        </ImagesProvider>
      </Router>
    </div>
  );
}

export default App;
