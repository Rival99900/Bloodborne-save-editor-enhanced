import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const server = await createServer({logLevel:'error',server:{watch:null}});
try {
  const p=await server.ssrLoadModule('/src/utils/characterPresets.js');
  const {buildSaveDiff}=await server.ssrLoadModule('/src/utils/saveDiff.js');
  const stats=[...p.PRESET_STAT_NAMES,'Echoes','Ng'].map((name,i)=>({name,value:i+10,rel_offset:100+i,length:4,times:1}));
  const preset=p.capturePreset(' Test ',stats,'one');
  assert.equal(preset.name,'Test'); assert.equal(Object.keys(preset.stats).length,9);
  assert(!('Ng' in preset.stats)); assert(!('rel_offset' in preset.stats));
  const changed=structuredClone(preset); changed.stats.Health=99;
  const draft=p.applyPresetDraft(stats,changed);
  assert.equal(stats[0].value,10); assert.equal(draft[0].value,99);
  assert.equal(draft[0].rel_offset,stats[0].rel_offset); assert.deepEqual(draft.slice(9),stats.slice(9));
  for (const bad of [-1,Infinity,1.5,'12',2_000_000_001]) assert.throws(()=>p.validatePreset({...preset,stats:{...preset.stats,Health:bad}}));
  assert.throws(()=>p.validatePresets([preset,preset]));
  assert.throws(()=>p.validatePresets(Array.from({length:21},(_,i)=>({...preset,id:String(i)}))));
  let raw=null; const storage={getItem:()=>raw,setItem:(_key,value)=>{raw=value;}};
  assert.deepEqual(p.readPresets(storage),[]); p.writePresets(storage,[preset]); assert.deepEqual(p.readPresets(storage),[preset]);
  raw='{invalid'; assert.throws(()=>p.readPresets(storage)); assert.equal(raw,'{invalid');
  assert.throws(()=>p.writePresets({setItem(){throw Error('quota');}},[preset]));
  const a={stats,playtime:10000,inventory:{articles:{items:[{first_part:123,id:5,amount:1,info:{item_name:'Pebble'}}]}}};
  const b=structuredClone(a); b.stats=draft;b.playtime=12000;b.inventory.articles.items[0].amount=7;
  const diff=buildSaveDiff(a,b); assert.equal(diff.rows.length,3);
  assert.deepEqual(diff.rows.find(r=>r.label==='diff.playtime'),{label:'diff.playtime',before:10,after:12});
  assert.equal(buildSaveDiff(a,a).rows.length,0);
  assert.equal(buildSaveDiff(a,b,1).omitted,2);
  const reversed=buildSaveDiff(b,a); diff.rows.forEach((row,i)=>{assert.deepEqual(row.before,reversed.rows[i].after);assert.deepEqual(row.after,reversed.rows[i].before);});
  const moved=structuredClone(a);moved.storage=moved.inventory;delete moved.inventory;
  const movement=buildSaveDiff(a,moved);assert.equal(movement.rows.length,2);assert.equal(movement.rows[0].after,undefined);assert.equal(movement.rows[1].before,undefined);
  const gems={inventory:{upgrades:{gems:[{id:1,effects:[[12,'Old']]}]}}};const gemsAfter=structuredClone(gems);gemsAfter.inventory.upgrades.gems[0].effects[0][1]='New';
  const gemDiff=buildSaveDiff(gems,gemsAfter);gemsAfter.inventory.upgrades.gems[0].effects[0][1]='Later';assert.equal(gemDiff.rows[0].after[0][1],'New');
  const {LocalizationProvider,useLocalization,SUPPORTED_LANGUAGES}=await server.ssrLoadModule('/src/i18n/localization.jsx');
  const {default:CharacterPresets}=await server.ssrLoadModule('/src/components/CharacterPresets.jsx');
  const {default:SaveDiffTable}=await server.ssrLoadModule('/src/components/SaveDiffTable.jsx');
  const {default:RevisionPanel}=await server.ssrLoadModule('/src/components/RevisionPanel.jsx');
  const strings=JSON.parse(readFileSync('src/i18n/v050Translations.json','utf8'));const keys=Object.keys(strings.en).sort();
  assert.equal(SUPPORTED_LANGUAGES.length,14);
  for (const {code} of SUPPORTED_LANGUAGES) {
    assert.deepEqual(Object.keys(strings[code]).sort(),keys);
    for (const key of keys) {assert(strings[code][key].trim());assert.deepEqual(strings[code][key].match(/\{\{\w+\}\}/g),strings.en[key].match(/\{\{\w+\}\}/g));}
    globalThis.localStorage={getItem:()=>code};
    function Check(){const {t}=useLocalization();for(const key of keys) assert.notEqual(t(key),key,`${code}: ${key}`);return React.createElement(React.Fragment,null,React.createElement(CharacterPresets,{stats,onLoad(){}}),React.createElement(SaveDiffTable,{diff}));}
    const html=renderToStaticMarkup(React.createElement(LocalizationProvider,null,React.createElement(Check)));
    assert(html.includes('<table'));assert(!html.includes('[object Object]'));assert(!html.includes('undefined'));
  }
  const journal=renderToStaticMarkup(React.createElement(LocalizationProvider,null,React.createElement(RevisionPanel,{diff,entries:[{id:1,timestamp:0,label:'Operation retained',diff}],canUndo:true,canRedo:false})));
  assert.equal((journal.match(/<table/g)||[]).length,1,'Show only one before/after table');
  assert(journal.includes('Operation retained'));
  console.log('PASS: preset isolation/validation/storage failures; stat/item/transfer/effect diffs and immutable history; all locale keys in 13 translations + English; component SSR.');
} finally {delete globalThis.localStorage;await server.close();}
