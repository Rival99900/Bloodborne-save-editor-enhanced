import { useEffect, useRef } from "react";
import useDraw from "../utils/useDraw";
import { useLocalization } from "../i18n/localization";

function Item({ index, item, isSmall, className, ...props }) {
  const canvasRef = useRef(null);
  const { drawCanvas } = useDraw();
  const { language } = useLocalization();

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const ctx = canvasRef.current.getContext("2d");
    void drawCanvas(ctx, item, isSmall);
  }, [item, isSmall, language]);

  return isSmall ? (
    <canvas
      data-index={index}
      data-item-id={item.id}
      data-item={JSON.stringify(item)}
      width={526}
      height={90}
      ref={canvasRef}
      style={{ display: "block", marginBottom: "1px" }}
      {...props}
    ></canvas>
  ) : (
    <div className={className}>
      <canvas
        data-index={index}
        data-item-id={item.id}
        data-item-type={
          item?.article_type?.toLowerCase() || item.upgrade_type.toLowerCase()
        }
        data-item={JSON.stringify(item)}
        width={795}
        height={90}
        ref={canvasRef}
        style={{ display: "block", marginBottom: "1px" }}
        {...props}
      ></canvas>
    </div>
  );
}

export default Item;
