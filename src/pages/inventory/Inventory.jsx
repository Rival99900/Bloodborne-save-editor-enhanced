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
import { ImagesContext } from "../../context/imagesContext";
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
  const [favoriteKeys, setFavoriteKeys] = useState(readFavoriteKeys);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const nav = useNavigate();
  const {
    images: { items, backgrounds },
  } = useContext(ImagesContext);

  const { save, setSave } = useContext(SaveContext);
  const { t } = useLocalization();

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
      } else if (nodeName === "BUTTON") {
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
          <label>
            <span>{t("inventory.searchInventory")}</span>
            <input
              type="search"
              value={searchQuery}
              placeholder={t("inventory.searchPlaceholder")}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
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
        <span style={{ fontSize: "1.2rem" }}>{t("inventory.itemQuantity")}</span>
        <div className="editQuantity">
          <input
            type="number"
            value={quantity || 0}
            max={isStorage ? 600 : 99}
            min={0}
            style={{ width: "120px" }}
            disabled={getType(selected?.article_type) !== "item" ? true : false}
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
          <button
            className="buttonBg"
            onClick={async () => {
              console.log(selected);
              const editedSave = await setSave(t("revision.quantityChanged"), () =>
                invoke("edit_quantity", {
                  number: selected.number,
                  id: selected.id,
                  value: quantity,
                  isStorage,
                }),
              );
              if (!editedSave) return;
              const canvas = selectedRef.current;
              const ctx = canvas.getContext("2d");
              const itemImage = backgrounds["item.png"];
              ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
              await drawItem(ctx, selected.info, quantity, itemImage, items);
            }}
            disabled={
              getType(selected?.article_type) === "item" && quantity > 0
                ? false
                : true
            }
          >
            {t("inventory.setValue")}
          </button>
        </div>
        <span style={{ fontSize: "1.2rem" }}>{t("inventory.weaponLevel")}</span>
        <div className="editQuantity">
          <input
            type="number"
            value={level || 0}
            max={10}
            min={0}
            style={{ width: "120px" }}
            disabled={
              getType(selected?.article_type) !== "weapon" ? true : false
            }
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
          <button
            className="buttonBg"
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
              getType(selected?.article_type) === "weapon" && quantity > 0
                ? false
                : true
            }
          >
            {t("inventory.setValue")}
          </button>
        </div>
        <button
          className="buttonBg inventory-btn inventory-btn--favorite"
          disabled={!selected}
          onClick={toggleSelectedFavorite}
        >
          {isSelectedFavorite ? t("inventory.removeFavorite") : t("inventory.addFavorite")}
        </button>
        <button
          className="buttonBg inventory-btn"
          disabled={selected?.article_type === undefined}
          onClick={async () => {
            setReplaceScreen(true);
          }}
        >
          {t("inventory.replaceItem")}
        </button>
        <button
          className="buttonBg inventory-btn"
          disabled={!selected?.upgrade_type}
          onClick={async () => {
            setEditScreen(true);
          }}
        >
          {t("inventory.edit")}
        </button>
        <button
          className="buttonBg inventory-btn"
          onClick={() => setAddScreen(true)}
        >
          {t("inventory.addItem")}
        </button>
        <button
          className="buttonBg inventory-btn"
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

async function drawItem(ctx, item, amount, img, items) {
  const { x, y } = {
    x: 9,
    y: 6,
  };

  const size = 73;
  const { item_name: name, item_img: image, item_desc: note } = item;

  const thumbnail = items[image];

  ctx.font = "18px Reim";
  ctx.drawImage(img, 0, 0);
  ctx.drawImage(thumbnail, x, y, x + size, y + size);

  // Set up text
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.shadowColor = "black";
  ctx.fillStyle = "#ab9e87";
  ctx.fillText(name, 107, 28);
  ctx.fillText(note, 104, 69);

  ctx.font = "24px Reim";
  ctx.fillStyle = "#FFFF";
  if (amount > 9) {
    ctx.fillText(amount, 60, 85);
  } else {
    ctx.fillText(amount, 75, 83);
  }
}

export default Inventory;
