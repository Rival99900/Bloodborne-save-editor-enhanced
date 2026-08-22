const MAX_STAT_VALUE = 2_000_000_000;
const STAT_VALUE_LIMITS = Object.freeze({
  Echoes: 999_999_999,
  Insight: 99,
});

function getStatLimit(name) {
  return STAT_VALUE_LIMITS[name] ?? MAX_STAT_VALUE;
}

function Stat({ stat, setEditedStats, width }) {
  const maximum = getStatLimit(stat.name);

  function handleChange(event) {
    const rawValue = event.target.value;
    const numericValue = Number(rawValue);
    const nextValue = Number.isFinite(numericValue)
      ? Math.min(maximum, Math.max(0, numericValue))
      : 0;

    setEditedStats((previous) => previous.map((entry) => (
      entry.name === stat.name ? { ...entry, value: nextValue } : entry
    )));
  }

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
          max={maximum}
          value={stat.value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

export default Stat;
