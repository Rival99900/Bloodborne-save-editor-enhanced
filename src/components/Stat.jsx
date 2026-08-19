import { useState, useEffect } from "react";

const MAX_STAT_VALUE = 2_000_000_000;

function Stat({ stat, editedStats, setEditedStats, width }) {
  const [value, setValue] = useState(stat.value);

  useEffect(() => {
    setValue(stat.value);
  }, [stat, editedStats]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #6b5f49",
      }}
    >
      <img
        width={32}
        height={32}
        style={{ marginRight: "10px" }}
        src={`/assets/stats/${stat.name.toLowerCase()}.png`}
        alt=""
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: width || "420px",
        }}
      >
        <label>{stat.name}: </label>
        <input
          type="number"
          style={{
            textAlign: "right",
            background: "none",
          }}
          min={0}
          max={MAX_STAT_VALUE}
          value={value}
          onChange={(event) => {
            const rawValue = event.target.value;
            const numericValue = Number(rawValue);
            const nextValue = Number.isFinite(numericValue)
              ? Math.min(MAX_STAT_VALUE, Math.max(0, numericValue))
              : 0;

            setValue(nextValue);
            editedStats.find((entry) => entry.name === stat.name).value = nextValue;
            setEditedStats([...editedStats]);
          }}
        />
      </div>
    </div>
  );
}

export default Stat;
