import { invoke } from "@tauri-apps/api/core";
import { useContext, useEffect, useState } from "react";
import StatusDialog from "../../components/StatusDialog";
import { useLocalization } from "../../i18n/localization";
import { SaveContext } from "../../context/context";

function IszGlitch() {
  const { t } = useLocalization();
  const { setSave } = useContext(SaveContext);
  const [isz, setIsz] = useState([]);
  const [notice, setNotice] = useState(null);

  async function refreshIsz() {
    try {
      setIsz(await invoke("get_isz"));
    } catch (error) {
      console.error("Unable to read Isz status.", error);
    }
  }

  useEffect(() => {
    refreshIsz();
  }, []);

  async function fixIsz() {
    try {
      let fixResult = null;
      const updatedSave = await setSave(t("revision.characterUpdated"), async () => {
        const result = await invoke("fix_isz");
        fixResult = result;
        return result.changed ? result.save : null;
      });
      await refreshIsz();
      if (updatedSave) {
        setNotice({
          tone: "success",
          title: t("characterForm.iszFixed"),
          description: t("characterForm.iszFixedDescription"),
        });
        return;
      }
      if (fixResult && !fixResult.changed) {
        setNotice({
          tone: "success",
          title: t("characterForm.iszAlreadyFixed"),
          description: t("characterForm.iszAlreadyFixedDescription"),
        });
      }
    } catch (error) {
      console.error("Unable to fix Isz status.", error);
      setNotice({
        tone: "error",
        title: t("characterForm.iszFixFailed"),
        description: t("characterForm.iszFixFailedDescription"),
      });
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
      <span>
        {t("characterForm.iszStatus")} {isz.map((value) => value.toString(16).toUpperCase()).join(" ")}
      </span>
      <button
        style={{ width: "174px", fontSize: "25px", padding: "0 15px", backgroundSize: "100% 100%" }}
        className="buttonBg"
        type="button"
        onClick={fixIsz}
      >
        {t("characterForm.fixIsz")}
      </button>
      {notice ? (
        <StatusDialog
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
          closeLabel={t("saveFlow.close")}
          onClose={() => setNotice(null)}
        />
      ) : null}
    </div>
  );
}

export default IszGlitch;
