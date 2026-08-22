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
import RevisionPanel from "./components/RevisionPanel";

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

function SaveFlowDialog({ tone = "warning", eyebrow, title, description, confirmLabel, cancelLabel, onConfirm, onCancel, busy = false }) {
  return (
    <div className="save-flow-dialog" role="dialog" aria-modal="true" aria-labelledby="save-flow-title">
      <section className={`save-flow-dialog__card save-flow-dialog__card--${tone}`}>
        <span className="save-flow-dialog__eyebrow">{eyebrow}</span>
        <h2 id="save-flow-title">{title}</h2>
        <p>{description}</p>
        <div className="save-flow-dialog__actions">
          {cancelLabel ? <button onClick={onCancel} disabled={busy}>{cancelLabel}</button> : null}
          <button
            className={tone === "error" ? "save-flow-dialog__primary save-flow-dialog__primary--error" : "save-flow-dialog__primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

const MAX_REVISIONS = 100;
const DENSITY_STORAGE_KEY = "bloodborne-save-editor.interface-density.v1";

function readDensityPreference() {
  try {
    return globalThis.localStorage?.getItem(DENSITY_STORAGE_KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

function cloneSave(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function isEditableTarget(target) {
  return target instanceof HTMLElement && (
    target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

function countInventoryRecords(inventory, field) {
  return Object.values(inventory?.[field] ?? {}).reduce((total, records) => total + records.length, 0);
}

function buildRevisionSummary(baseline, current) {
  if (!baseline || !current) return [];
  const summary = [];
  const changedStats = (current.stats ?? []).filter((stat, index) => stat.value !== baseline.stats?.[index]?.value).length;
  if (changedStats) summary.push({ key: "revision.summaryStats", count: changedStats });
  if (baseline.username?.string !== current.username?.string) summary.push({ key: "revision.summaryUsername" });
  if (baseline.playtime !== current.playtime) summary.push({ key: "revision.summaryPlaytime" });
  if (JSON.stringify(baseline.position) !== JSON.stringify(current.position)) summary.push({ key: "revision.summaryPosition" });
  if (JSON.stringify(baseline.bosses) !== JSON.stringify(current.bosses)) summary.push({ key: "revision.summaryBosses" });
  for (const [kind, labelKey] of [["articles", "revision.summaryItems"], ["upgrades", "revision.summaryUpgrades"]]) {
    const inventoryDelta = countInventoryRecords(current.inventory, kind) - countInventoryRecords(baseline.inventory, kind);
    const storageDelta = countInventoryRecords(current.storage, kind) - countInventoryRecords(baseline.storage, kind);
    if (inventoryDelta || storageDelta) summary.push({ key: labelKey, count: Math.abs(inventoryDelta) + Math.abs(storageDelta) });
  }
  return summary;
}

function App() {
  const { t } = useLocalization();
  const [save, setSaveState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveStatusKey, setSaveStatusKey] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [exitRequested, setExitRequested] = useState(false);
  const [openSaveDialog, setOpenSaveDialog] = useState("");
  const [pendingSavePath, setPendingSavePath] = useState("");
  const [revisionState, setRevisionState] = useState({ past: [], future: [] });
  const [revisionPanelOpen, setRevisionPanelOpen] = useState(false);
  const [revisionEpoch, setRevisionEpoch] = useState(0);
  const [density, setDensity] = useState(readDensityPreference);
  const dirtyRef = useRef(false);
  const forceCloseRef = useRef(false);
  const closeAfterSaveRef = useRef(false);
  const saveRef = useRef(null);
  const baselineSaveRef = useRef(null);
  const revisionRef = useRef({ past: [], future: [] });
  const revisionQueueRef = useRef(Promise.resolve());

  const setDirtyState = useCallback((nextDirty) => {
    dirtyRef.current = nextDirty;
    setIsDirty(nextDirty);
  }, []);

  const resetRevisions = useCallback(() => {
    const emptyHistory = { past: [], future: [] };
    revisionRef.current = emptyHistory;
    setRevisionState(emptyHistory);
    setRevisionPanelOpen(false);
  }, []);

  const enqueueRevision = useCallback((operation) => {
    const queued = revisionQueueRef.current.then(operation, operation);
    revisionQueueRef.current = queued.catch(() => undefined);
    return queued;
  }, []);

  const commitEditorMutation = useCallback(
    (label, operation) => enqueueRevision(async () => {
      if (!saveRef.current || typeof operation !== "function") return null;

      await invoke("start_revision");
      try {
        const nextSave = await operation(cloneSave(saveRef.current));
        if (!nextSave) {
          await invoke("discard_revision");
          return null;
        }

        const nextSnapshot = cloneSave(nextSave);
        const entry = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          label: label || t("revision.genericChange"),
          timestamp: Date.now(),
        };
        const nextHistory = {
          past: [...revisionRef.current.past, entry].slice(-MAX_REVISIONS),
          future: [],
        };
        revisionRef.current = nextHistory;
        setRevisionState(nextHistory);
        saveRef.current = nextSnapshot;
        setSaveState(nextSnapshot);
        setDirtyState(true);
        setSaveStatusKey("saveFlow.unsavedStatus");
        return nextSnapshot;
      } catch (error) {
        await invoke("discard_revision").catch(() => undefined);
        throw error;
      }
    }),
    [enqueueRevision, setDirtyState, t],
  );

  const undoRevision = useCallback(() => enqueueRevision(async () => {
    const { past, future } = revisionRef.current;
    const latest = past.at(-1);
    if (!latest || !saveRef.current) return;

    try {
      const restored = cloneSave(await invoke("undo_revision"));
      const nextHistory = {
        past: past.slice(0, -1),
        future: [latest, ...future].slice(0, MAX_REVISIONS),
      };
      revisionRef.current = nextHistory;
      setRevisionState(nextHistory);
      saveRef.current = restored;
      setSaveState(restored);
      // Child screens keep canvas selections and draft state locally. Remount them
      // after a restored snapshot so the visible editor always matches Rust bytes.
      setRevisionEpoch((current) => current + 1);
      setDirtyState(true);
      setSaveStatusKey("saveFlow.unsavedStatus");
    } catch (error) {
      console.error("Unable to undo the last revision.", error);
    }
  }), [enqueueRevision, setDirtyState]);

  const redoRevision = useCallback(() => enqueueRevision(async () => {
    const { past, future } = revisionRef.current;
    const next = future.at(0);
    if (!next || !saveRef.current) return;

    try {
      const restored = cloneSave(await invoke("redo_revision"));
      const nextHistory = {
        past: [...past, next].slice(-MAX_REVISIONS),
        future: future.slice(1),
      };
      revisionRef.current = nextHistory;
      setRevisionState(nextHistory);
      saveRef.current = restored;
      setSaveState(restored);
      // Child screens keep canvas selections and draft state locally. Remount them
      // after a restored snapshot so the visible editor always matches Rust bytes.
      setRevisionEpoch((current) => current + 1);
      setDirtyState(true);
      setSaveStatusKey("saveFlow.unsavedStatus");
    } catch (error) {
      console.error("Unable to redo the revision.", error);
    }
  }), [enqueueRevision, setDirtyState]);

  const chooseSaveFile = useCallback(async () => {
    await revisionQueueRef.current;
    try {
      const selectedPath = await dialog.open({
        multiple: false,
        title: t("saveFlow.openTitle"),
      });
      if (!selectedPath) return false;

      setSaveStatusKey("");
      setLoading(true);
      const parsedSave = await invoke("make_save", { path: selectedPath });
      const loadedSnapshot = cloneSave(parsedSave);
      saveRef.current = loadedSnapshot;
      baselineSaveRef.current = cloneSave(loadedSnapshot);
      setSaveState(loadedSnapshot);
      // A newly opened file is a new editing session. Rebuild all routed screens
      // so no page keeps a draft or canvas from the previously opened save.
      setRevisionEpoch((current) => current + 1);
      resetRevisions();
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
  }, [resetRevisions, setDirtyState, t]);

  const openSave = useCallback(async () => {
    await revisionQueueRef.current;
    if (dirtyRef.current) {
      setOpenSaveDialog("discard");
      return false;
    }
    return chooseSaveFile();
  }, [chooseSaveFile]);

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

  const persistSave = useCallback(async (path) => {
    if (!path || !saveRef.current) return false;

    try {
      setLoading(true);
      await invoke("save", { path });
      baselineSaveRef.current = cloneSave(saveRef.current);
      setSaveStatusKey("saveFlow.savedStatus");
      setSaveName(await basename(path));
      setDirtyState(false);
      setPendingSavePath("");
      setOpenSaveDialog("save-complete");

      if (closeAfterSaveRef.current) {
        closeAfterSaveRef.current = false;
        setExitRequested(false);
        await closeApplication();
      }
      return true;
    } catch (error) {
      console.error(error);
      closeAfterSaveRef.current = false;
      setPendingSavePath("");
      setSaveStatusKey("saveFlow.unsavedStatus");
      setOpenSaveDialog("save-failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [closeApplication, setDirtyState]);

  const saveChanges = useCallback(async ({ closeAfterSave = false } = {}) => {
    await revisionQueueRef.current;
    if (!saveRef.current) return false;

    const path = await dialog.save({
      title: t("saveFlow.saveTitle"),
      defaultPath: saveName || "USER_DATA",
    });
    if (!path) return false;

    closeAfterSaveRef.current = closeAfterSave;
    setPendingSavePath(path);
    setOpenSaveDialog("confirm-save");
    return true;
  }, [saveName, t]);

  const discardAndClose = useCallback(async () => {
    await revisionQueueRef.current;
    setDirtyState(false);
    setExitRequested(false);
    await closeApplication();
  }, [closeApplication, setDirtyState]);

  const saveAndClose = useCallback(async () => {
    // Replace the unsaved-changes modal with the integrated save confirmation.
    // If the user cancels the file picker or the confirmation, they remain in the editor.
    setExitRequested(false);
    await saveChanges({ closeAfterSave: true });
  }, [saveChanges]);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(DENSITY_STORAGE_KEY, density);
    } catch {
      // This presentation preference is optional and never affects save editing.
    }
  }, [density]);

  useEffect(() => {
    const preventContextMenu = (event) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      const primaryModifier = event.ctrlKey || event.metaKey;
      const key = String(event.key ?? "").toLowerCase();
      if (primaryModifier && (key === "o" || event.code === "KeyO")) {
        event.preventDefault();
        openSave();
        return;
      }

      if (primaryModifier && (key === "s" || event.code === "KeyS")) {
        event.preventDefault();
        saveChanges();
        return;
      }

      // A browser-style reload discards the in-memory editor session. The desktop
      // editor therefore owns Ctrl/Cmd+R and keeps the current save and revisions.
      if (primaryModifier && (key === "r" || event.code === "KeyR")) {
        event.preventDefault();
        return;
      }

      if (!isEditableTarget(event.target) && primaryModifier && (key === "z" || event.code === "KeyZ")) {
        event.preventDefault();
        if (!event.repeat) {
          if (event.shiftKey) void redoRevision();
          else void undoRevision();
        }
        return;
      }

      if (!isEditableTarget(event.target) && primaryModifier && (key === "y" || event.code === "KeyY")) {
        event.preventDefault();
        if (!event.repeat) void redoRevision();
        return;
      }

      if (!primaryModifier || !["Equal", "Minus", "Digit0"].includes(event.code)) return;

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

    window.addEventListener("keydown", handleShortcut, true);
    return () => window.removeEventListener("keydown", handleShortcut, true);
  }, [openSave, redoRevision, saveChanges, undoRevision]);

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
        void revisionQueueRef.current.then(() => {
          if (forceCloseRef.current) return;
          if (!dirtyRef.current) {
            void closeApplication();
            return;
          }
          setExitRequested(true);
        });
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
    <div className={`App App--${density}`}>
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
      {openSaveDialog === "confirm-save" ? (
        <SaveFlowDialog
          eyebrow={t("saveFlow.saveTitle")}
          title={t("saveFlow.confirmSaveTitle")}
          description={t("saveFlow.confirmSaveDescription")}
          confirmLabel={loading ? t("unsaved.saving") : t("unsaved.save")}
          cancelLabel={t("unsaved.cancel")}
          busy={loading}
          onConfirm={() => {
            if (pendingSavePath && !loading) void persistSave(pendingSavePath);
          }}
          onCancel={() => {
            if (loading) return;
            closeAfterSaveRef.current = false;
            setPendingSavePath("");
            setOpenSaveDialog("");
          }}
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
      {openSaveDialog === "save-complete" ? (
        <SaveFlowDialog
          tone="success"
          eyebrow={t("saveFlow.saveTitle")}
          title={t("saveFlow.saveCompletedTitle")}
          description={t("saveFlow.saveCompletedDescription")}
          confirmLabel={t("saveFlow.close")}
          onConfirm={() => setOpenSaveDialog("")}
        />
      ) : null}
      {openSaveDialog === "save-failed" ? (
        <SaveFlowDialog
          tone="error"
          eyebrow={t("saveFlow.saveTitle")}
          title={t("saveFlow.saveFailedTitle")}
          description={t("saveFlow.saveFailedDescription")}
          confirmLabel={t("saveFlow.close")}
          onConfirm={() => setOpenSaveDialog("")}
        />
      ) : null}
      {revisionPanelOpen ? (
        <RevisionPanel
          entries={revisionState.past}
          summary={buildRevisionSummary(baselineSaveRef.current, save)}
          canUndo={revisionState.past.length > 0}
          canRedo={revisionState.future.length > 0}
          onUndo={undoRevision}
          onRedo={redoRevision}
          onClose={() => setRevisionPanelOpen(false)}
        />
      ) : null}
      {!openSaveDialog && exitRequested && isDirty ? (
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
          canUndo={revisionState.past.length > 0}
          canRedo={revisionState.future.length > 0}
          revisionCount={revisionState.past.length}
          onOpenSave={openSave}
          onSaveChanges={saveChanges}
          onUndo={undoRevision}
          onRedo={redoRevision}
          onShowRevisions={() => setRevisionPanelOpen(true)}
          density={density}
          onToggleDensity={() => setDensity((current) => current === "compact" ? "comfortable" : "compact")}
        />
        <ImagesProvider>
          <Main key={`save-revision-${revisionEpoch}`} save={save} setSave={commitEditorMutation} loading={loading} />
        </ImagesProvider>
      </Router>
    </div>
  );
}

export default App;
