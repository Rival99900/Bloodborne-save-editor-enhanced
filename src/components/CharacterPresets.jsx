import { useEffect, useState } from 'react';
import { useLocalization } from '../i18n/localization';
import ConfirmDialog from './ConfirmDialog';
import SaveDiffTable from './SaveDiffTable';
import { buildSaveDiff } from '../utils/saveDiff';
import { readPresets,writePresets,capturePreset,applyPresetDraft,MAX_PRESETS } from '../utils/characterPresets';
export default function CharacterPresets({stats,onLoad,disabled=false}) {
  const {t}=useLocalization();
  const [presets,setPresets]=useState([]), [name,setName]=useState('');
  const [preview,setPreview]=useState(null), [deleting,setDeleting]=useState(null);
  const [status,setStatus]=useState(''), [ready,setReady]=useState(false);
  useEffect(() => {
    try {setPresets(readPresets(localStorage));setReady(true);} catch {setStatus('presets.storageError');}
  },[]);
  function persist(next) {
    try {writePresets(localStorage,next);setPresets(next);return true;} catch {setStatus('presets.storageError');return false;}
  }
  function capture() {
    if (presets.length >= MAX_PRESETS) {setStatus('presets.limit');return;}
    try {const next=capturePreset(name,stats,crypto.randomUUID());if (persist([...presets,next])) {setName('');setStatus('presets.saved');}}
    catch {setStatus('presets.invalid');}
  }
  const nextStats=preview ? applyPresetDraft(stats,preview) : null;
  const diff=preview ? buildSaveDiff({stats},{stats:nextStats}) : null;
  return <section className="character-presets" aria-labelledby="character-presets-title">
    <h2 id="character-presets-title">{t('presets.title')}</h2><p>{t('presets.description')}</p>
    <div className="character-presets__save"><label htmlFor="character-preset-name">{t('presets.name')}</label>
      <input id="character-preset-name" value={name} maxLength={60} onChange={e=>setName(e.target.value)} disabled={disabled || !ready}/>
      <button className="control-button" type="button" onClick={capture} disabled={disabled || !ready || !name.trim() || presets.length>=MAX_PRESETS}>{t('presets.save')}</button>
    </div>
    {presets.length ? <ul className="character-presets__list">{presets.map(preset=><li key={preset.id}><strong>{preset.name}</strong>
      <button className="control-button" type="button" disabled={disabled} onClick={()=>{setPreview(preset);setStatus('');}}>{t('presets.preview')}</button>
      <button className="control-button" type="button" disabled={disabled} onClick={()=>setDeleting(preset)}>{t('presets.delete')}</button></li>)}</ul> : <p>{t('presets.empty')}</p>}
    {preview ? <div className="character-presets__preview"><h3>{preview.name}</h3><SaveDiffTable diff={diff}/><div className="editor-action-row">
      <button className="control-button" type="button" onClick={()=>setPreview(null)}>{t('forge.cancel')}</button>
      <button className="control-button control-button--primary" type="button" disabled={disabled || !diff.rows.length} onClick={()=>{onLoad(nextStats);setPreview(null);setStatus('presets.loaded');}}>{t('presets.load')}</button>
    </div></div> : null}
    {status ? <p role="status">{t(status)}</p> : null}
    {presets.length>=MAX_PRESETS ? <p>{t('presets.limit')}</p> : null}
    {deleting ? <ConfirmDialog title={deleting.name} description={t('presets.deleteConfirm')} confirmLabel={t('presets.delete')} onCancel={()=>setDeleting(null)} onConfirm={()=>{
      if (persist(presets.filter(p=>p.id!==deleting.id))) {if (preview?.id===deleting.id) setPreview(null);setDeleting(null);setStatus('');}
    }}/> : null}
  </section>;
}
