import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useLocalization } from "../i18n/localization";
import useDialogFocus from "../utils/useDialogFocus";

const SETTINGS_KEY = "bloodborne-save-editor.ps4-ftp.v1";
// Default FTP ports: GoldHEN on PS4, etaHEN on PS5 (ftpsrv uses 2121 too).
export const CONSOLE_PORTS = { ps4: 2121, ps5: 1337 };
const DEFAULT_SETTINGS = { console: "ps4", host: "", port: CONSOLE_PORTS.ps4, dir: "/", lastDirs: {} };
const SAVE_SLOTS = Array.from({ length: 10 }, (_, index) => `userdata000${index}`);
const isSaveName = (name) => /^userdata\d{4}$/i.test(name ?? "");

function readSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(globalThis.localStorage?.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function errorKey(error) {
  const code = String(error ?? "");
  return code.startsWith("FTP_") ? `ps4.errors.${code}` : "ps4.errors.generic";
}

function baseName(path) {
  return String(path ?? "").split(/[\\/]/).pop();
}

// F12: browse the console over FTP (PS4 GoldHEN or PS5 etaHEN/ftpsrv), open a
// decrypted save, send it back, import a local save or delete one. Only
// Bloodborne saves (userdataNNNN) can be changed; other files are read-only.
// On PS4 the editor lists the folders Apollo exported saves to; Apollo has no
// PS5 version, so on PS5 browsing starts from the root (or the last folder).
function Ps4Dialog({ current, dirty, onOpenRemote, onClose }) {
  const { t } = useLocalization();
  const panelRef = useDialogFocus(onClose);
  const [settings, setSettings] = useState(readSettings);
  const [entries, setEntries] = useState(null);
  const [saveFolders, setSaveFolders] = useState([]);
  const [sendName, setSendName] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [confirmUpload, setConfirmUpload] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const port = Number(settings.port);

  function update(patch) {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      try { globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
  }

  function chooseConsole(name) {
    // Keep a custom port, but switch between the two known defaults.
    const known = Object.values(CONSOLE_PORTS).includes(port);
    update({ console: name, ...(known ? { port: CONSOLE_PORTS[name] } : {}) });
  }

  async function browse(dir) {
    setBusy(true); setStatus(null); setConfirmDelete(null); setSendName(null);
    try {
      const list = await invoke("ps4_ftp_list", { host: settings.host, port, dir });
      update({ dir, lastDirs: { ...(settings.lastDirs ?? {}), [`${settings.console}:${settings.host}`]: dir } });
      setEntries(list);
      return true;
    } catch (error) {
      setStatus({ tone: "error", text: t(errorKey(error)) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  // PS4: connecting goes straight to the Bloodborne saves (the folder used last
  // time on this console if it still holds saves, else the first one found).
  // PS5: Apollo does not exist there, so the last folder or the root is shown.
  async function connect() {
    setBusy(true); setStatus(null);
    const remembered = settings.lastDirs?.[`${settings.console}:${settings.host}`];
    if (settings.console === "ps5") {
      setSaveFolders([]);
      setBusy(false);
      const listed = await browse(remembered ?? "/");
      if (listed) setStatus({ tone: "info", text: t("ps4.ps5Browse") });
      return;
    }
    let folders = [];
    try {
      folders = await invoke("ps4_ftp_find_saves", { host: settings.host, port });
    } catch (error) {
      setEntries(null);
      setStatus({ tone: "error", text: t(errorKey(error)) });
      setBusy(false);
      return;
    }
    setSaveFolders(folders);
    setBusy(false);
    const target = folders.includes(remembered) ? remembered : folders[0] ?? remembered ?? "/";
    const listed = await browse(target);
    if (!listed) return;
    if (folders.length === 0) setStatus({ tone: "info", text: t("ps4.savesNotFound") });
    else if (folders.length > 1) setStatus({ tone: "info", text: t("ps4.foldersFound", { count: folders.length }) });
  }

  function parentDir() {
    const trimmed = settings.dir.replace(/\/+$/, "");
    const index = trimmed.lastIndexOf("/");
    return index <= 0 ? "/" : trimmed.slice(0, index);
  }

  async function open(entry) {
    setBusy(true); setStatus(null);
    try {
      const local = await invoke("ps4_ftp_download", { host: settings.host, port, remote: entry.path });
      await onOpenRemote(local, { host: settings.host, port, path: entry.path });
    } catch (error) {
      setStatus({ tone: "error", text: t(errorKey(error)) });
      setBusy(false);
    }
  }

  async function upload() {
    setBusy(true); setStatus(null); setConfirmUpload(false);
    try {
      await invoke("ps4_ftp_upload", { host: current.remote.host, port: current.remote.port, local: current.path, remote: current.remote.path });
      setStatus({ tone: "success", text: t("ps4.uploaded", { path: current.remote.path }) });
    } catch (error) {
      setStatus({ tone: "error", text: t(errorKey(error)) });
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry) {
    setBusy(true); setStatus(null); setConfirmDelete(null);
    try {
      const kept = await invoke("ps4_ftp_delete", { host: settings.host, port, remote: entry.path });
      setStatus({ tone: "success", text: t("ps4.deleted", { name: entry.name, path: kept }) });
      setEntries((list) => list?.filter((item) => item.path !== entry.path) ?? list);
    } catch (error) {
      setStatus({ tone: "error", text: t(errorKey(error)) });
    } finally {
      setBusy(false);
    }
  }

  // Sends the save open in the editor into the folder shown, under the chosen
  // name: works whatever folder the game or Apollo restores from.
  function startSend() {
    const remoteName = current?.remote?.path?.split("/").pop();
    const localName = baseName(current?.path);
    setSendName(isSaveName(remoteName) ? remoteName : isSaveName(localName) ? localName : SAVE_SLOTS[0]);
  }

  async function sendHere() {
    setBusy(true); setStatus(null);
    try {
      const remote = await invoke("ps4_ftp_import", { host: settings.host, port, local: current.path, dir: settings.dir, name: sendName });
      setSendName(null);
      setStatus({ tone: "success", text: t("ps4.sentHere", { path: remote }) });
      setEntries(await invoke("ps4_ftp_list", { host: settings.host, port, dir: settings.dir }));
    } catch (error) {
      setStatus({ tone: "error", text: t(errorKey(error)) });
    } finally {
      setBusy(false);
    }
  }

  async function pickImport() {
    setStatus(null);
    const picked = await dialog.open({ multiple: false, directory: false, title: t("ps4.importTitle") });
    const local = Array.isArray(picked) ? picked[0] : picked;
    if (!local) return;
    if (!isSaveName(baseName(local))) {
      setStatus({ tone: "error", text: t("ps4.errors.FTP_NOT_A_SAVE") });
      return;
    }
    const exists = entries?.some((entry) => entry.name.toLowerCase() === baseName(local).toLowerCase());
    if (exists) setPendingImport(local);
    else await runImport(local);
  }

  async function runImport(local) {
    setBusy(true); setStatus(null); setPendingImport(null);
    try {
      const remote = await invoke("ps4_ftp_import", { host: settings.host, port, local, dir: settings.dir });
      setStatus({ tone: "success", text: t("ps4.imported", { path: remote }) });
      const list = await invoke("ps4_ftp_list", { host: settings.host, port, dir: settings.dir });
      setEntries(list);
    } catch (error) {
      setStatus({ tone: "error", text: t(errorKey(error)) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bulk-backdrop">
      <div ref={panelRef} className="bulk-dialog tool-dialog ps4-dialog" role="dialog" aria-modal="true" aria-labelledby="ps4-title">
        <header className="bulk-dialog__header">
          <div>
            <p className="bulk-dialog__eyebrow">{t("ps4.eyebrow")}</p>
            <h2 id="ps4-title">{t("ps4.title")}</h2>
          </div>
          <button type="button" className="control-button control-button--quiet" onClick={onClose}>{t("saveFlow.close")}</button>
        </header>
        <p className="tool-dialog__lead">{t("ps4.description")}</p>

        {current?.remote ? (
          <div className="tool-dialog__current">
            <span>{t("ps4.current", { path: current.remote.path, host: current.remote.host })}</span>
            {dirty ? <span className="tool-dialog__warning">{t("ps4.saveFirst")}</span> : null}
            {confirmUpload ? (
              <span className="tool-row__actions">
                <button type="button" className="control-button control-button--quiet" onClick={() => setConfirmUpload(false)}>{t("unsaved.cancel")}</button>
                <button type="button" className="control-button control-button--primary" disabled={busy} onClick={upload}>{t("ps4.confirmUpload")}</button>
              </span>
            ) : (
              <button type="button" className="control-button control-button--primary" disabled={busy || dirty} onClick={() => setConfirmUpload(true)}>{t("ps4.upload")}</button>
            )}
          </div>
        ) : null}

        <div className="bulk-dialog__tabs ps4-dialog__consoles" role="radiogroup" aria-label={t("ps4.console")}>
          {Object.keys(CONSOLE_PORTS).map((name) => (
            <button key={name} type="button" role="radio" aria-checked={settings.console === name} className={`control-button control-button--quiet ${settings.console === name ? "is-active" : ""}`} onClick={() => chooseConsole(name)}>
              {t(`ps4.consoles.${name}`)}
            </button>
          ))}
        </div>

        <form className="bulk-dialog__toolbar tool-dialog__connect" onSubmit={(event) => { event.preventDefault(); connect(); }}>
          <input value={settings.host} onChange={(event) => update({ host: event.target.value })} placeholder={t("ps4.host")} aria-label={t("ps4.host")} />
          <input type="number" min={1} max={65535} value={settings.port} onChange={(event) => update({ port: event.target.value })} aria-label={t("ps4.port")} title={t("ps4.port")} />
          <button type="submit" className="control-button control-button--quiet" disabled={busy || !settings.host.trim()}>{t("ps4.connect")}</button>
        </form>

        {entries ? (
          <>
            <div className="bulk-dialog__selection ps4-dialog__path">
              <span title={settings.dir}>{settings.dir}</span>
              <span className="tool-row__actions">
                {current?.path ? (
                  <button type="button" className="control-button control-button--quiet" disabled={busy || dirty} title={dirty ? t("ps4.saveFirst") : undefined} onClick={startSend}>{t("ps4.sendHere")}</button>
                ) : null}
                <button type="button" className="control-button control-button--quiet" disabled={busy} onClick={pickImport}>{t("ps4.import")}</button>
                <button type="button" className="control-button control-button--quiet" disabled={busy || settings.dir === "/"} onClick={() => browse(parentDir())}>{t("ps4.up")}</button>
              </span>
            </div>
            {saveFolders.length > 1 ? (
              <div className="ps4-dialog__folders" role="group" aria-label={t("ps4.saves")}>
                <span>{t("ps4.saves")}</span>
                {saveFolders.map((folder) => (
                  <button key={folder} type="button" title={folder} aria-pressed={folder === settings.dir} className={`control-button control-button--quiet ${folder === settings.dir ? "is-active" : ""}`} disabled={busy} onClick={() => browse(folder)}>
                    {folder.split("/").filter(Boolean).slice(-2).join("/")}
                  </button>
                ))}
              </div>
            ) : saveFolders.length === 1 && saveFolders[0] !== settings.dir ? (
              <div className="ps4-dialog__folders">
                <button type="button" className="control-button control-button--quiet" disabled={busy} onClick={() => browse(saveFolders[0])}>{t("ps4.saves")}</button>
              </div>
            ) : null}
            {sendName ? (
              <div className="tool-dialog__current" role="group" aria-label={t("ps4.sendHere")}>
                <label className="ps4-dialog__send">
                  <span>{t("ps4.sendAs", { dir: settings.dir })}</span>
                  <select value={sendName} onChange={(event) => setSendName(event.target.value)}>
                    {SAVE_SLOTS.map((name) => <option key={name} value={name}>{name}{entries?.some((entry) => entry.name.toLowerCase() === name) ? " ●" : ""}</option>)}
                  </select>
                </label>
                <span className="tool-row__actions">
                  <button type="button" className="control-button control-button--quiet" onClick={() => setSendName(null)}>{t("unsaved.cancel")}</button>
                  <button type="button" className="control-button control-button--primary" disabled={busy || dirty} onClick={sendHere}>{t("ps4.confirmSend")}</button>
                </span>
              </div>
            ) : null}
            {pendingImport ? (
              <div className="tool-dialog__current" role="alert">
                <span className="tool-dialog__warning">{t("ps4.importReplace", { name: baseName(pendingImport) })}</span>
                <span className="tool-row__actions">
                  <button type="button" className="control-button control-button--quiet" onClick={() => setPendingImport(null)}>{t("unsaved.cancel")}</button>
                  <button type="button" className="control-button control-button--primary" disabled={busy} onClick={() => runImport(pendingImport)}>{t("ps4.confirmImport")}</button>
                </span>
              </div>
            ) : null}
            <div className="bulk-dialog__list tool-dialog__list ps4-dialog__list" role="list">
              {entries.length === 0 ? <p className="inventory-empty">{t("ps4.emptyFolder")}</p> : null}
              {entries.map((entry) => (
                <div key={entry.path} className={`tool-row ${entry.is_dir || entry.is_save ? "" : "is-readonly"}`} role="listitem">
                  <span title={entry.name}>{entry.is_dir ? "📁 " : ""}{entry.name}</span>
                  <span className="bulk-row__meta">{entry.is_dir ? "" : `${Math.max(1, Math.round(entry.size / 1024))} KiB`}</span>
                  {entry.is_dir ? (
                    <button type="button" className="control-button control-button--quiet" disabled={busy} onClick={() => browse(entry.path)}>{t("ps4.openFolder")}</button>
                  ) : entry.is_save ? (
                    confirmDelete === entry.path ? (
                      <span className="tool-row__actions">
                        <button type="button" className="control-button control-button--quiet" onClick={() => setConfirmDelete(null)}>{t("unsaved.cancel")}</button>
                        <button type="button" className="control-button control-button--danger" disabled={busy} onClick={() => remove(entry)}>{t("ps4.confirmDelete")}</button>
                      </span>
                    ) : (
                      <span className="tool-row__actions">
                        <button type="button" className="control-button control-button--quiet" disabled={busy} onClick={() => open(entry)}>{t("ps4.openSave")}</button>
                        <button type="button" className="control-button control-button--quiet" disabled={busy} onClick={() => setConfirmDelete(entry.path)} aria-label={t("ps4.deleteNamed", { name: entry.name })}>{t("ps4.delete")}</button>
                      </span>
                    )
                  ) : (
                    <span className="ps4-dialog__readonly" title={t("ps4.readOnlyHint")}>{t("ps4.readOnly")}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
        {status ? <p className={`bulk-dialog__status bulk-dialog__status--${status.tone}`} role="status">{status.text}</p> : null}
        <p className="tool-dialog__note">{t("ps4.note")}</p>
      </div>
    </div>
  );
}

export default Ps4Dialog;
