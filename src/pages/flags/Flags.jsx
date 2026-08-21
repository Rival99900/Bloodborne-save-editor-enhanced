import Flag from "./Flag";
import "./flags.css";
import { useLocalization } from "../../i18n/localization";

const KNOWN_FLAGS = [
  {
    label: "Restore Lady Maria dialogue",
    category: "Narrative restoration",
    offset: 1083,
    values: [0, 8],
    info: "Restores a small set of dialogue lines before the Lady Maria encounter.",
    impact: "This changes the dialogue state only; it does not grant an item, level or boss reward.",
    warning: "Use on a copied save first if you are currently in the Astral Clocktower area.",
  },
  {
    label: "Enable the Doll’s legacy lullaby",
    category: "Legacy presentation",
    offset: 6689,
    values: [8, 1],
    info: "Re-enables the Doll’s lullaby behaviour associated with the original 1.0 release.",
    impact: "This restores a legacy presentation state. It does not alter attributes, inventory or quest rewards.",
    warning: "The behaviour is version-sensitive; keep the backup until you have loaded the character successfully.",
  },
  {
    label: "Enable Blood-addled co-op behaviour",
    category: "Multiplayer behaviour",
    offset: 4127,
    values: [162],
    info: "Enables the Blood-addled interaction associated with co-op players using the Hunter rune.",
    impact: "This changes multiplayer hostility behaviour while the relevant rune conditions are met.",
    warning: "Use this only offline or with consenting players. It can create confusing hostile co-op behaviour.",
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
        {KNOWN_FLAGS.map((flag) => (
          <Flag key={flag.label} {...flag} />
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
