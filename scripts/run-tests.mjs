
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const policy=spawnSync(process.execPath,['scripts/check-test-policy.mjs'],{stdio:'inherit'});
if(policy.status!==0)process.exit(policy.status||1);
const lic=spawnSync(process.execPath,['scripts/licenses.mjs','--check'],{stdio:'inherit'});
if(lic.status!==0)process.exit(lic.status||1);
const suites=['quiz','tail','parsing','phase1','answer-key','ai-redirect','gemini-network','layout-quality','hybrid','answer-color','number-sequence','text-options','crop-quality','ocr-columns','red-ink','option-sequence','number-gap','reading','phase3d2','phase3f','editor-simplification','hydration','phase3g-manual','phase3g-metric','phase3i','phase3i-figure','ui-followup'];
// Varsayılan DATABASE_URL gerçek data/quiz.db'dir; test paketleri onu hiç görmesin.
const testEnv={...process.env,DATABASE_URL:'file:'+resolve('.test-tmp/run-tests/quiz.db')};
mkdirSync(resolve('.test-tmp/run-tests'),{recursive:true});
for(const name of suites){const args=[...(name==='tail'?[]:['--test']),'tests/'+name+'-regression.mjs'];const r=spawnSync(process.execPath,args,{stdio:'inherit',env:testEnv});if(r.status!==0)process.exit(r.status||1);}
