import { useMemo } from "react";
import { useLocalization } from "../../i18n/localization";
import DarkSelect from "../../components/DarkSelect";
import { isBossDefeated } from "./bossProgression";

function Boss({ boss, localizedName, optional, dlc, onChange }) {
  const { t } = useLocalization();
  const { flags } = boss;
  const isDefeated = isBossDefeated(boss);
  const options = useMemo(
    () => [
      { label: t("bosses.alive"), value: "alive" },
      { label: t("bosses.dead"), value: "dead" },
    ],
    [t],
  );

  function handleChange(value) {
    const targetValue = value === "alive" ? "alive_value" : "dead_value";
    const nextFlags = flags.map((flag) => ({
      ...flag,
      current_value: flag[targetValue],
    }));
    onChange?.(nextFlags);
  }

  return (
    <article className={`boss-row ${isDefeated ? "boss-row--defeated" : ""}`}>
      <div className="boss-row__identity">
        <span>{localizedName}</span>
        <div className="boss-row__badges">
          {dlc ? <small>{t("bosses.dlc")}</small> : null}
          {optional ? <small>{t("bosses.optional")}</small> : <small>{t("bosses.required")}</small>}
        </div>
      </div>
      <DarkSelect
        className="boss-status-select"
        ariaLabel={`${localizedName} ${t("bosses.alive")} / ${t("bosses.dead")}`}
        options={options}
        value={isDefeated ? "dead" : "alive"}
        onChange={handleChange}
      />
    </article>
  );
}

export default Boss;
