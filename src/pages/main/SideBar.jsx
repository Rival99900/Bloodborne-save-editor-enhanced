import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { SaveContext } from "../../context/context";
import { useLocalization } from "../../i18n/localization";

const navigation = [
  { to: "/", labelKey: "sidebar.inventory", descriptionKey: "sidebar.inventoryDescription", end: true },
  { to: "/storage", labelKey: "sidebar.storage", descriptionKey: "sidebar.storageDescription" },
  { to: "/stats", labelKey: "sidebar.stats", descriptionKey: "sidebar.statsDescription" },
  { to: "/character", labelKey: "sidebar.character", descriptionKey: "sidebar.characterDescription" },
  { to: "/bosses", labelKey: "sidebar.bosses", descriptionKey: "sidebar.bossesDescription" },
  { to: "/flags", labelKey: "sidebar.flags", descriptionKey: "sidebar.flagsDescription" },
];

function SideBar() {
  const { save } = useContext(SaveContext);
  const { t } = useLocalization();

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

      <div className="sidebar__notice">
        <p>{t("sidebar.backupTitle")}</p>
        <span>{t("sidebar.backupDescription")}</span>
      </div>
    </aside>
  );
}

export default SideBar;
