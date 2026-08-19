import { useContext, useEffect, useState } from "react";
import Item from "./Item";
import { ItemsContext } from "../context/itemsContext";

/**
 * Searchable item picker used by Add and Replace flows.
 *
 * @param {Object} props
 * @param {"item" | "armor" | "weapon" | "key" | "chalice"} props.type
 * @param {Function} props.onChange
 * @returns {JSX.Element}
 */
function SearchAllitems({ type, onChange, title }) {
  const [search, setSearch] = useState("");
  const [replacements, setReplacements] = useState([]);
  const [back, setBack] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);
  const { weapons, items, armors, all } = useContext(ItemsContext);

  useEffect(() => {
    setHoverIndex(null);
    const normalizedSearch = search.trim().toLowerCase();
    setReplacements(
      normalizedSearch
        ? back.filter((item) => item.info.item_name.toLowerCase().includes(normalizedSearch))
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
    <section className="catalog-picker" aria-label={title || `Select a ${type}`}>
      {title ? <p className="catalog-picker__title">{title}</p> : null}
      <label className="catalog-picker__search">
        <span>Search catalogue</span>
        <input
          onChange={(event) => setSearch(event.target.value)}
          value={search}
          type="search"
          placeholder={`Search ${type} items`}
        />
      </label>

      <div className="catalog-picker__results" role="listbox" aria-label="Matching items">
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
        {!replacements.length ? <p className="catalog-picker__empty">No matching item found.</p> : null}
      </div>
    </section>
  );
}

export default SearchAllitems;
