import React, { useContext, useMemo } from "react";
import { SaveContext } from "../../context/context";
import Item from "../../components/Item";
import { Virtuoso } from "react-virtuoso";

const FILTERS = [
  "Consumable",
  "Material",
  "Key",
  "RightHand",
  "LeftHand",
  "Armor",
  "Gem",
  "Rune",
  "Chalice",
];

function getItemKey(item) {
  return [
    item?.article_type ?? item?.upgrade_type ?? "unknown",
    item?.id ?? "none",
    item?.source ?? "none",
    item?.index ?? "none",
  ].join(":");
}

function getSearchableText(item) {
  const effectText = Array.isArray(item?.effects)
    ? item.effects.map(([, label]) => label).join(" ")
    : "";
  return [
    item?.article_type,
    item?.upgrade_type,
    item?.info?.item_name,
    item?.info?.name,
    item?.info?.item_desc,
    item?.info?.note,
    effectText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

function FilterComponent({
  inventory,
  selectedFilter = "0",
  selectedIndex,
  searchQuery = "",
  favoriteKeys = [],
  favoritesOnly = false,
}) {
  const { save } = useContext(SaveContext);
  const favoriteSet = useMemo(() => new Set(favoriteKeys), [favoriteKeys]);
  const items = useMemo(() => {
    const { articles = {}, upgrades = {} } = inventory ?? {};
    const all = { ...articles, ...upgrades };
    const categoryItems = selectedFilter !== "0" && selectedFilter !== 0
      ? all[FILTERS[Number(selectedFilter) - 1]] ?? []
      : Object.values(all).flat();
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return categoryItems.filter((item) => {
      if (favoritesOnly && !favoriteSet.has(getItemKey(item))) return false;
      return !normalizedQuery || getSearchableText(item).includes(normalizedQuery);
    });
  }, [favoriteKeys, favoriteSet, favoritesOnly, inventory, save, searchQuery, selectedFilter]);

  return items.length ? (
    <Virtuoso
      data={items}
      height="100%"
      itemContent={(index, item) => (
        <Item
          className={selectedIndex === index ? "selectedItem" : ""}
          index={index + 1}
          item={item}
        />
      )}
      overscan={{
        main: 900,
        reverse: 900,
      }}
      fixedItemHeight={91}
    />
  ) : null;
}

export { getItemKey };
export default FilterComponent;
