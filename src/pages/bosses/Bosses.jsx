import { useContext, useEffect, useRef } from "react";
import { SaveContext } from "../../context/context";
import { invoke } from "@tauri-apps/api/core";
import { ImagesContext } from "../../context/imagesContext";
import Boss from "./Boss";
import { useLocalization } from "../../i18n/localization";
import { BOSS_NAME_KEYS, BOSS_PROGRESSION, isBossDefeated } from "./bossProgression";

function Bosses() {
  const { save, setSave } = useContext(SaveContext);
  const { bosses } = save;
  const scrollDiv = useRef(null);

  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();
  const bossesByName = new Map(bosses.map((boss) => [boss.name, boss]));
  const defeatedCount = bosses.filter(isBossDefeated).length;

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
      <header className="bosses-workspace__header">
        <p>{t("bosses.timelineEyebrow")}</p>
        <h1>{t("bosses.timelineTitle")}</h1>
        <span>{t("bosses.progress", { defeated: defeatedCount, total: bosses.length })}</span>
      </header>
      <div className="boss-timeline">
        {BOSS_PROGRESSION.map((phase, phaseIndex) => (
          <section className="boss-phase" key={phase.phase}>
            <div className="boss-phase__marker" aria-hidden="true">{phaseIndex + 1}</div>
            <div className="boss-phase__content">
              <h2>{t(`bosses.phases.${phase.phase}`)}</h2>
              <div className="boss-phase__grid">
                {phase.bosses.map((metadata) => {
                  const boss = bossesByName.get(metadata.name);
                  if (!boss) return null;
                  return (
                    <Boss
                      key={boss.name}
                      boss={boss}
                      localizedName={t(`bossNames.${BOSS_NAME_KEYS[boss.name]}`)}
                      optional={metadata.optional}
                      dlc={phase.dlc}
                      onChange={handleChange}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Bosses;
