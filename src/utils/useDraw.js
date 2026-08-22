import { useContext } from "react";
import { ImagesContext } from "../context/imagesContext";
import { ItemsContext } from "../context/itemsContext";
import { useLocalization } from "../i18n/localization";
import {
  getGemPath as getSafeGemPath,
  getRunePath as getSafeRunePath,
  getRuneFallbackPath as getSafeRuneFallbackPath,
  getUnique as getSafeUnique,
  isCursed as isSafeCursed,
} from "./upgrades";

// Image loading is asynchronous. A canvas can receive a newer save state before an
// older gem/rune thumbnail finishes loading, so each draw gets a monotonic token.
const canvasRenderTokens = new WeakMap();

function useDraw() {
  const { images } = useContext(ImagesContext);
  const { gemEffectCatalog = [], nativeGemEffectIds = new Set() } = useContext(ItemsContext);
  const { t } = useLocalization();

  async function drawCanvas(ctx, item, isSmall = false, context = images) {
    if (!ctx?.canvas || !item) return;

    const canvas = ctx.canvas;
    const token = (canvasRenderTokens.get(canvas) ?? 0) + 1;
    canvasRenderTokens.set(canvas, token);
    const isCurrentRender = () => canvasRenderTokens.get(canvas) === token;

    // A full clear is required before every redraw. The background image normally
    // covers the canvas, but it does not protect against a late asynchronous draw.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isCurrentRender()) return;

    const { info } = item;
    if (isSmall) {
      return drawItem(
        ctx,
        info,
        "",
        images.backgrounds["item_small.png"],
        context,
        isCurrentRender,
      );
    }

    const itemBackground = images.backgrounds[getBackground(item)];
    return drawArticle(ctx, item, itemBackground, context, isCurrentRender);
  }

  function getBackground(item) {
    const type = getType(item.article_type);
    switch (type || item.upgrade_type) {
      case "Gem":
        return "gem.png";
      case "chalice":
        return "chalice.png";
      case "weapon":
        return "weapon.png";
      case "armor":
        return "armor.png";
      case "Rune":
      case "key":
      case "item":
        return "item.png";
    }
  }

  async function drawArticle(ctx, article, img, imgContext, isCurrentRender = () => true) {
    const { x, y } = {
      x: 9,
      y: 6,
    };

    const size = 73;
    const { article_type, amount, info } = article;
    let { item_name: name, item_desc: note, item_img: image } = info;
    const type = getType(article_type);
    const primaryEffectId = Number(article.effects?.[0]?.[0]);
    const isGemOriginRune =
      article.upgrade_type === "Rune" &&
      Number.isFinite(primaryEffectId) &&
      nativeGemEffectIds.has(primaryEffectId);
    name = name ?? (article?.upgrade_type !== "Gem" ? info.name : ""); // Check for gems and runes
    note = note ?? info.note ?? "";
    if (!isCurrentRender()) return;
    ctx.drawImage(img, 0, 0);

    if (image && isCurrentRender()) {
      const thumbnail = imgContext.items[image || "empty.png"];
      ctx.drawImage(thumbnail, x, y, x + size, y + size);
    }

    // Set up text
    ctx.font = "18px Reim";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = "black";
    ctx.fillStyle = "#ab9e87";

    if (article?.upgrade_type) {
      await handleUpgrades(ctx, article, { x, y, size }, isCurrentRender);
      // Gem cards already render their own name, rating and shape in handleUpgrades.
      // Returning here prevents the generic item text from being drawn a second time
      // over a Rune-origin thumbnail.
      if (article.upgrade_type === "Gem") return;
    }
    if (!isCurrentRender()) return;
    if (type === "chalice") {
      handleChalice(ctx, article);
    }
    if (article.slots) {
      const openSlots = article.slots.filter(
        (x) => x.shape !== "Closed"
      ).length;
      const fullSlots = article.slots.filter((x) => x.gem !== null).length;
      ctx.fillStyle = "#a5a49c";

      ctx.fillText(`${fullSlots} / ${openSlots}`, 735, 28);
    }

    switch (type || article_type) {
      case "weapon":
        return handleWeapon(ctx, info);
      case "armor":
        return handleArmor(ctx, info);
      default:
        break;
    }
    ctx.fillStyle = "#ab9e87";

    ctx.fillText(name, 107, 28);
    if (isGemOriginRune) {
      ctx.font = "12px Reim";
      ctx.fillStyle = "#d3b56b";
      ctx.fillText(t("inventory.gemOriginEffect"), 107, 50);
    } else {
      ctx.fillText(note, 104, 69);
    }

    if (type === "item" && type !== "key" && type !== "chalice") {
      ctx.font = "24px Reim";
      ctx.fillStyle = "#dbd9d5";
      if (amount > 99) {
        ctx.fillText(amount, 45, 83);
      } else if (amount > 9) {
        ctx.fillText(amount, 60, 85);
      } else {
        ctx.fillText(amount, 75, 83);
      }
    }
  }

  function handleChalice(ctx, chalice) {
    const {
      info: {
        extra_info: { depth, area },
      },
    } = chalice;
    const margin = 100;
    ctx.fillText(depth, 135, 77);
    ctx.fillText(area, margin * 2 + 27, 77);
  }

  function handleWeapon(ctx, weapon) {
    const {
      item_name: name,
      extra_info: { damage, upgrade_level: upgrade, imprint },
    } = weapon;
    const { physical, blood, arcane, fire, bolt } = damage;
    const finalName = `${imprint ? imprint + " " : ""}${name}${
      upgrade > 0 ? " +" + upgrade : ""
    }`;
    ctx.fillText(finalName, 107, 28);

    const margin = 100;
    // Draw numbers
    ctx.fillStyle = "#b8b7ad";
    ctx.fillText(physical, 137, 77);
    ctx.fillText(blood, margin * 2 + 37, 77);
    ctx.fillText(arcane, margin * 3 + 37, 77);
    ctx.fillText(fire, margin * 4 + 37, 77);
    ctx.fillText(bolt, margin * 5 + 37, 77);
  }

  function handleArmor(ctx, armor) {
    const {
      item_name: name,
      extra_info: { physicalDefense, elementalDefense },
    } = armor;
    const { physical, blunt, thrust, blood } = physicalDefense;
    const { arcane, fire, bolt } = elementalDefense;
    ctx.fillText(name, 107, 28);

    const margin = 100;

    ctx.fillStyle = "#b8b7ad";
    ctx.fillText(physical, 137, 77);
    ctx.fillText(blunt, margin * 2 + 37, 77);
    ctx.fillText(thrust, margin * 3 + 37, 77);
    ctx.fillText(blood, margin * 4 + 37, 77);
    ctx.fillText(arcane, margin * 5 + 37, 77);
    ctx.fillText(fire, margin * 6 + 37, 77);
    ctx.fillText(bolt, margin * 7 + 37, 77);
  }

  async function handleUpgrades(ctx, upgrade, { x, y, size }, isCurrentRender = () => true) {
    if (upgrade.upgrade_type === "Gem") {
      const {
        effects,
        info: { name, level, rating },
        shape,
        source,
      } = upgrade;

      const uniqueGem = getUnique(effects[0][0], shape, source);
      const cursed = isCursed(effects);
      const primaryEffectId = Number(effects[0]?.[0]);
      const primaryEffect = gemEffectCatalog.find(
        (effect) => Number(effect.value) === primaryEffectId,
      );
      const runeOriginPrimaryEffect =
        primaryEffect && !nativeGemEffectIds.has(primaryEffectId) ? primaryEffect : undefined;
      const finalName = makeGemName(name, uniqueGem, cursed, source);
      const path = getGemPath(effects, shape, level, uniqueGem, runeOriginPrimaryEffect);
      const thumbnail = await loadImage(path).catch(() =>
        runeOriginPrimaryEffect ? loadImage(getRuneFallbackPath()).catch(() => undefined) : undefined,
      );

      if (!isCurrentRender()) return;
      ctx.font = "20px Reim";
      if (thumbnail !== undefined)
        ctx.drawImage(thumbnail, x, y, x + size, y + size);

      // Set up text
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.shadowColor = "black";
      ctx.fillStyle = "#ab9e87";
      ctx.fillText(finalName, 107, 28);
      if (runeOriginPrimaryEffect) {
        ctx.font = "12px Reim";
        ctx.fillStyle = "#d3b56b";
        ctx.fillText(t("inventory.runeOriginEffect"), 107, 46);
        ctx.font = "20px Reim";
      }

      const margin = 100;
      // Draw numbers
      ctx.fillStyle = "#b8b7ad";
      ctx.fillText(rating, 135, 77);
      ctx.fillText(shape, margin * 2 + 27, 77);
    } else {
      const {
        info: { name, rating },
        shape,
      } = upgrade;

      const path = getRunePath(name, shape, rating);

      const thumbnail = await loadImage(path).catch(() =>
        loadImage(getRuneFallbackPath(shape)).catch(() => undefined),
      );

      if (!isCurrentRender()) return;
      if (thumbnail !== undefined)
        ctx.drawImage(thumbnail, x, 4.8, x + size, 4.8 + size + 2);
    }
  }

  function makeGemName(name, uniqueGem, cursed, source) {
    if (uniqueGem) {
      return uniqueGem.name;
    } else if ([2147633649, 2147633648, 2147633650].includes(source)) {
      return "?GemName?";
    } else if (cursed) {
      return `Cursed ${name}`;
    } else {
      return name;
    }
  }

  async function drawItem(ctx, item, amount, img, context, isCurrentRender = () => true) {
    const { x, y } = {
      x: 9,
      y: 6,
    };

    const size = 73;
    const { item_name: name, item_img: image, item_desc: note } = item;

    // const thumbnail = await loadImage(
    //   "/assets/itemImages/" + image || "empty.png"
    // );
    const thumbnail = context.items[image || "empty.png"];

    if (!isCurrentRender()) return;
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
    ctx.fillStyle = "#dbd9d5";
    if (amount > 99) {
      ctx.fillText(amount, 45, 83);
    } else if (amount > 9) {
      ctx.fillText(amount, 60, 85);
    } else {
      ctx.fillText(amount, 75, 83);
    }
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      let imageObj = new Image();
      imageObj.onload = () => resolve(imageObj);
      imageObj.onerror = (e) => {
        // If the image fails to load, use the default image
        reject("Failed to load image");
      };
      imageObj.src = url;
    });
  }

  function getType(type) {
    if (!type) return "";
    switch (type.toLowerCase()) {
      case "consumable":
      case "material":
        return "item";
      case "lefthand":
      case "righthand":
        return "weapon";
      default:
        return type.toLowerCase();
    }
  }

  function getRunePath(name, shape, rating) {
    return getSafeRunePath(name, shape, rating);
  }

  function getRuneFallbackPath(shape) {
    return getSafeRuneFallbackPath(shape);
  }

  function isCursed(effects) {
    return isSafeCursed(effects);
  }

  function getUnique(primaryEffect, shape, source) {
    return getSafeUnique(primaryEffect, shape, source);
  }

  function getGemPath(effects, shape, level, unique, runeOriginPrimaryEffect) {
    return getSafeGemPath(effects, shape, level, unique, runeOriginPrimaryEffect);
  }

  return { drawCanvas, getUnique, getGemPath, loadImage, isCursed };
}

export default useDraw;
