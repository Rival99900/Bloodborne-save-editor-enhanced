import { invoke } from "@tauri-apps/api/core";
import { useContext, useEffect, useRef, useState } from "react";
import { SaveContext } from "../context/context";
import { useLocalization } from "../i18n/localization";

const SHAPES = ["Closed", "Radial", "Triangle", "Waning", "Circle"];

function ShapeSelector({ shape, isStorage, article, setArticle, slotIndex }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(shape);
  const applyingRef = useRef(false);
  const { setSave } = useContext(SaveContext);
  const { t } = useLocalization();

  useEffect(() => {
    setSelected(shape);
  }, [shape]);

  async function applyShape(nextShape, event) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);

    if (nextShape === selected || applyingRef.current) return;

    applyingRef.current = true;
    try {
      const updatedSave = await setSave(t("revision.slotShapeChanged"), () =>
        invoke("edit_slot", {
          isStorage,
          articleType: article.article_type,
          articleIndex: article.index,
          slotIndex,
          newShape: nextShape,
        }),
      );
      if (!updatedSave) return;

      setSelected(nextShape);
      setArticle((previous) => {
        const copy = JSON.parse(JSON.stringify(previous));
        if (copy.slots?.[slotIndex]) copy.slots[slotIndex].shape = nextShape;
        return copy;
      });
    } catch (error) {
      console.error("Unable to update the equipment slot shape.", error);
      setSelected(shape);
    } finally {
      applyingRef.current = false;
    }
  }

  function toggleMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    setOpen((previous) => !previous);
  }

  return (
    <div
      className="shape-selector"
      style={{ position: "absolute", right: "1px", top: "1px", zIndex: 20 }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="shape-selector__trigger"
        aria-label={t("revision.slotShapeChanged")}
        aria-expanded={open}
        onClick={toggleMenu}
        style={{
          display: "grid",
          placeItems: "center",
          width: "50px",
          height: "50px",
          padding: 0,
          border: 0,
          cursor: "pointer",
          background: "url(/assets/shape_bg.png) center / contain no-repeat",
        }}
      >
        {selected !== "Closed" ? (
          <img
            src={`/assets/${selected.toLowerCase()}.png`}
            width="48"
            height="48"
            alt=""
            draggable="false"
          />
        ) : null}
      </button>

      {open ? (
        <div
          className="shape-selector__menu"
          role="menu"
          aria-label={t("revision.slotShapeChanged")}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 0.5rem)",
            display: "grid",
            gridTemplateColumns: "repeat(5, 42px)",
            gap: "0.25rem",
            padding: "0.375rem",
            border: "1px solid #85734e",
            background: "rgba(10, 10, 10, 0.98)",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.6)",
          }}
        >
          {SHAPES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              role="menuitemradio"
              aria-checked={candidate === selected}
              aria-label={candidate}
              title={candidate}
              disabled={candidate === selected || applyingRef.current}
              onClick={(event) => void applyShape(candidate, event)}
              style={{
                display: "grid",
                placeItems: "center",
                width: "42px",
                height: "42px",
                padding: 0,
                border: candidate === selected ? "1px solid #d5af55" : "1px solid #3d3d3d",
                opacity: candidate === selected ? 0.55 : 1,
                cursor: candidate === selected ? "default" : "pointer",
                background: "#050505",
              }}
            >
              <img
                src={`/assets/${candidate === "Closed" ? "shape_bg" : candidate.toLowerCase()}.png`}
                width="40"
                height="40"
                alt=""
                draggable="false"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ShapeSelector;
