import { useContext, useEffect, useRef } from "react";
import { SaveContext } from "../../context/context";
import { invoke } from "@tauri-apps/api/core";
import { ImagesContext } from "../../context/imagesContext";
import Boss from "./Boss";
import { useLocalization } from "../../i18n/localization";

function Bosses() {
  const { save, setSave } = useContext(SaveContext);
  const { bosses } = save;
  const scrollDiv = useRef(null);

  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();

  async function handleChange(flags) {
    try {
      await setSave(t("revision.bossUpdated"), async () => {
        let updatedSave = null;
        for (const flag of flags) {
          updatedSave = await invoke("set_flag", {
            offset: flag.rel_offset,
            newValue: flag.current_value,
          });
        }
        return updatedSave;
      });
    } catch (error) {
      console.error("Unable to update boss progress.", error);
    }
  }

  useEffect(() => {
    if (scrollDiv?.current) {
      scrollDiv.current.scroll(0, -999);
    }
  }, [scrollDiv]); // Correct scroll

  return (
    <div
      ref={scrollDiv}
      className="bosses-workspace"
      style={{ backgroundImage: `url(${images.backgrounds["statsBg.png"].src})` }}
    >
      {bosses.map((x, i) => {
        return (
          <Boss boss={x} onChange={handleChange} />
        );
      })}
    </div>
  );
}

export default Bosses;
