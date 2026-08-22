import { useContext, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as dialog from "@tauri-apps/plugin-dialog";
import StatusDialog from "../../components/StatusDialog";
import { useLocalization } from "../../i18n/localization";
import { SaveContext } from "../../context/context";

function Appearance() {
  const { t } = useLocalization();
  const { setSave } = useContext(SaveContext);
  const [notice, setNotice] = useState(null);

  async function exportFace() {
    try {
      const path = await dialog.save({ title: t("characterForm.saveFaceFile") });
      if (!path) return;
      await invoke("export_appearance", { path });
      setNotice({ tone: "success", title: t("characterForm.faceExported") });
    } catch (error) {
      console.error("Unable to export face data.", error);
      setNotice({ tone: "error", title: t("characterForm.faceActionFailed") });
    }
  }

  async function importFace() {
    try {
      const path = await dialog.open({ title: t("characterForm.selectFaceFile") });
      if (!path) return;
      const updatedSave = await setSave(t("revision.characterUpdated"), () =>
        invoke("import_appearance", { path }),
      );
      if (!updatedSave) return;
      setNotice({ tone: "success", title: t("characterForm.faceImported") });
    } catch (error) {
      console.error("Unable to import face data.", error);
      setNotice({ tone: "error", title: t("characterForm.faceActionFailed") });
    }
  }

  return (
    <div
      style={{
        fontSize: "25px",
        marginTop: "5px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <button
        className="buttonBg"
        style={{ padding: "0 15px", fontSize: "inherit", backgroundSize: "100% 100%" }}
        type="button"
        onClick={exportFace}
      >
        {t("characterForm.exportFace")}
      </button>
      <button
        className="buttonBg"
        style={{ padding: "0 15px", fontSize: "inherit", backgroundSize: "100% 100%" }}
        type="button"
        onClick={importFace}
      >
        {t("characterForm.importFace")}
      </button>
      {notice ? (
        <StatusDialog
          tone={notice.tone}
          title={notice.title}
          closeLabel={t("saveFlow.close")}
          onClose={() => setNotice(null)}
        />
      ) : null}
    </div>
  );
}

export default Appearance;
