import { useMemo } from "react";
import { useLocalization } from "../i18n/localization";
import { checkSave, expectedHealth, expectedLevel } from "../utils/saveCheck";

// F1 + F2: recalculated Level/HP for the draft attributes, and values of the
// active save that fall outside the normal game range.
function SaveCheckPanel({ save, draftStats, onRecalculate, disabled }) {
  const { t, language } = useLocalization();
  const format = (value) => (value === undefined ? "—" : new Intl.NumberFormat(language).format(value));
  const issues = useMemo(() => checkSave(save), [save]);
  const level = expectedLevel(draftStats);
  const vitality = draftStats?.find((stat) => stat.name === "Vitality")?.value;
  const health = expectedHealth(vitality);
  const draftLevel = draftStats?.find((stat) => stat.name === "Level")?.value;
  const draftHealth = draftStats?.find((stat) => stat.name === "Health")?.value;
  const alreadyCoherent = draftLevel === level && (health === undefined || draftHealth === health);

  return (
    <section className="save-check" aria-labelledby="save-check-title">
      <div className="save-check__calc">
        <div>
          <h2 id="save-check-title">{t("saveCheck.title")}</h2>
          <p>
            {t("saveCheck.calculated", { level: format(level), health: format(health), vitality: format(vitality) })}
          </p>
        </div>
        <button
          type="button"
          className="control-button control-button--quiet"
          disabled={disabled || level === undefined || level < 1 || alreadyCoherent}
          onClick={onRecalculate}
          title={t("saveCheck.recalculateHint")}
        >
          {t("saveCheck.recalculate")}
        </button>
      </div>
      {issues.length === 0 ? (
        <p className="save-check__ok">{t("saveCheck.noIssue")}</p>
      ) : (
        <details className="save-check__issues">
          <summary>{t("saveCheck.issueCount", { count: issues.length })}</summary>
          <ul>
            {issues.map((issue, index) => (
              <li key={`${issue.key}-${index}`} className={`save-check__issue save-check__issue--${issue.severity}`}>
                {t(issue.key, Object.fromEntries(Object.entries(issue.params).map(([key, value]) => [key, typeof value === "number" ? format(value) : value])))}
              </li>
            ))}
          </ul>
          <p className="save-check__note">{t("saveCheck.note")}</p>
        </details>
      )}
    </section>
  );
}

export default SaveCheckPanel;
