import {existsSync,symlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
if(!existsSync('sites-source/node_modules'))symlinkSync(resolve('node_modules'),'sites-source/node_modules',process.platform==='win32'?'junction':'dir');
const suites=['quiz','tail','parsing','phase1','answer-key','ai-redirect','layout-quality','hybrid','answer-color','number-sequence','text-options','crop-quality','ocr-columns','red-ink','option-sequence','number-gap','reading','phase3d2','phase3f','editor-simplification','hydration'];
for(const name of suites){const args=[...(name==='tail'?[]:['--test']),'sites-source/tests/'+name+'-regression.mjs'];const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
