import { useEffect, useState } from 'react';
import { useLocalization } from '../i18n/localization';
import { loadVignetteTranslations, localizeVignetteText } from '../i18n/vignetteTranslations';
import { loadEffectTranslations, localizeEffectText } from '../i18n/effectTranslations';
export default function SaveDiffTable({diff,emptyKey='diff.none'}) {
  const {language,t} = useLocalization();
  const [catalog,setCatalog] = useState({});
  useEffect(() => {
    let current = true; setCatalog({});
    Promise.all([loadVignetteTranslations(language),loadEffectTranslations(language)]).then(([names,effects]) => {if (current) setCatalog({names,effects});});
    return () => {current=false;};
  },[language]);
  const name = text => localizeVignetteText(catalog.names,'name',text);
  const effects = entries => (entries ?? []).map(effect => localizeEffectText(catalog.effects,effect[1])).join(' · ');
  function shape(entry) {
    if (entry === '-') return '—';
    if (entry === 'Closed') return t('diff.closed');
    const key=`upgradeShape.${String(entry).toLowerCase()}`, label=t(key);
    return label === key ? String(entry) : label;
  }
  function value(row,entry) {
    if (entry == null) return '—';
    if (row.type === 'boss') return t(entry ? 'bosses.dead' : 'bosses.alive');
    if (row.type === 'name') return name(entry);
    if (row.type === 'effects') return effects(entry);
    if (row.type === 'shape') return shape(entry);
    if (row.type === 'slots') return entry.map((slot,i) => `${i+1}: ${shape(slot.shape)} (${slot.gem ?? '—'}) ${effects(slot.effects)}`).join(' · ');
    return String(entry);
  }
  if (!diff?.rows?.length) return <p>{t(emptyKey)}</p>;
  return <>
    <div className="save-diff-scroll" tabIndex={0} role="region" aria-label={t('diff.details')}>
      <table className="save-diff-table"><thead><tr><th scope="col">{t('diff.field')}</th><th scope="col">{t('diff.before')}</th><th scope="col">{t('diff.after')}</th></tr></thead>
        <tbody>{diff.rows.map((row,i) => <tr key={i}><th scope="row">{row.location ? `${t(`sidebar.${row.location}`)} · ${name(row.name)} · ` : ''}{t(row.label)}{row.suffix ? ` ${row.suffix}` : ''}</th><td>{value(row,row.before)}</td><td>{value(row,row.after)}</td></tr>)}</tbody>
      </table>
    </div>
    {diff.omitted > 0 ? <p>{t('diff.more',{count:diff.omitted})}</p> : null}
  </>;
}
