import { useEffect, useState } from "react";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useLocalization } from "./i18n/localization";

export function UpdateModal() {
  const { t } = useLocalization();
  const [update, setUpdate] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    // The updater bridge is available only in the native Tauri webview.
    if (!window.__TAURI_INTERNALS__) return undefined;
    void checkForUpdates();
    return undefined;
  }, []);

  async function checkForUpdates() {
    try {
      const availableUpdate = await check();
      if (availableUpdate) setUpdate(availableUpdate);
    } catch (error) {
      // A missing network connection or an unavailable feed must never block the editor.
      console.info("Update check unavailable.", error);
    }
  }

  async function handleInstall() {
    if (!update) return;
    setDownloading(true);
    setProgress(0);
    setStatusText(t("update.startingDownload"));

    let downloadedBytes = 0;
    let totalBytes = 0;

    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalBytes = event.data.contentLength || 0;
            setStatusText(t("update.downloadingSigned"));
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            if (totalBytes > 0) {
              const percentage = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
              setProgress(percentage);
              setStatusText(t("update.downloadingProgress", { percentage }));
            } else {
              setStatusText(t("update.downloadedMegabytes", { megabytes: (downloadedBytes / 1024 / 1024).toFixed(1) }));
            }
            break;
          case "Finished":
            setProgress(100);
            setStatusText(t("update.installing"));
            break;
          default:
            break;
        }
      });

      setStatusText(t("update.installedRestarting"));
      await relaunch();
    } catch (error) {
      console.error("Unable to install update.", error);
      setStatusText(t("update.installFailed"));
      setDownloading(false);
    }
  }

  if (!update) return null;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div style={styles.card}>
        <h3 id="update-title" style={styles.title}>{t("update.available")}</h3>
        <p style={styles.version}>{t("update.version", { version: update.version })}</p>

        {update.body && <p style={styles.notes}>{update.body}</p>}

        {downloading ? (
          <div style={styles.progressContainer} aria-live="polite">
            <div style={styles.progressBarTrack}>
              <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
            </div>
            <span style={styles.statusText}>{statusText}</span>
          </div>
        ) : (
          <div style={styles.actions}>
            <button style={styles.btnSecondary} onClick={() => setUpdate(null)}>
              {t("update.notNow")}
            </button>
            <button style={styles.btnPrimary} onClick={handleInstall}>
              {t("update.updateAndRestart")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    fontFamily: "Georgia, serif",
  },
  card: {
    backgroundColor: "#121212",
    border: "1px solid #333",
    padding: "24px 32px",
    width: "min(380px, calc(100vw - 32px))",
    boxShadow: "0 8px 32px rgba(0,0,0,0.9)",
    color: "#e0e0e0",
    textAlign: "center",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "1.2rem",
    fontWeight: "normal",
    color: "#fff",
    letterSpacing: "0.5px",
  },
  version: {
    margin: "0 0 16px 0",
    fontSize: "0.9rem",
    color: "#888",
  },
  notes: {
    fontSize: "0.85rem",
    color: "#aaa",
    marginBottom: "20px",
    textAlign: "left",
    maxHeight: "80px",
    overflowY: "auto",
  },
  progressContainer: {
    marginTop: "16px",
  },
  progressBarTrack: {
    width: "100%",
    height: "6px",
    backgroundColor: "#222",
    border: "1px solid #444",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#c5a059",
    transition: "width 0.2s ease-in-out",
  },
  statusText: {
    fontSize: "0.8rem",
    color: "#aaa",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
  },
  btnPrimary: {
    backgroundColor: "transparent",
    border: "1px solid #c5a059",
    color: "#c5a059",
    padding: "6px 16px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    transition: "all 0.2s",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    border: "1px solid #444",
    color: "#888",
    padding: "6px 16px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.9rem",
  },
};
