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
import { useLocalization } from "./i18n/localization";

function UnsavedChangesDialog({ onSave, onDiscard, onCancel, saving }) {
  const { t } = useLocalization();

  return (
    <div className="unsaved-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
      <section className="unsaved-dialog__card">
        <span className="unsaved-dialog__eyebrow">{t("unsaved.eyebrow")}</span>
        <h2 id="unsaved-title">{t("unsaved.title")}</h2>
        <p>{t("unsaved.description")}</p>
        <div className="unsaved-dialog__actions">
          <button onClick={onCancel} disabled={saving}>{t("unsaved.cancel")}</button>
          <button className="unsaved-dialog__discard" onClick={onDiscard} disabled={saving}>
            {t("unsaved.discard")}
          </button>
          <button className="unsaved-dialog__save" onClick={onSave} disabled={saving}>
            {saving ? t("unsaved.saving") : t("unsaved.save")}
          </button>
        </div>
      </section>
    </div>
  );
}

function SaveFlowDialog({ tone = "warning", eyebrow, title, description, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className="save-flow-dialog" role="dialog" aria-modal="true" aria-labelledby="save-flow-title">
      <section className={`save-flow-dialog__card save-flow-dialog__card--${tone}`}>
        <span className="save-flow-dialog__eyebrow">{eyebrow}</span>
        <h2 id="save-flow-title">{title}</h2>
        <p>{description}</p>
        <div className="save-flow-dialog__actions">
          {cancelLabel ? <button onClick={onCancel}>{cancelLabel}</button> : null}
          <button className={tone === "error" ? "save-flow-dialog__primary save-flow-dialog__primary--error" : "save-flow-dialog__primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function App() {
  const { t } = useLocalization();
  const [save, setSave] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveStatusKey, setSaveStatusKey] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [exitRequested, setExitRequested] = useState(false);
  const [openSaveDialog, setOpenSaveDialog] = useState("");
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
        setSaveStatusKey("saveFlow.unsavedStatus");
      } else {
        setDirtyState(false);
      }
    },
    [setDirtyState],
  );

  const chooseSaveFile = useCallback(async () => {
    try {
      const selectedPath = await dialog.open({
        multiple: false,
        title: t("saveFlow.openTitle"),
      });
      if (!selectedPath) return false;

      setSaveStatusKey("");
      setLoading(true);
      const parsedSave = await invoke("make_save", { path: selectedPath });
      setSave(parsedSave);
      setSaveName(await basename(selectedPath));
      setSaveStatusKey("saveFlow.loadedStatus");
      setDirtyState(false);
      return true;
    } catch (error) {
      console.error(error);
      setOpenSaveDialog("error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [setDirtyState, t]);

  const openSave = useCallback(async () => {
    if (dirtyRef.current) {
      setOpenSaveDialog("discard");
      return false;
    }
    return chooseSaveFile();
  }, [chooseSaveFile]);

  const saveChanges = useCallback(async () => {
    if (!save) return false;

    const path = await dialog.save({
      title: t("saveFlow.saveTitle"),
      defaultPath: saveName || "USER_DATA",
    });
    if (!path) return false;

    const shouldSave = await dialog.confirm(
        t("saveFlow.confirmSaveDescription"),
        {
          title: t("saveFlow.confirmSaveTitle"),
          kind: "warning",
          okLabel: t("unsaved.save"),
          cancelLabel: t("unsaved.cancel"),
        },
    );
    if (!shouldSave) return false;

    try {
      setLoading(true);
      const saved = await invoke("save", { path });
      setSaveStatusKey("saveFlow.savedStatus");
      setSaveName(await basename(path));
      setDirtyState(false);
      await dialog.message(t("saveFlow.saveCompletedDescription"), {
        title: t("saveFlow.saveCompletedTitle"),
        kind: "info",
      });
      return true;
    } catch (error) {
      console.error(error);
      setSaveStatusKey("saveFlow.unsavedStatus");
      await dialog.message(t("saveFlow.saveFailedDescription"), {
        title: t("saveFlow.saveFailedTitle"),
        kind: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [save, saveName, setDirtyState, t]);

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
        if (forceCloseRef.current) return;

        // Always own the native close request. Without an open save there is no
        // dialog to display, so immediately use the explicitly authorized Tauri
        // exit path instead of relying on an implicit platform close.
        event.preventDefault();
        if (!dirtyRef.current) {
          void closeApplication();
          return;
        }

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
  }, [closeApplication]);

  return (
    <div className="App">
      <UpdateModal />
      {openSaveDialog === "discard" ? (
        <SaveFlowDialog
          eyebrow={t("unsaved.eyebrow")}
          title={t("saveFlow.discardOpenTitle")}
          description={t("saveFlow.discardOpenDescription")}
          confirmLabel={t("saveFlow.discardAndOpen")}
          cancelLabel={t("saveFlow.keepEditing")}
          onConfirm={() => {
            setOpenSaveDialog("");
            void chooseSaveFile();
          }}
          onCancel={() => setOpenSaveDialog("")}
        />
      ) : null}
      {openSaveDialog === "error" ? (
        <SaveFlowDialog
          tone="error"
          eyebrow={t("saveFlow.openTitle")}
          title={t("saveFlow.openFailedTitle")}
          description={t("saveFlow.openFailedDescription")}
          confirmLabel={t("saveFlow.close")}
          onConfirm={() => setOpenSaveDialog("")}
        />
      ) : null}
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
          statusKey={saveStatusKey}
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
