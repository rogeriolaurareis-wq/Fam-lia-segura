import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

rmSync('dist',{recursive:true,force:true});mkdirSync('dist/server/domain',{recursive:true});
cpSync('.output/server','dist/server',{recursive:true});
const assetFiles={};
function walk(dir){for(const f of readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,f.name);if(f.isDirectory())walk(full);else if(!f.name.endsWith('.map'))assetFiles['/'+path.relative('.output/public',full).split(path.sep).join('/')]=readFileSync(full).toString('base64');}}
walk('.output/public');
writeFileSync('dist/server/site-assets.js','export default '+JSON.stringify(assetFiles)+';\n');
for(const [input,output] of [
  ['hosting/backup.ts','dist/server/backup.js'],
  ['src/lib/storage/persist.ts','dist/server/domain/persist.js'],
  ['src/lib/domain/types.ts','dist/server/domain/types.js'],
  ['src/lib/domain/shopping.ts','dist/server/domain/shopping.js'],
]){
  let text=ts.transpileModule(readFileSync(input,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  text=text.replaceAll('../src/lib/storage/persist','./domain/persist.js').replaceAll('@/lib/domain/types','./types.js').replaceAll('@/lib/domain/shopping','./shopping.js').replaceAll("'./shopping'","'./shopping.js'").replaceAll('"./shopping"','"./shopping.js"');
  writeFileSync(output,text);
}
writeFileSync('dist/server/index.js',`import app from './index.mjs';
import assets from './site-assets.js';
import { backupApi } from './backup.js';
const types={js:'application/javascript',css:'text/css',svg:'image/svg+xml',woff:'font/woff',woff2:'font/woff2',txt:'text/plain',json:'application/json',ico:'image/x-icon',webmanifest:'application/manifest+json'};
export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==='/api/backup')return backupApi(request,env);
  if((request.method==='GET'||request.method==='HEAD')&&Object.hasOwn(assets,url.pathname)){
    const str=atob(assets[url.pathname]);const body=new Uint8Array(str.length);for(let i=0;i<str.length;i++)body[i]=str.charCodeAt(i);
    const ext=url.pathname.split('.').pop();
    return new Response(request.method==='HEAD'?null:body,{headers:{'content-type':types[ext]||'application/octet-stream','cache-control':url.pathname.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache','x-content-type-options':'nosniff'}});
  }
  return app.fetch(request,env,ctx);
}};`);
mkdirSync('dist/.openai',{recursive:true});cpSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log(`Worker preparado com ${Object.keys(assetFiles).length} arquivos estáticos e backup privado.`);
