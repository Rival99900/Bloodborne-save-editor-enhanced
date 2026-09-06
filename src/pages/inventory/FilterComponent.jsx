import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocalization } from "../../i18n/localization";
import { loadVignetteTranslations } from "../../i18n/vignetteTranslations";
import { loadEffectTranslations } from "../../i18n/effectTranslations";
import { normalizeSearch, searchableItemText } from "../../utils/inventorySearch";
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

function FilterComponent({
  inventory,
  selectedFilter = "0",
  selectedIndex,
  searchQuery = "",
  favoriteKeys = [],
  favoritesOnly = false,
}) {
  const { save } = useContext(SaveContext);
  const { language } = useLocalization();
  const [translations, setTranslations] = useState({});
  useEffect(() => {
    let active = true;
    Promise.all([loadVignetteTranslations(language), loadEffectTranslations(language)])
      .then(([vignettes, effects]) => { if (active) setTranslations({ vignettes, effects }); });
    return () => { active = false; };
  }, [language]);
  const favoriteSet = useMemo(() => new Set(favoriteKeys), [favoriteKeys]);
  const searchIndex = useMemo(() => {
    const items = Object.values({ ...inventory?.articles, ...inventory?.upgrades }).flat();
    return new Map(items.map(item => [item, searchableItemText(item, translations.vignettes, translations.effects)]));
  }, [inventory, save, translations]);
  const items = useMemo(() => {
    const { articles = {}, upgrades = {} } = inventory ?? {};
    const all = { ...articles, ...upgrades };
    const categoryItems = selectedFilter !== "0" && selectedFilter !== 0
      ? all[FILTERS[Number(selectedFilter) - 1]] ?? []
      : Object.values(all).flat();
    const normalizedQuery = normalizeSearch(searchQuery);

    return categoryItems.filter((item) => {
      if (favoritesOnly && !favoriteSet.has(getItemKey(item))) return false;
      return !normalizedQuery || searchIndex.get(item)?.includes(normalizedQuery);
    });
  }, [favoriteKeys, favoriteSet, favoritesOnly, inventory, save, searchQuery, selectedFilter, searchIndex]);

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
