import { invoke } from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

function Flag({ label, offset, values, info, impact, warning = "", category = "Known flag", isMask = false }) {
  const [isApplying, setIsApplying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function apply() {
    const accepted = window.confirm(
      `${label}\n\n${impact}\n\nApply this known save flag? A backup is kept before saving.`,
    );
    if (!accepted) return;

    setIsApplying(true);
    try {
      if (isMask) {
        await invoke("apply_mask", { offset, mask: values[0] });
      } else {
        for (let index = 0; index < values.length; index += 1) {
          await invoke("set_flag", {
            offset: offset + index,
            newValue: values[index],
          });
        }
      }
      await message("Flag applied to the in-memory save. Select Save changes to write the file.");
    } catch (error) {
      await message(`Unable to apply this flag: ${String(error)}`);
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <article className="flag-card">
      <div className="flag-card__content">
        <span className="flag-card__category">{category}</span>
        <h2>{label}</h2>
        <p>{info}</p>
        {expanded ? (
          <div className="flag-card__details">
            <p><strong>What changes:</strong> {impact}</p>
            {warning ? <p><strong>Careful:</strong> {warning}</p> : null}
            <p className="flag-card__technical">Validated byte pattern: {values.join(" · ")}</p>
          </div>
        ) : null}
      </div>

      <div className="flag-card__actions">
        <button className="flag-card__details-button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Hide details" : "What does this do?"}
        </button>
        <button className="buttonBg flag-card__apply" onClick={apply} disabled={isApplying}>
          {isApplying ? "Applying…" : "Apply"}
        </button>
      </div>
    </article>
  );
}

export default Flag;
