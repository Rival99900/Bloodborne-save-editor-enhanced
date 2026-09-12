import { useContext, useMemo } from "react";
import DarkSelect from "../../components/DarkSelect";
import { ImagesContext } from "../../context/imagesContext";
import { useLocalization } from "../../i18n/localization";

const NPCS = [
  { key: "plainDoll", automatic: true },
  { key: "eileen" },
  { key: "alfred" },
  { key: "djura" },
  { key: "arianna" },
  { key: "adella" },
  { key: "chapelDweller" },
  { key: "iosefka" },
  { key: "gilbert" },
  { key: "patches" },
  { key: "valtr" },
  { key: "simon" },
];

function NpcRow({ npc }) {
  const { t } = useLocalization();
  const localizedName = t(`npcNames.${npc.key}`);
  const options = useMemo(
    () => [
      { label: t("bosses.alive"), value: "alive" },
      { label: t("bosses.dead"), value: "dead" },
    ],
    [t],
  );

  return (
    <article className="npc-row">
      <div>
        <strong>{localizedName}</strong>
        <span>{npc.automatic ? t("npcs.automaticNote") : t("npcs.unverifiedNote")}</span>
      </div>
      <DarkSelect
        className="boss-status-select"
        ariaLabel={`${localizedName} ${t("bosses.alive")} / ${t("bosses.dead")}`}
        options={options}
        value={npc.automatic ? "alive" : "unverified"}
        placeholder={t("npcs.unverified")}
        disabled
      />
    </article>
  );
}

function Npcs() {
  const { images } = useContext(ImagesContext);
  const { t } = useLocalization();
  return (
    <div
      className="npc-workspace"
      style={{ backgroundImage: `url(${images.backgrounds["statsBg.png"].src})` }}
    >
      <header className="npc-workspace__header">
        <p>{t("npcs.eyebrow")}</p>
        <h1>{t("npcs.title")}</h1>
        <span>{t("npcs.lead")}</span>
      </header>

      <section className="npc-list" aria-label={t("npcs.title")}>
        {NPCS.map((npc) => <NpcRow key={npc.key} npc={npc} />)}
      </section>
    </div>
  );
}

export default Npcs;
