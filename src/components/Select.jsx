import { useContext, useEffect, useMemo, useState } from "react";
import { SaveContext } from "../context/context";
import DarkSelect from "./DarkSelect";
import { useLocalization } from "../i18n/localization";

function Select({ options, name, setEditedStats, editedStats }) {
  const { save } = useContext(SaveContext);
  const { t } = useLocalization();
  const draftValue = editedStats.find((entry) => entry.name === name)?.value;
  const fallbackValue = save.stats.find((entry) => entry.name === name)?.value;
  const [value, setValue] = useState(draftValue ?? fallbackValue ?? "");
  const normalizedOptions = useMemo(
    () => options.map((option, index) => (
      typeof option === "object" ? option : { label: String(option), value: index }
    )),
    [options],
  );

  useEffect(() => {
    setValue(draftValue ?? fallbackValue ?? "");
  }, [draftValue, fallbackValue]);

  function handleChange(nextValue) {
    setValue(nextValue);
    setEditedStats((previous) => previous.map((entry) => (
      entry.name === name ? { ...entry, value: nextValue } : entry
    )));
  }

  return (
    <div className="character-select-field">
      <span>{t(`statNames.${name}`)}</span>
      <DarkSelect
        className="character-select"
        ariaLabel={t(`statNames.${name}`)}
        options={normalizedOptions}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}

export default Select;
