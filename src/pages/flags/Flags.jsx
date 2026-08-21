import Flag from "./Flag";
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
  const { t } = useLocalization();

  return (
    <main className="flags-workspace">
      <header className="flags-workspace__header">
        <p>{t("flags.eyebrow")}</p>
        <h1>{t("flags.title")}</h1>
        <span>{t("flags.introduction")}</span>
      </header>

      <section className="flags-workspace__list" aria-label={t("flags.listLabel")}>
        {KNOWN_FLAGS.map(({ id, ...flag }) => (
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
