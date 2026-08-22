import "./playtime.css";
import { useEffect, useState } from "react";
import { interpret, toMs } from "../../utils/playtime";
import { useLocalization } from "../../i18n/localization";

function Playtime({ ms, setMs }) {
  const { t } = useLocalization();
  const [time, setTime] = useState(interpret(ms));

  useEffect(() => {
    setTime(interpret(ms));
  }, [ms]);

  useEffect(() => {
    const nextMs = toMs(time);
    if (nextMs !== ms) setMs(nextMs);
  }, [ms, setMs, time]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (value < 0) return;

    setTime((prev) => ({ ...prev, [name]: Number.parseInt(value, 10) || 0 }));
  }

  function handleInput(e) {
    const { value } = e.target;

    if (value.length === 1 || value.startsWith("00")) {
      e.target.value = `0${+e.target.value}`;
    } else {
      e.target.value = +e.target.value;
    }
  }

  return (
    <div
      id="playtime"
      style={{
        fontSize: "25px",
        marginTop: "5px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>{t("characterForm.playtime")}</span>
      <div
        style={{
          width: "174px",
          fontSize: "25px",
          display: "flex",
          justifyContent: "space-evenly",
          background: "#00000081",
        }}
      >
        <input
          value={time["hours"]}
          onChange={handleChange}
          onInput={handleInput}
          type="number"
          name="hours"
        />
        <span>:</span>
        <input
          value={time["minutes"]}
          onChange={handleChange}
          onInput={handleInput}
          type="number"
          name="minutes"
        />
        <span>:</span>
        <input
          value={time["seconds"]}
          onChange={handleChange}
          onInput={handleInput}
          type="number"
          name="seconds"
        />
      </div>
    </div>
  );
}

export default Playtime;
