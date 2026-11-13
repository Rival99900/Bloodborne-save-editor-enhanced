import { useLocalization } from "../../i18n/localization";

function Coordinates({ coordinates: { x, y, z }, setCoordinates }) {
  const { t } = useLocalization();
  return (
    <div className="character-coordinates character-detail-row">
      <span>{t("characterForm.coordinates")}</span>
      <div
        className="character-coordinates__fields"
      >
        <label className="character-coordinates__axis">
        <span>X</span>
        <input
          aria-label="X"
          value={x}
          onChange={(e) =>
            setCoordinates((prev) => ({ ...prev, x: +e.target.value }))
          }
          type="number"
        />
        </label>
        <label className="character-coordinates__axis">
        <span>Y</span>
        <input
          aria-label="Y"
          value={y}
          onChange={(e) =>
            setCoordinates((prev) => ({ ...prev, y: +e.target.value }))
          }
          type="number"
        />
        </label>
        <label className="character-coordinates__axis">
        <span>Z</span>
        <input
          aria-label="Z"
          value={z}
          onChange={(e) =>
            setCoordinates((prev) => ({ ...prev, z: +e.target.value }))
          }
          type="number"
        />
        </label>
      </div>
    </div>
  );
}

export default Coordinates;
