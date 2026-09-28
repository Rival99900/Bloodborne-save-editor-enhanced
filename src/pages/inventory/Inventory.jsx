import "./inventory.css";
import { useEffect, useRef, useState, useContext } from "react";
import { SaveContext } from "../../context/context";
import { invoke } from "@tauri-apps/api/core";
import ReplaceScreen from "../../components/ReplaceScreen";
import { getType } from "../../utils/upgrades";
import FilterButtons from "./FilterButtons";
import FilterComponent, { getItemKey } from "./FilterComponent";
import EditUpgrade from "../../components/EditUpgrade";
import AddScreen from "./AddScreen";
import { useNavigate } from "react-router-dom";
import { useLocalization } from "../../i18n/localization";

const INVENTORY_FAVORITES_STORAGE_KEY = "bloodborne-save-editor.inventory-favorites.v1";

function readFavoriteKeys() {
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(INVENTORY_FAVORITES_STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function Inventory({ inv, isStorage }) {
  const inventoryRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const selectedRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [level, setLevel] = useState(0);
  const [replaceScreen, setReplaceScreen] = useState(false);
  const [editScreen, setEditScreen] = useState(false);
  const [addScreen, setAddScreen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");
  const [capacity, setCapacity] = useState(null);
  const [favoriteKeys, setFavoriteKeys] = useState(readFavoriteKeys);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const nav = useNavigate();

  const { save, setSave } = useContext(SaveContext);
  const { t, language } = useLocalization();
  useEffect(() => {
    let active = true;
    setCapacity(null);
    invoke("get_capacity_summary").then((value) => {
      if (active) setCapacity(value);
    }).catch(() => { if (active) setCapacity(null); });
    return () => { active = false; };
  }, [save, isStorage]);

  useEffect(() => {
    const invCurrent = inventoryRef.current;
    function manageSelect(e) {
      const {
        target,
        srcElement: { nodeName },
      } = e;

      if (nodeName === "CANVAS") {
        const { item: itemRaw, index } = target.dataset;
        const item = JSON.parse(itemRaw);

        setSelectedIndex(index - 1); // TODO: show selected item

        selectedRef.current = target;
        setSelected(item);
        setQuantity(item.amount);
      } else if (nodeName === "BUTTON" && target.dataset.index != null) {
        const { index } = target.dataset;

        setSelected(null);
        setSelectedFilter((prev) => (prev === index ? "0" : index));
      }
    }

    if (save) {
      inventoryRef?.current?.addEventListener("click", manageSelect);
    }

    return () => {
      if (invCurrent) {
        invCurrent.removeEventListener("click", manageSelect);
      }
    };
  }, [inventoryRef, save]);

  useEffect(() => {
    if (!selected) {
      selectedRef.current = null;
      setSelectedIndex(null);
    }
  }, [selected]);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(INVENTORY_FAVORITES_STORAGE_KEY, JSON.stringify(favoriteKeys));
    } catch {
      // Favorites are optional local-only metadata; the editor remains functional if storage is unavailable.
    }
  }, [favoriteKeys]);

  const selectedFavoriteKey = selected ? getItemKey(selected) : null;
  const isSelectedFavorite = selectedFavoriteKey ? favoriteKeys.includes(selectedFavoriteKey) : false;
  const selectedType = getType(selected?.article_type);
  const displayedQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
  const displayedLevel = Number.isFinite(Number(level)) ? Number(level) : 0;
  const canEditQuantity = selectedType === "item";
  const canEditWeaponLevel = selectedType === "weapon";

  function toggleSelectedFavorite() {
    if (!selectedFavoriteKey) return;
    setFavoriteKeys((current) =>
      current.includes(selectedFavoriteKey)
        ? current.filter((key) => key !== selectedFavoriteKey)
        : [selectedFavoriteKey, ...current].slice(0, 120),
    );
  }

  return (
    <>
      {/* Optional modal like screens */}
      {addScreen ? (
        <AddScreen
          type="item"
          setAddScreen={setAddScreen}
          isStorage={isStorage}
        />
      ) : null}
      {replaceScreen ? (
        <ReplaceScreen
          setSelected={setSelected}
          selected={selected}
          selectedRef={selectedRef}
          setReplaceScreen={setReplaceScreen}
          isStorage={isStorage}
        />
      ) : null}
      {editScreen ? (
        <EditUpgrade
          setSelected={setSelected}
          selected={selected}
          selectedRef={selectedRef}
          setEditScreen={setEditScreen}
          isStorage={isStorage}
        />
      ) : null}
      {/* Inventory */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
        }}
        ref={inventoryRef}
      >
        <FilterButtons selectedFilter={selectedFilter} />
        <div className="inventory-search" role="search">
          <div className="inventory-search__heading">
            <label htmlFor={isStorage ? "storage-search" : "inventory-search"}>
              {t(isStorage ? "inventory.searchStorage" : "inventory.searchInventory")}
            </label>
            <span className="inventory-capacity" aria-live="polite">
              {t("capacity.title")}: <strong>{capacity == null ? "—" : new Intl.NumberFormat(language).format(isStorage ? capacity.storage_free : capacity.inventory_free)}</strong>
            </span>
          </div>
          <input
            id={isStorage ? "storage-search" : "inventory-search"}
            type="search"
            value={searchQuery}
            placeholder={t("inventory.searchPlaceholder")}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery ? (
            <button type="button" onClick={() => setSearchQuery("")}>{t("inventory.clearSearch")}</button>
          ) : null}
          <button
            className={favoritesOnly ? "is-active" : ""}
            type="button"
            onClick={() => setFavoritesOnly((value) => !value)}
          >
            {t("inventory.favoritesOnly")}
          </button>
        </div>
        <FilterComponent
          inventory={inv}
          selectedFilter={selectedFilter}
          selectedIndex={selectedIndex}
          searchQuery={searchQuery}
          favoriteKeys={favoriteKeys}
          favoritesOnly={favoritesOnly}
        />
      </div>
      {/* Right side buttons */}
      <div className="editButtons">
        <label className="inventory-side-control__label" htmlFor="item-quantity">{t("inventory.itemQuantity")}</label>
        <div className="editQuantity">
          <div className="inventory-side-control__field">
            <input
              type="number"
              id="item-quantity"
              value={displayedQuantity}
              max={isStorage ? 600 : 99}
              min={0}
              className="inventory-side-control__input"
              disabled={!canEditQuantity}
            onChange={(e) => {
              const { value } = e.target;
              if (value.length > 1 && value[0] === "0") {
                e.target.value = value.slice(1);
              }
              // Check if the item should be capped at 600 or not
              if (
                (!isStorage ||
                  (isStorage &&
                    selected.article_type !== "Material" &&
                    !["Quicksilver Bullets", "Blood Vial"].includes(
                      selected.info.item_name,
                    ))) &&
                value > 99
              ) {
                setQuantity(99);
              } else if (isStorage && value > 600) {
                setQuantity(600);
              } else {
                setQuantity(parseInt(value));
              }
            }}
            />
            {!canEditQuantity ? <span className="inventory-side-control__display" aria-hidden="true">{displayedQuantity}</span> : null}
          </div>
          <button
            className="control-button control-button--quiet inventory-side-control__apply"
            onClick={async () => {
              await setSave(t("revision.quantityChanged"), () =>
                invoke("edit_quantity", {
                  number: selected.number,
                  id: selected.id,
                  value: quantity,
                  isStorage,
                }),
              );
            }}
            disabled={
              canEditQuantity && quantity > 0
                ? false
                : true
            }
          >
            {t("inventory.setValue")}
          </button>
        </div>
        <label className="inventory-side-control__label" htmlFor="weapon-level">{t("inventory.weaponLevel")}</label>
        <div className="editQuantity">
          <div className="inventory-side-control__field">
            <input
              type="number"
              id="weapon-level"
              value={displayedLevel}
              max={10}
              min={0}
              className="inventory-side-control__input"
              disabled={!canEditWeaponLevel}
            onChange={(e) => {
              const { value } = e.target;
              if (value.length > 1 && value[0] === "0") {
                e.target.value = value.slice(1);
              }

              if (value > 10) {
                setLevel(10);
              } else {
                setLevel(parseInt(value));
              }
            }}
            />
            {!canEditWeaponLevel ? <span className="inventory-side-control__display" aria-hidden="true">{displayedLevel}</span> : null}
          </div>
          <button
            className="control-button control-button--quiet inventory-side-control__apply"
            onClick={async () => {
              let updatedWeapon = null;
              const editedSave = await setSave(t("revision.weaponLevelChanged"), async () => {
                const result = await invoke("change_weapon_level", {
                  articleType: selected.article_type,
                  articleIndex: selected.index,
                  slotIndex: selected.number,
                  isStorage,
                  level,
                });
                updatedWeapon = result.weapon;
                return result.save;
              });
              if (!editedSave) return;
              setSelected(updatedWeapon);
            }}
            disabled={
              canEditWeaponLevel && quantity > 0
                ? false
                : true
            }
          >
            {t("inventory.setValue")}
          </button>
        </div>
        <button
          className="control-button control-button--quiet inventory-btn inventory-btn--favorite"
          disabled={!selected}
          onClick={toggleSelectedFavorite}
        >
          {isSelectedFavorite ? t("inventory.removeFavorite") : t("inventory.addFavorite")}
        </button>
        <button
          className="control-button control-button--quiet inventory-btn"
          disabled={selected?.article_type === undefined}
          onClick={async () => {
            setReplaceScreen(true);
          }}
        >
          {t("inventory.replaceItem")}
        </button>
        <button
          className="control-button control-button--quiet inventory-btn"
          disabled={!selected?.upgrade_type}
          onClick={async () => {
            setEditScreen(true);
          }}
        >
          {t("inventory.edit")}
        </button>
        <button
          className="control-button control-button--quiet inventory-btn"
          onClick={() => setAddScreen(true)}
        >
          {t("inventory.addItem")}
        </button>
        <button
          className="control-button control-button--quiet inventory-btn"
          disabled={
            getType(selected?.article_type) !== "weapon" &&
            getType(selected?.article_type) !== "armor"
          }
          onClick={() =>
            nav("/equippedGems", {
              state: {
                selected,
                isStorage,
              },
            })
          }
        >
          {t("inventory.gems")}
        </button>
      </div>
    </>
  );
}

export default Inventory;
