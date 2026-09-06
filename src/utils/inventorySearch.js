import { localizeVignetteText } from "../i18n/vignetteTranslations";
import { localizeEffectText } from "../i18n/effectTranslations";

export function normalizeSearch(value) {
  return String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/ı/g, "i").replace(/[’‘]/g, "'").trim();
}

export function searchableItemText(item, vignettes, effects) {
  const info = item?.info ?? {};
  const names = [info.item_name, info.name, info.extra_info?.imprint].filter(Boolean);
  const descriptions = [info.item_desc, info.note].filter(Boolean);
  const labels = (item.effects ?? []).map((entry) => entry[1]).filter(Boolean);
  const type = item.article_type ?? item.upgrade_type;
  return normalizeSearch([
    type, ...names, ...descriptions, ...labels,
    ...names.map((x) => localizeVignetteText(vignettes, "name", x)),
    ...names.map((x) => localizeEffectText(effects, x)),
    ...descriptions.map((x) => localizeVignetteText(vignettes, "description", x)),
    ...descriptions.map((x) => localizeEffectText(effects, x)),
    ...labels.map((x) => localizeEffectText(effects, x)),
  ].filter(Boolean).join(" "));
}
