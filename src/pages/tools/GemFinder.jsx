import { useContext, useEffect, useMemo, useState } from "react";
import { SaveContext } from "../../context/context";
import { useLocalization } from "../../i18n/localization";
import { loadEffectTranslations, localizeEffectText } from "../../i18n/effectTranslations";
import { loadVignetteTranslations, localizeVignetteText } from "../../i18n/vignetteTranslations";

const NO_EFFECT = 4294967295;
const MAX_ROWS = 300;
const TYPES = ["all", "Gem", "Rune"];

// Same shape + same effects (order ignored) = duplicate.
export function upgradeSignature(upgrade) {
  const ids = (upgrade.effects ?? [])
    .map(([id]) => Number(id))
    .filter((id) => id !== NO_EFFECT)
    .sort((a, b) => a - b);
  return `${upgrade.upgrade_type}|${upgrade.shape}|${ids.join(",")}`;
}

// Every Gem/Rune of the save: loose in Inventory/Storage and equipped on weapons.
export function collectUpgrades(save) {
  const list = [];
  for (const location of ["inventory", "storage"]) {
    const container = save?.[location];
    for (const type of ["Gem", "Rune"]) {
      for (const upgrade of container?.upgrades?.[type] ?? [])
        list.push({ upgrade, location, holder: null });
    }
    for (const type of ["RightHand", "LeftHand"]) {
      for (const article of container?.articles?.[type] ?? []) {
        (article.slots ?? []).forEach((slot, index) => {
          if (slot.gem)
            list.push({
              upgrade: slot.gem,
              location,
              holder: { name: article.info?.item_name ?? `#${article.id}`, slot: index + 1 },
            });
        });
      }
    }
  }
  const counts = new Map();
  for (const entry of list) {
    const key = upgradeSignature(entry.upgrade);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return list.map((entry) => ({ ...entry, copies: counts.get(upgradeSignature(entry.upgrade)) }));
}

function GemFinder() {
  const { save } = useContext(SaveContext);
  const { t, language } = useLocalization();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [catalog, setCatalog] = useState({});

  useEffect(() => {
    let current = true;
    Promise.all([loadEffectTranslations(language), loadVignetteTranslations(language)]).then(
      ([effects, names]) => {
        if (current) setCatalog({ effects, names });
      },
    );
    return () => {
      current = false;
    };
  }, [language]);

  const all = useMemo(() => collectUpgrades(save), [save]);
  const rows = useMemo(() => {
    const needles = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return all
      .filter(
        ({ upgrade, copies }) =>
          (type === "all" || upgrade.upgrade_type === type) && (!duplicatesOnly || copies > 1),
      )
      .map((entry) => {
        const effects = (entry.upgrade.effects ?? [])
          .filter(([id]) => Number(id) !== NO_EFFECT)
          .map(([, text]) => localizeEffectText(catalog.effects, text));
        const name = localizeVignetteText(catalog.names, "name", entry.upgrade.info?.name ?? "");
        return { ...entry, effects, name };
      })
      .filter(({ upgrade, effects, name }) => {
        if (!needles.length) return true;
        // Localized and English texts, so "ATK" or "physique" both work.
        const haystack =
          `${name} ${effects.join(" ")} ${(upgrade.effects ?? []).map(([, text]) => text).join(" ")} ${upgrade.shape}`.toLowerCase();
        return needles.every((needle) => haystack.includes(needle));
      })
      .sort((a, b) => Number(b.upgrade.info?.rating ?? 0) - Number(a.upgrade.info?.rating ?? 0));
  }, [all, query, type, duplicatesOnly, catalog]);

  const duplicateGroups = useMemo(
    () =>
      new Set(
        all.filter((entry) => entry.copies > 1).map((entry) => upgradeSignature(entry.upgrade)),
      ).size,
    [all],
  );
  const shape = (value) => {
    const key = `upgradeShape.${String(value).toLowerCase()}`;
    const label = t(key);
    return label === key ? value : label;
  };

  return (
    <div className="gem-finder">
      <p className="tools-lead">{t("tools.gems.lead")}</p>
      <div className="gem-finder__filters">
        <input
          type="search"
          value={query}
          placeholder={t("tools.gems.search")}
          aria-label={t("tools.gems.search")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          value={type}
          aria-label={t("tools.gems.type")}
          onChange={(event) => setType(event.target.value)}
        >
          {TYPES.map((name) => (
            <option key={name} value={name}>
              {t(`tools.gems.types.${name}`)}
            </option>
          ))}
        </select>
        <label className="gem-finder__toggle">
          <input
            type="checkbox"
            checked={duplicatesOnly}
            onChange={(event) => setDuplicatesOnly(event.target.checked)}
          />
          {t("tools.gems.duplicatesOnly")}
        </label>
      </div>
      <p className="tools-note" aria-live="polite">
        {t("tools.gems.count", { count: rows.length, total: all.length, groups: duplicateGroups })}
      </p>
      {rows.length ? (
        <div
          className="compare-table-wrap"
          tabIndex={0}
          role="region"
          aria-label={t("tools.gems.results")}
        >
          <table className="compare-table gem-finder__table">
            <thead>
              <tr>
                <th scope="col">{t("tools.gems.name")}</th>
                <th scope="col">{t("tools.gems.shape")}</th>
                <th scope="col">{t("tools.gems.rating")}</th>
                <th scope="col">{t("tools.gems.where")}</th>
                <th scope="col">{t("tools.gems.effects")}</th>
                <th scope="col">{t("tools.gems.copies")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, MAX_ROWS).map((row, index) => (
                <tr
                  key={`${row.location}-${row.upgrade.id}-${index}`}
                  className={row.copies > 1 ? "is-duplicate" : undefined}
                >
                  <td>{row.name}</td>
                  <td>{shape(row.upgrade.shape)}</td>
                  <td>{row.upgrade.info?.rating ?? "—"}</td>
                  <td>
                    {t(`sidebar.${row.location}`)}
                    {row.holder ? (
                      <small>
                        {" "}
                        ·{" "}
                        {t("tools.gems.equipped", {
                          weapon: localizeVignetteText(catalog.names, "name", row.holder.name),
                          slot: row.holder.slot,
                        })}
                      </small>
                    ) : null}
                  </td>
                  <td>{row.effects.join(" · ") || "—"}</td>
                  <td>{row.copies > 1 ? `×${row.copies}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > MAX_ROWS ? (
            <p className="tools-note">{t("bulk.andMore", { count: rows.length - MAX_ROWS })}</p>
          ) : null}
        </div>
      ) : (
        <p className="tools-note">{t("tools.gems.none")}</p>
      )}
    </div>
  );
}

export default GemFinder;
