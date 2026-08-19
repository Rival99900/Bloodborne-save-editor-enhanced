import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { SaveContext } from "../../context/context";

const navigation = [
  { to: "/", label: "Inventory", description: "Items and equipment", end: true },
  { to: "/storage", label: "Storage", description: "Stored items" },
  { to: "/stats", label: "Stats", description: "Attributes and echoes" },
  { to: "/character", label: "Character", description: "Identity and position" },
  { to: "/equippedGems", label: "Gems", description: "Equipped upgrades" },
  { to: "/bosses", label: "Bosses", description: "Progress state" },
  { to: "/flags", label: "Flags", description: "Advanced settings" },
];

function SideBar() {
  const { save } = useContext(SaveContext);

  return (
    <aside className="sidebar" aria-label="Editor sections">
      <div className="sidebar__header">
        <p className="sidebar__eyebrow">Editor workspace</p>
        <p className="sidebar__title">Character data</p>
      </div>

      <nav className="sidebar__nav" aria-label="Character sections">
        {navigation.map(({ to, label, description, end }) => (
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
            <span className="nav-link__label">{label}</span>
            <span className="nav-link__description">{description}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__notice">
        <p>Backup-first workflow</p>
        <span>Opening a save creates a <code>.bak</code> copy before edits are made.</span>
      </div>
    </aside>
  );
}

export default SideBar;
