import { useContext, useEffect, useMemo, useState } from "react";
import { SaveContext } from "../context/context";
import DarkSelect from "./DarkSelect";

function Select({ options, name, setEditedStats, editedStats }) {
  const { save } = useContext(SaveContext);
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
    <DarkSelect
      className="character-select"
      ariaLabel={name}
      options={normalizedOptions}
      value={value}
      onChange={handleChange}
    />
  );
}

export default Select;
