import { useMemo } from "react";
import { useLocalization } from "../../i18n/localization";
import DarkSelect from "../../components/DarkSelect";

function Boss({ boss, onChange }) {
  const { t } = useLocalization();
  const { name, flags } = boss;
  const defeatedFlag = flags[0];
  const isDefeated = (defeatedFlag.dead_value & defeatedFlag.current_value & 0xff) !== 0;
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
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #6b5f49",
      }}
    >
      <span>{name}:</span>
      <DarkSelect
        className="boss-status-select"
        ariaLabel={`${name} ${t("bosses.alive")} / ${t("bosses.dead")}`}
        options={options}
        value={isDefeated ? "dead" : "alive"}
        onChange={handleChange}
      />
    </div>
  );
}

export default Boss;
