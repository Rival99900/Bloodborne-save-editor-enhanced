import { useContext, useEffect, useState } from "react";
import Item from "./Item";
import { ItemsContext } from "../context/itemsContext";
import { useLocalization } from "../i18n/localization";

/**
 * Searchable item picker used by Add and Replace flows.
 *
 * @param {Object} props
 * @param {"item" | "armor" | "weapon" | "key" | "chalice"} props.type
 * @param {Function} props.onChange
 * @returns {JSX.Element}
 */
function SearchAllitems({ type, onChange, title, variant = "add" }) {
  const [search, setSearch] = useState("");
  const { t } = useLocalization();
  const [replacements, setReplacements] = useState([]);
  const [back, setBack] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);
  const { weapons, items, armors, all } = useContext(ItemsContext);

  useEffect(() => {
    setHoverIndex(null);
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const includesSearch = (value) => String(value ?? "").toLocaleLowerCase().includes(normalizedSearch);
    setReplacements(
      normalizedSearch
        ? back.filter((item) => (
            includesSearch(item.info?.item_name)
            || includesSearch(item.info?.item_desc)
            || includesSearch(item.sourceLabel)
            || (item.searchTerms ?? []).some(includesSearch)
          ))
        : back,
    );
  }, [back, search]);

  useEffect(() => {
    let nextItems = all;

    switch (type) {
      case "weapon":
        nextItems = weapons;
        break;
      case "chalice":
      case "item":
        nextItems = items;
        break;
      case "key":
        nextItems = items.filter((item) => item.article_type.toLowerCase() === type);
        break;
      case "armor":
        nextItems = armors;
        break;
      default:
        break;
    }

    setSearch("");
    setHoverIndex(null);
    setBack(nextItems ?? []);
  }, [type, weapons, items, armors, all]);

  function selectItem(item, index) {
    if (typeof onChange === "function") onChange(item);
    setHoverIndex(index);
  }

  return (
    <section
      className={`catalog-picker catalog-picker--${variant}`}
      aria-label={title || t("inventory.selectNew", { type: t(`inventory.type.${type}`) })}
    >
      {title ? <p className="catalog-picker__title">{title}</p> : null}
      <label className="catalog-picker__search">
        <span>{t("inventory.searchCatalog")}</span>
        <input
          onChange={(event) => setSearch(event.target.value)}
          value={search}
          type="search"
          placeholder={t("inventory.searchItems", { type: t(`inventory.type.${type}`) })}
        />
      </label>

      <div className="catalog-picker__results" role="listbox" aria-label={t("inventory.matchingItems")}>
        <div
          id="hoverReplacement"
          style={{
            display: hoverIndex == null ? "none" : "block",
            top: `${hoverIndex * 91}px`,
          }}
        />
        {replacements.map((item, index) => (
          <Item
            onClick={() => selectItem(item, index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectItem(item, index);
              }
            }}
            key={`${item.id}-${index}`}
            index={index + 1}
            item={item}
            isSmall={true}
            role="option"
            aria-selected={hoverIndex === index}
            tabIndex={0}
          />
        ))}
        {!replacements.length ? <p className="catalog-picker__empty">{t("inventory.noMatchingItem")}</p> : null}
      </div>
    </section>
  );
}

export default SearchAllitems;
