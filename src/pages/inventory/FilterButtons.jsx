import { useLocalization } from "../../i18n/localization";

// Order matches FILTERS in FilterComponent (data-index 1 to 9).
const CATEGORIES = [
  { key: "consumables", image: "consumables" },
  { key: "materials", image: "materials" },
  { key: "key", image: "key" },
  { key: "rightHand", image: "right_hand" },
  { key: "leftHand", image: "left_hand" },
  { key: "armor", image: "armor" },
  { key: "gems", image: "gems" },
  { key: "runes", image: "runes" },
  { key: "chalices", image: "chalices" },
];

function FilterButtons({ selectedFilter }) {
  const { t } = useLocalization();
  const spaceBetween = (795 - 9 * 80) / (9 + 1);
  return (
    <div className="filters" role="toolbar" aria-label={t("inventory.filters.label")}>
      <div
        id="filterHover"
        style={{
          display: selectedFilter == 0 ? "none" : "block",
          left: `${
            spaceBetween + (80 + spaceBetween) * (selectedFilter - 1) - 2
          }px`,
        }}
      ></div>
      {CATEGORIES.map(({ key, image }, index) => (
        <button
          key={key}
          type="button"
          data-index={index + 1}
          className="filters-button"
          title={t(`inventory.filters.${key}`)}
          aria-label={t(`inventory.filters.${key}`)}
          aria-pressed={String(selectedFilter) === String(index + 1)}
          style={{
            background: `url(/assets/filters/${image}.webp)`,
          }}
        ></button>
      ))}
    </div>
  );
}

export default FilterButtons;
