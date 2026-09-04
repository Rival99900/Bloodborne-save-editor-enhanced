import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../../context/context";
import { useLocalization } from "../../i18n/localization";

const navigation = [
  { to: "/", labelKey: "sidebar.inventory", descriptionKey: "sidebar.inventoryDescription", end: true },
  { to: "/storage", labelKey: "sidebar.storage", descriptionKey: "sidebar.storageDescription" },
  { to: "/stats", labelKey: "sidebar.stats", descriptionKey: "sidebar.statsDescription" },
  { to: "/character", labelKey: "sidebar.character", descriptionKey: "sidebar.characterDescription" },
  { to: "/bosses", labelKey: "sidebar.bosses", descriptionKey: "sidebar.bossesDescription" },
  { to: "/npcs", labelKey: "sidebar.npcs", descriptionKey: "sidebar.npcsDescription" },
  { to: "/flags", labelKey: "sidebar.flags", descriptionKey: "sidebar.flagsDescription" },
];

function SideBar() {
  const { save } = useContext(SaveContext);
  const { language, t } = useLocalization();
  const [capacity, setCapacity] = useState(null);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(language), [language]);

  useEffect(() => {
    if (!save) {
      setCapacity(null);
      return undefined;
    }
    let active = true;
    invoke("get_capacity_summary")
      .then((summary) => {
        if (active) setCapacity(summary);
      })
      .catch((error) => {
        console.warn("Unable to read save capacity.", error);
        if (active) setCapacity(null);
      });
    return () => { active = false; };
  }, [save]);

  return (
    <aside className="sidebar" aria-label={t("sidebar.workspace")}>
      <div className="sidebar__header">
        <p className="sidebar__eyebrow">{t("sidebar.workspace")}</p>
        <p className="sidebar__title">{t("sidebar.characterData")}</p>
      </div>

      <nav className="sidebar__nav" aria-label={t("sidebar.characterData")}>
        {navigation.map(({ to, labelKey, descriptionKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-disabled={!save}
            tabIndex={save ? 0 : -1}
            onClick={(event) => {
              if (!save) event.preventDefault();
            }}
            className={({ isActive }) =>
              `nav-link ${isActive && save ? "active" : ""} ${save ? "" : "disabled"}`
            }
          >
            <span className="nav-link__label">{t(labelKey)}</span>
            <span className="nav-link__description">{t(descriptionKey)}</span>
          </NavLink>
        ))}
      </nav>

      {save ? (
        <section className="capacity-summary" aria-label={t("capacity.title")}>
          <p>{t("capacity.title")}</p>
          <div className="capacity-summary__grid">
            {[
              ["inventory", capacity?.inventory_free],
              ["storage", capacity?.storage_free],
              ["gems", capacity?.gems_free],
              ["runes", capacity?.runes_free],
            ].map(([key, value]) => (
              <div key={key}>
                <span>{t(`capacity.${key}`)}</span>
                <strong>{value == null ? "—" : numberFormatter.format(value)}</strong>
              </div>
            ))}
          </div>
          <span className="capacity-summary__note">{t("capacity.sharedPool")}</span>
        </section>
      ) : null}

      <div className="sidebar__notice">
        <p>{t("sidebar.backupTitle")}</p>
        <span>{t("sidebar.backupDescription")}</span>
      </div>
    </aside>
  );
}

export default SideBar;
