import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Item from "../../components/Item";
import EditUpgrade from "../../components/EditUpgrade";
import { ImagesContext } from "../../context/imagesContext";
import EquippedGem from "./EquippedGem";
import { SaveContext } from "../../context/context";
import ChangeGemScreen from "./ChangeGemScreen";
import { useLocalization } from "../../i18n/localization";

function isSameEquippedArticle(candidate, reference) {
  if (!candidate || !reference) return false;
  return candidate.article_type === reference.article_type
    && candidate.id === reference.id
    && candidate.source === reference.source
    && candidate.index === reference.index;
}

function EquippedGems() {
  const { images } = useContext(ImagesContext);
  const { save } = useContext(SaveContext);

  const location = useLocation();
  const { selected = null, isStorage = false } = location.state ?? {};
  const [selectedRef, setSelectedRef] = useState(null);
  const [editScreen, setEditScreen] = useState(false);
  const [changeScreen, setChangeScreen] = useState(false);
  const [selectedGem, setSelectedGem] = useState(null);
  const nav = useNavigate();
  const { t } = useLocalization();

  const article = useMemo(() => {
    if (!selected) return null;
    const source = isStorage ? save?.storage : save?.inventory;
    const liveArticles = Object.values(source?.articles ?? {}).flat();
    return liveArticles.find((candidate) => isSameEquippedArticle(candidate, selected)) ?? selected;
  }, [isStorage, save, selected]);

  useEffect(() => {
    if (!selected) {
      nav("/", { replace: true });
    }
  }, [nav, selected]);

  useEffect(() => {
    // A restored snapshot can remove or replace the previously selected slot.
    // Drop local overlay selections so they cannot continue to target stale data.
    setSelectedGem(null);
    setEditScreen(false);
    setChangeScreen(false);
    setSelectedRef(null);
  }, [article]);

  if (!selected || !article) {
    return null;
  }

  return (
    <>
      {changeScreen ? (
        <ChangeGemScreen
          slotIndex={selectedGem.index}
          article={article}
          setSelected={setSelectedGem}
          setScreen={setChangeScreen}
          isStorage={isStorage}
        />
      ) : null}
      {editScreen ? (
        <EditUpgrade
          setSelected={setSelectedGem}
          selected={selectedGem.gem}
          selectedRef={selectedRef}
          setEditScreen={setEditScreen}
          isStorage={isStorage}
          equipped={article}
          slot={selectedGem.index}
          confirmCb={() => {
            // The committed backend snapshot is the source of truth. `article` is
            // derived from it above, so a confirmed edit, undo, or redo redraws
            // every equipped slot without leaving a stale local Gem card behind.
            setSelectedGem(null);
          }}
        />
      ) : null}
      <div
        style={{
          gridColumn: "2/4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `url(${images.backgrounds["statsBg.png"].src})`,
          backgroundSize: "cover",
          padding: "2rem",
        }}
      >
        <div style={{ marginBottom: "5rem" }}>
          <Item item={article} index={0} />
        </div>
        <div style={{ display: "flex", position: "relative" }}>
          <div
            className="selected-slot"
            style={{
              display: selectedGem !== null ? "block" : "none",
              left: `${selectedGem?.index * 207}px`,
            }}
          />
          {article.slots.map((slot, index) => (
            <EquippedGem
              gem={slot?.gem}
              shape={slot.shape}
              setRef={setSelectedRef}
              setSelected={setSelectedGem}
              isStorage={isStorage}
              article={article}
              index={index}
              key={`${article.article_type}-${article.index}-${index}-${slot?.gem?.index ?? "empty"}`}
            />
          ))}
        </div>
        <div style={{ marginTop: "5rem" }}>
          <button onClick={() => nav("/")}>{t("actions.back")}</button>
          <button
            style={{ margin: "0 2rem" }}
            onClick={() => setChangeScreen(true)}
            disabled={!selectedGem}
          >
            {t("actions.change")}
          </button>
          <button
            onClick={() => setEditScreen(true)}
            disabled={!selectedGem?.gem}
          >
            {t("actions.edit")}
          </button>
        </div>
      </div>
    </>
  );
}

export default EquippedGems;
