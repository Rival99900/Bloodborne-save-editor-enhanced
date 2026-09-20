import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import fs from 'node:fs';
const files=fs.readdirSync('src',{recursive:true}).filter(f=>/\.jsx$/.test(f)&&!f.startsWith('i18n/'));
const keys=[...new Set(files.flatMap(f=>[...fs.readFileSync('src/'+f,'utf8').matchAll(/\bt\(["']([^"']+)["']/g)].map(m=>m[1])))];
const server=await createServer({logLevel:'error',server:{watch:null}});
try{const {LocalizationProvider,useLocalization,SUPPORTED_LANGUAGES}=await server.ssrLoadModule('/src/i18n/localization.jsx');
const report=[];let lang;
function Probe(){const {t}=useLocalization();for(const k of keys){const value=t(k,{count:1,index:1,error:'test',name:'test',version:'0.5.0'});if(value===k||/�|Ã©|â€™/.test(value))report.push({lang,k,value});}return null;}
for(const {code} of SUPPORTED_LANGUAGES){lang=code;globalThis.localStorage={getItem:()=>code};renderToStaticMarkup(React.createElement(LocalizationProvider,null,React.createElement(Probe)));}
console.log(JSON.stringify({languages:SUPPORTED_LANGUAGES.length,keys:keys.length,issues:report},null,2));
if(report.length)process.exitCode=1;
}finally{await server.close();}
