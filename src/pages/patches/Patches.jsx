import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SaveContext } from "../../context/context";
import { ImagesContext } from "../../context/imagesContext";
import { useLocalization } from "../../i18n/localization";
import { loadVignetteTranslations, localizeVignetteText } from "../../i18n/vignetteTranslations";
import "./patches.css";

export function patchLabel(patch, t, names) {
  const item = (name) => localizeVignetteText(names, "name", name.replace("Bastard Of Loran", "Bastard of Loran"));
  if (patch.kind === "quantity") return t("patches.quantityTitle", { name: item(patch.item_name) });
  if (patch.kind === "conversion") return t("patches.conversionTitle", { name: item(patch.name.split(" into ")[1].split(" (Must")[0]) });
  if (patch.kind === "weapon") return `${item(patch.item_name)}${patch.name.includes("+10") ? " +10" : ""}`;
  return t(`patches.${patch.kind}Title`);
}
const category = (patch) => ["quantity", "weapon"].includes(patch.kind) ? patch.kind : "other";
const hex = (number, width) => number.toString(16).toUpperCase().padStart(width, "0");

export default function Patches() {
  const { save, setSave } = useContext(SaveContext);
  const { images } = useContext(ImagesContext) ?? {};
  const { t, language } = useLocalization();
  const [titleId, setTitleId] = useState("");
  const [version, setVersion] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [names, setNames] = useState(null);
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [review, setReview] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const generation = useRef(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; generation.current++; }; }, []);
  const invalidate = () => { generation.current++; setReview(null); setAcknowledged(false); setError(""); setSuccess(false); };
  useEffect(() => { generation.current++; setReview(null); setAcknowledged(false); }, [save]);
  useEffect(() => {
    let active = true; setNames(null);
    loadVignetteTranslations(language).then(value => { if (active) setNames(value); });
    return () => { active = false; };
  }, [language]);
  useEffect(() => {
    let active = true; setCatalog(null); setSelected([]);
    if (!titleId || titleId === "other") { setCatalogBusy(false); return; }
    setCatalogBusy(true);
    invoke("bloodborne_patch_catalog", { titleId }).then(value => { if (active) setCatalog(value); })
      .catch(() => { if (active) setError("patchErrors.catalog"); })
      .finally(() => { if (active) setCatalogBusy(false); });
    return () => { active = false; };
  }, [titleId]);
  const labels = useMemo(() => new Map((catalog?.patches ?? []).map(p => [p.id, patchLabel(p, t, names)])), [catalog, t, names]);
  const visible = (catalog?.patches ?? []).filter(p => (filter === "all" || category(p) === filter)
    && `${labels.get(p.id)} ${p.name}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const showError = (value) => {
    const code = String(value);
    const group = ["patchErrors.missing", "patchErrors.ambiguous"].includes(code) ? "patchErrors.pattern"
      : ["patchErrors.bounds", "patchErrors.structure", "patchErrors.size", "patchErrors.code"].includes(code) ? "patchErrors.structure"
      : ["patchErrors.selection", "patchErrors.conflict"].includes(code) ? "patchErrors.selection"
      : ["patchErrors.version", "patchErrors.title", "patchErrors.stale", "patchErrors.unchanged", "patchErrors.acknowledge"].includes(code) ? code : "patchErrors.generic";
    setError(group);
  };
  async function preview() {
    invalidate(); const epoch = generation.current; setBusy(true);
    try {
      const value = await invoke("preview_bloodborne_patches", { titleId, gameVersion: version.trim(), ids: selected });
      if (alive.current && epoch === generation.current) setReview(value);
    } catch (e) { if (alive.current && epoch === generation.current) showError(e); }
    finally { if (alive.current) setBusy(false); }
  }
  async function apply() {
    if (!review || !acknowledged || busy) return;
    setBusy(true); setError("");
    try {
      const result = await setSave(t("revision.patchesApplied"), () => invoke("apply_bloodborne_patches", { token: review.token, acknowledged }));
      if (alive.current && result) { setReview(null); setAcknowledged(false); setSelected([]); setSuccess(true); }
    } catch (e) { if (alive.current) { setReview(null); setAcknowledged(false); showError(e); } }
    finally { if (alive.current) setBusy(false); }
  }
  return <section className="patch-workspace" style={{ backgroundImage: `url(${images?.backgrounds?.["statsBg.png"]?.src ?? "/assets/itemsBg/statsBg.png"})` }} aria-labelledby="patch-title" aria-busy={busy || catalogBusy}>
    <header className="patch-heading"><span className="patch-eyebrow">{t("patches.offline")}</span><h1 id="patch-title">{t("patches.title")}</h1><p>{t("patches.description")}</p></header>
    <div className="patch-notice"><strong>{t("patches.experimental")}</strong><p>{t("patches.compatibility")}</p></div>
    <div className="patch-settings">
      <label>{t("patches.titleId")}<select value={titleId} disabled={busy} onChange={e => { invalidate(); setTitleId(e.target.value); }}>
        <option value="">{t("patches.choose")}</option><option value="CUSA00207">CUSA00207</option><option value="CUSA00900">CUSA00900</option><option value="other">{t("patches.otherTitle")}</option>
      </select></label>
      <label>{t("patches.version")}<input value={version} maxLength={12} placeholder="01.09" inputMode="decimal" disabled={busy} onChange={e => { invalidate(); setVersion(e.target.value); }}/></label>
    </div>
    <p className="patch-muted">{t("patches.identityHint")}</p>
    {titleId === "other" && <p role="status" className="patch-notice">{t("patchErrors.title")}</p>}
    {error && <p role="alert" className="patch-error">{t(error)}</p>}
    {success && <p role="status" className="patch-success">{t("patches.success")}</p>}
    {catalogBusy && <p role="status">{t("operation.preparing")}</p>}
    {catalog && <div className="patch-columns">
      <section className="patch-panel" aria-label={t("patches.catalog")}>
        <div className="patch-panel-heading"><h2>{t("patches.catalog")}</h2><span>{t("patches.selected", { count: selected.length })}</span></div>
        <div className="patch-filters"><label className="patch-search">{t("patches.search")}<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <label>{t("patches.category")}<select value={filter} onChange={e => setFilter(e.target.value)}>{["all", "quantity", "weapon", "other"].map(kind => <option value={kind} key={kind}>{t(`patches.${kind}`)}</option>)}</select></label></div>
        <div className="patch-list">{visible.map(patch => <article className={`patch-card ${selected.includes(patch.id) ? "is-selected" : ""}`} key={patch.id}>
          <label className="patch-choice"><input type="checkbox" checked={selected.includes(patch.id)} disabled={busy || (selected.length >= 16 && !selected.includes(patch.id))} onChange={() => { invalidate(); setSelected(previous => previous.includes(patch.id) ? previous.filter(id => id !== patch.id) : [...previous, patch.id]); }} />
            <span><strong>{labels.get(patch.id)}</strong><small>{t(`patches.${patch.kind}Hint`)}</small></span></label>
          <details><summary>{t("patches.sourceCode")}</summary><p className="patch-muted">{patch.name}</p><pre>{patch.codes}</pre></details>
        </article>)}{!visible.length && <p>{t("patches.noResults")}</p>}</div>
        <div className="patch-actions"><button className="control-button control-button--quiet" disabled={busy || !selected.length} onClick={() => { invalidate(); setSelected([]); }}>{t("actions.reset")}</button><button className="control-button control-button--primary" disabled={busy || !selected.length} onClick={preview}>{t("patches.preview")}</button></div>
      </section>
      <section className="patch-panel patch-review" aria-labelledby="patch-review-title"><h2 id="patch-review-title">{t("patches.review")}</h2>
        {!review ? <p className="patch-muted">{t("patches.reviewHint")}</p> : <>
          <p>{review.title_id} · {review.game_version || t("patches.unspecified")}</p>
          <p className="patch-count">{t("patches.changedBytes", { count: review.changed_bytes })}</p>
          <ul className="patch-results">{review.results.map(result => <li key={result.id}><strong>{labels.get(result.id)}</strong><span>{t("patches.changedBytes", { count: result.changed_bytes })}</span>{result.skipped_searches > 0 && <small>{t("patches.partial")}</small>}</li>)}</ul>
          {review.changed_bytes > 0 ? <><details className="patch-byte-details"><summary>{t("patches.byteDetails")}</summary><div className="patch-table-scroll"><table><thead><tr><th>{t("patches.offset")}</th><th>{t("diff.before")}</th><th>{t("diff.after")}</th></tr></thead><tbody>{review.changes.map(change => <tr key={change.offset}><td>0x{hex(change.offset, 6)}</td><td>{hex(change.before, 2)}</td><td>{hex(change.after, 2)}</td></tr>)}</tbody></table></div></details>
            <label className="patch-acknowledge"><input type="checkbox" checked={acknowledged} disabled={busy} onChange={e => setAcknowledged(e.target.checked)}/><span>{t("patches.acknowledge")}</span></label>
            <button className="control-button control-button--primary patch-apply" disabled={!acknowledged || busy} onClick={apply}>{t("patches.apply")}</button></> : <p>{t("patchErrors.unchanged")}</p>}
        </>}
        <p className="patch-muted">{t("patches.memoryOnly")}</p>
      </section>
    </div>}
    <footer className="patch-credits"><a href="https://github.com/bucanero/apollo-patches" target="_blank" rel="noreferrer">Apollo / bucanero · GPL-3.0</a><span>{t("patches.credits")}</span></footer>
  </section>;
}
