import { useLocalization } from "../../i18n/localization";

function Coordinates({ coordinates: { x, y, z }, setCoordinates }) {
  const { t } = useLocalization();
  return (
    <div className="character-coordinates character-detail-row">
      <span>{t("characterForm.coordinates")}</span>
      <div
        className="character-coordinates__fields"
        style={{
          display: "flex",
          gap: "5px",
        }}
      >
        X:
        <input
          aria-label="X"
          value={x}
          onChange={(e) =>
            setCoordinates((prev) => ({ ...prev, x: +e.target.value }))
          }
          style={{
            textAlign: "center",
            width: "85px",
          }}
          type="number"
        />
        Y:
        <input
          aria-label="Y"
          value={y}
          onChange={(e) =>
            setCoordinates((prev) => ({ ...prev, y: +e.target.value }))
          }
          style={{
            textAlign: "center",
            width: "85px",
          }}
          type="number"
        />
        Z:
        <input
          aria-label="Z"
          value={z}
          onChange={(e) =>
            setCoordinates((prev) => ({ ...prev, z: +e.target.value }))
          }
          style={{
            textAlign: "center",
            width: "85px",
          }}
          type="number"
        />
      </div>
    </div>
  );
}

export default Coordinates;
