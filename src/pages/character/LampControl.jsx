import { useEffect, useRef } from "react";
import lampCatalogue from "../../../src-tauri/resources/lamps.json";
import { useLocalization } from "../../i18n/localization";
import { locations } from "./Teleport";

// Lamp table from Argagaes' lamp controls (Noxde/Bloodborne-save-editor#67).
// Areas follow the order the player reaches them.
const AREA_ORDER = [
  "Central Yharnam",
  "Cathedral Ward",
  "Upper Cathedral Ward",
  "Old Yharnam",
  "Hemwick Charnel Lane",
  "Forbidden Woods",
  "Byrgenwerth",
  "Yahar'gul",
  "Cainhurst",
  "Abandoned Old Workshop",
  "Lecture Building",
  "Nightmare Frontier",
  "Nightmare of Mensis",
  "Hunter's Nightmare",
  "Research Hall",
  "Fishing Hamlet",
];

// Lamp and area names reuse the translated Teleport destinations; the few
// lamps that are not destinations have their own keys.
const destinationIndex = new Map(locations.map((location) => [location.label, location.value]));
const AREA_DESTINATION = {
  "Yahar'gul": "Yahar'gul, Unseen Village",
  Cainhurst: "Forsaken Castle Cainhurst",
};
const OWN_KEYS = {
  "Grand Cathedral": "lamps.grandCathedral",
  "Moonside Lake": "lamps.moonsideLake",
  "Amygdala's Chamber": "lamps.amygdalaChamber",
};

export const LAMPS = lampCatalogue.map((lamp, index) => ({ ...lamp, index }));
const GROUPS = AREA_ORDER.map((area) => ({
  area,
  lamps: LAMPS.filter((lamp) => lamp.area === area),
})).filter((group) => group.lamps.length);

function LampCheckbox({ label, lamps, draft, saved, onChange, className = "" }) {
  const box = useRef(null);
  const lit = lamps.filter((lamp) => draft[lamp.index]).length;
  const all = lit === lamps.length;
  const pending = lamps.some((lamp) => draft[lamp.index] !== saved[lamp.index]);

  useEffect(() => {
    if (box.current) box.current.indeterminate = lit > 0 && !all;
  }, [lit, all]);

  return (
    <label className={`lamp-check ${className} ${pending ? "is-pending" : ""}`}>
      <input
        ref={box}
        type="checkbox"
        checked={all}
        disabled={!draft.length}
        onChange={(event) => onChange(lamps, event.target.checked)}
      />
      <span>{label}</span>
      {lamps.length > 1 ? (
        <small>
          {lit}/{lamps.length}
        </small>
      ) : null}
    </label>
  );
}

// Character → Lamp control: tick the lamps to light (or clear them) in the
// Hunter's Dream headstones. Changes stay a draft until Character → Confirm.
function LampControl({ draft, saved, setDraft, error }) {
  const { t } = useLocalization();
  const destination = (name) => {
    const index = destinationIndex.get(name);
    return index !== undefined ? t(`destinations.${index}`) : name;
  };
  const lampLabel = (lamp) =>
    OWN_KEYS[lamp.name] ? t(OWN_KEYS[lamp.name]) : destination(lamp.name);
  const areaLabel = (area) => destination(AREA_DESTINATION[area] ?? area);

  function change(lamps, enabled) {
    setDraft((current) => {
      const next = [...current];
      for (const lamp of lamps) next[lamp.index] = enabled;
      return next;
    });
  }

  const pendingCount = LAMPS.filter((lamp) => draft[lamp.index] !== saved[lamp.index]).length;

  return (
    <section className="lamp-control" aria-labelledby="lamp-control-title">
      <div className="lamp-control__header">
        <span id="lamp-control-title">{t("lamps.title")}</span>
        <LampCheckbox
          className="lamp-check--all"
          label={t("lamps.all")}
          lamps={LAMPS}
          draft={draft}
          saved={saved}
          onChange={change}
        />
      </div>
      <p className="lamp-control__hint">
        {pendingCount ? t("lamps.pending", { count: pendingCount }) : t("lamps.hint")}
      </p>
      {error ? (
        <p className="lamp-control__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="lamp-control__list" role="group" aria-label={t("lamps.title")}>
        {GROUPS.map((group) => (
          <div className="lamp-area" key={group.area}>
            <LampCheckbox
              className="lamp-check--area"
              label={areaLabel(group.area)}
              lamps={group.lamps}
              draft={draft}
              saved={saved}
              onChange={change}
            />
            {group.lamps.length > 1 ? (
              <div className="lamp-area__items">
                {group.lamps.map((lamp) => (
                  <LampCheckbox
                    key={lamp.eventFlag}
                    label={lampLabel(lamp)}
                    lamps={[lamp]}
                    draft={draft}
                    saved={saved}
                    onChange={change}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default LampControl;
