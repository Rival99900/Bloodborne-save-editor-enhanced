import Flag from "./Flag";
import { useContext } from "react";
import { ImagesContext } from "../../context/imagesContext";
import { SaveContext } from "../../context/context";
import { getMultiplayerMasks } from "../bosses/bossProgression";
import "./flags.css";
import { useLocalization } from "../../i18n/localization";

const KNOWN_FLAGS = [
  {
    id: "restoreMaria",
    offset: 1083,
    values: [0, 8],
  },
  {
    id: "dollLullaby",
    offset: 6689,
    values: [8, 1],
  },
  {
    id: "bloodAddled",
    offset: 4127,
    values: [162],
  },
];

function Flags() {
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();
  const { save } = useContext(SaveContext);
  const multiplayerMasks = getMultiplayerMasks(save?.bosses);
  const flags = [...KNOWN_FLAGS, { id: "multiplayerDefeatedBosses", masks: multiplayerMasks }];

  return (
    <main className="flags-workspace" style={{ backgroundImage: `url(${images.backgrounds["statsBg.png"].src})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <header className="flags-workspace__header">
        <p>{t("flags.eyebrow")}</p>
        <h1>{t("flags.title")}</h1>
        <span>{t("flags.introduction")}</span>
      </header>

      <section className="flags-workspace__list" aria-label={t("flags.listLabel")}>
        {flags.map(({ id, ...flag }) => (
          <Flag
            key={id}
            {...flag}
            label={t(`flags.entries.${id}.label`)}
            category={t(`flags.entries.${id}.category`)}
            info={t(`flags.entries.${id}.info`)}
            impact={t(`flags.entries.${id}.impact`)}
            warning={t(`flags.entries.${id}.warning`)}
          />
        ))}
      </section>

      <aside className="flags-workspace__safety">
        <strong>{t("flags.safetyTitle")}</strong>
        <span>{t("flags.safetyDescription")}</span>
      </aside>
    </main>
  );
}

export default Flags;
