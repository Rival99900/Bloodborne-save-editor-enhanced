import { useContext, useEffect, useRef } from "react";
import useDraw from "../../utils/useDraw";
import ShapeSelector from "../../components/ShapeSelector";
import { ItemsContext } from "../../context/itemsContext";

function EquippedGem({
  gem,
  shape,
  setSelected,
  setRef,
  isStorage,
  article,
  setArticle,
  index,
}) {
  const canvasRef = useRef();
  const { getGemPath, getUnique, loadImage } = useDraw();
  const { gemEffectCatalog = [], nativeGemEffectIds = new Set() } = useContext(ItemsContext);

  useEffect(() => {
    if (gem != null) {
      const {
        effects,
        info: { level },
        shape,
        source,
      } = gem;

      const canvas = canvasRef?.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const primaryEffectId = Number(effects[0]?.[0]);
        const primaryEffect = gemEffectCatalog.find(
          (effect) => Number(effect.value) === primaryEffectId,
        );
        // Rune-origin effects can legitimately occupy an equipment gem slot. In that
        // case, resolve the real Caryll Rune artwork instead of a guessed gem colour.
        const runeOriginPrimaryEffect =
          primaryEffect && !nativeGemEffectIds.has(primaryEffectId) ? primaryEffect : undefined;
        const unique = getUnique(primaryEffectId, shape, source);
        const path = getGemPath(effects, shape, level, unique, runeOriginPrimaryEffect);

        loadImage(path)
          .then((img) => {
            ctx.drawImage(img, 0, 0, 175, 175);
          })
          .catch((err) => console.error(err));
      }
    } else {
      const canvas = canvasRef?.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    }
  }, [gem, gemEffectCatalog, nativeGemEffectIds]);

  return (
    <>
      {/* TODO: Hover */}
      <div
        style={{
          position: "relative",
          padding: "1rem",
          backgroundImage: "url(/assets/gems/gem_bg.png)",
          backgroundSize: "contain",
        }}
        onClick={() => {
          setSelected({
            gem,
            index,
          });
          setRef(canvasRef);
        }}
      >
        <ShapeSelector
          isStorage={isStorage}
          article={article}
          setArticle={setArticle}
          shape={shape}
          slotIndex={index}
        />
        <canvas
          ref={canvasRef}
          width="175px"
          height="175px"
          style={{
            display: "block",
          }}
        ></canvas>
      </div>
    </>
  );
}

export default EquippedGem;
