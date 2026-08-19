import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Item from "../../components/Item";
import EditUpgrade from "../../components/EditUpgrade";
import { ImagesContext } from "../../context/imagesContext";
import EquippedGem from "./EquippedGem";
import useDraw from "../../utils/useDraw";
import { SaveContext } from "../../context/context";
import ChangeGemScreen from "./ChangeGemScreen";

function EquippedGems() {
  const { images } = useContext(ImagesContext);
  const { save } = useContext(SaveContext);
  const { getGemPath, loadImage } = useDraw();

  const location = useLocation();
  const { selected = null, isStorage = false } = location.state ?? {};
  const [article, setArticle] = useState(selected);
  const [selectedRef, setSelectedRef] = useState(null);
  const [editScreen, setEditScreen] = useState(false);
  const [changeScreen, setChangeScreen] = useState(false);
  const [selectedGem, setSelectedGem] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!selected) {
      nav("/", { replace: true });
    }
  }, [nav, selected]);

  if (!selected || !article) {
    return null;
  }

  return (
    <>
      {changeScreen ? (
        <ChangeGemScreen
          slotIndex={selectedGem.index}
          article={article}
          setArticle={setArticle}
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
          confirmCb={(newGem) => {
            const slotIndex = selectedGem.index;
            setArticle((previous) => ({
              ...previous,
              slots: previous.slots.map((entry, index) =>
                index === slotIndex ? { ...entry, gem: newGem } : entry,
              ),
            }));
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
        {/* Selected Weapon */}
        <div
          style={{
            marginBottom: "5rem",
          }}
        >
          <Item item={article} index={0} />
        </div>
        {/* Gems */}
        <div
          style={{
            display: "flex",
            position: "relative",
          }}
        >
          <div
            className="selected-slot"
            style={{
              display: selectedGem !== null ? "block" : "none",
              left: `${selectedGem?.index * 207}px`,
            }}
          ></div>
          {article.slots.map((slot, i) => (
              <EquippedGem
              gem={slot?.gem}
              shape={slot.shape}
              setRef={setSelectedRef}
              setSelected={setSelectedGem}
              isStorage={isStorage}
              article={article}
              setArticle={setArticle}
              index={i}
              key={i}
            />
          ))}
        </div>
        {/* Buttons */}
        <div
          style={{
            marginTop: "5rem",
          }}
        >
          <button onClick={() => nav("/")}>Back</button>
          <button
            style={{ margin: "0 2rem" }}
            onClick={() => {
              setChangeScreen(true);
            }}
            disabled={!selectedGem}
          >
            Change
          </button>
          <button
            onClick={() => {
              setEditScreen(true);
            }}
            disabled={!selectedGem?.gem}
          >
            Edit
          </button>
        </div>
      </div>
    </>
  );
}

export default EquippedGems;
