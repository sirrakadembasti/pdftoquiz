
import {spawnSync} from 'node:child_process';
const policy=spawnSync(process.execPath,['scripts/check-test-policy.mjs'],{stdio:'inherit'});
if(policy.status!==0)process.exit(policy.status||1);
const suites=['quiz','tail','parsing','phase1','answer-key','ai-redirect','gemini-network','layout-quality','hybrid','answer-color','number-sequence','text-options','crop-quality','ocr-columns','red-ink','option-sequence','number-gap','reading','phase3d2','phase3f','editor-simplification','hydration','phase3g-manual','phase3g-metric','phase3i','phase3i-figure','ui-followup'];
for(const name of suites){const args=[...(name==='tail'?[]:['--test']),'tests/'+name+'-regression.mjs'];const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
