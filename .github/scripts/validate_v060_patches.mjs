import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const strings=JSON.parse(fs.readFileSync('src/i18n/v060Translations.json','utf8'));
const keys=Object.keys(strings.en).sort();
const server=await createServer({logLevel:'error',server:{watch:null}});
try {
 await server.listen();
 const {LocalizationProvider,useLocalization,SUPPORTED_LANGUAGES}=await server.ssrLoadModule('/src/i18n/localization.jsx');
 const {getReleaseSummary}=await server.ssrLoadModule('/src/utils/releaseSummary.js');
 const notes=JSON.parse(fs.readFileSync('src/i18n/releaseSummaries.json','utf8'));
 const {default:Patches,patchLabel}=await server.ssrLoadModule('/src/pages/patches/Patches.jsx');
 const {SaveContext}=await server.ssrLoadModule('/src/context/context.js');
 let lang;
 function Probe(){const {t}=useLocalization();for(const key of keys)assert.equal(t(key,{count:2,name:'TEST'}),strings[lang][key].replaceAll('{{count}}','2').replaceAll('{{name}}','TEST'));return null;}
 const records=[];
 for (const cusa of ['CUSA00207','CUSA00900']) {
  const source=fs.readFileSync(`src-tauri/resources/patches/${cusa}.savepatch`,'utf8');
  for(const match of source.matchAll(/^\[(.+)\]\r?\n([\s\S]*?)(?=^\[|$(?![\s\S]))/gm)){
   const name=match[1]; if(name.startsWith('INFO:')||name.startsWith('Group:'))continue;
   const kind=name.startsWith('Max ')?'quantity':name.startsWith('Turn Pebble')?'conversion':name.startsWith('Revered ')?'coldblood':name.startsWith('Guidance Rune')?'guidance':name.startsWith('Isz ')?'isz':'weapon';
   const item_name=name.replace(/^Max /,'').split(' (Must')[0].split('+10')[0].replaceAll('’',"'");
   records.push({name,kind,item_name});
  }
 }
 assert(records.length>100);
 for(const {code} of SUPPORTED_LANGUAGES){
  assert(notes.versions['0.6.0'][code]?.trim(),`Missing update summary: ${code}`);
  assert.equal(getReleaseSummary(notes.default.en,code,'0.6.0'),notes.versions['0.6.0'][code]);
  assert.equal(getReleaseSummary(notes.versions['0.6.0'].en,code,'0.6.0',notes.versions['0.6.0']),notes.versions['0.6.0'][code]);
  lang=code;assert.deepEqual(Object.keys(strings[lang]).sort(),keys);
  for(const key of keys){assert(strings[lang][key].trim());assert.deepEqual(strings[lang][key].match(/\{\{\w+\}\}/g),strings.en[key].match(/\{\{\w+\}\}/g));}
  globalThis.localStorage={getItem:()=>code};
  const html=renderToStaticMarkup(React.createElement(LocalizationProvider,null,React.createElement(Probe),React.createElement(SaveContext.Provider,{value:{save:{},setSave:()=>{}}},React.createElement(Patches))));
  assert(!html.includes('patchErrors.')&&!html.includes('patches.'));
  const names=code==='en'?null:JSON.parse(fs.readFileSync(`src/i18n/vignetteTranslations/${code}.json`,'utf8'));
  for(const p of records){
   const t=(key,vars={})=>{assert(strings[code][key],`${code}:${key}`);return strings[code][key].replace('{{name}}',vars.name??'');};
   const label=patchLabel(p,t,names);assert(label&&!label.includes('undefined'));
   if(names&&['quantity','weapon','conversion'].includes(p.kind)){
    const name=(p.kind==='conversion'?p.name.split(' into ')[1].split(' (Must')[0]:p.item_name).replace('Bastard Of Loran','Bastard of Loran');
    assert(names.names[name],`Missing item translation ${code}: ${name}`);
   }
  }
 }
 console.log(JSON.stringify({languages:SUPPORTED_LANGUAGES.length,keys:keys.length,sourceEntries:records.length,translationAndRender:'passed'}));
}finally{await server.close();}
