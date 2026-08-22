import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useContext, useRef } from "react";
import { SaveContext } from "../context/context";
import { useLocalization } from "../i18n/localization";

function ShapeSelector({ shape, isStorage, article, setArticle, slotIndex }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(shape);
  const didMountRef = useRef(false);
  const { setSave } = useContext(SaveContext);
  const { t } = useLocalization();
  const shapes = ["Closed", "Radial", "Triangle", "Waning", "Circle"];

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    let cancelled = false;

    async function updateShape() {
      try {
        const updatedSave = await setSave(t("revision.slotShapeChanged"), () =>
          invoke("edit_slot", {
            isStorage,
            articleType: article.article_type,
            articleIndex: article.index,
            slotIndex,
            newShape: selected,
          }),
        );
        if (!updatedSave || cancelled) return;
        setArticle((prev) => {
          const copy = JSON.parse(JSON.stringify(prev));
          copy.slots[slotIndex].shape = selected;
          return copy;
        });
      } catch (error) {
        console.error("Unable to update the equipment slot shape.", error);
        if (!cancelled) setSelected(shape);
      }
    }

    void updateShape();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          width: "50px",
          height: "50px",
          right: "1px",
          top: "1px",
          cursor: "pointer",
          backgroundImage: "url(/assets/shape_bg.png)",
          backgroundSize: "contain",
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        {/* If the slot is not closed, show the selected shape. Else, show an empty div */}
        {selected !== "Closed" ? (
          <img
            style={{
              display: "block",
              position: "relative",
              top: 1,
              left: 1,
              zIndex: 10,
            }}
            src={`/assets/${selected.toLowerCase()}.png`}
            width="48px"
            alt=""
          />
        ) : (
          <div
            style={{
              width: "48px",
              aspectRatio: "1/1",
            }}
          ></div>
        )}

        {open ? (
          <div
            style={{
              position: "absolute",
              userSelect: "none",
            }}
          >
            {shapes
              .filter((x) => x !== selected)
              .map((x) => (
                <img
                  style={{
                    position: "relative",
                    display: "block",
                    zIndex: 10,
                  }}
                  src={`/assets/${
                    x === "Closed" ? "shape_bg" : x.toLowerCase()
                  }.png`}
                  width="48px"
                  alt=""
                  onClick={() => setSelected(x)}
                />
              ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default ShapeSelector;
