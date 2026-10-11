import path from 'node:path';import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const digital=process.env.TAPU_REFERENCE_PDF,real=process.env.REAL_REFERENCE_PDF;
if(!digital||!real)throw Error('TAPU_REFERENCE_PDF and REAL_REFERENCE_PDF must point to your local reference PDFs. PDFs are deliberately not bundled.');
for(const file of [digital,real])if(!fs.existsSync(file))throw Error('Missing reference PDF: '+file);
const output=path.resolve(process.env.OCR_OUTPUT_DIR||path.join(root,'.sites-runtime/qa/ocr'));
if(process.env.OCR_RED_ABLATION==='1'){const cases=[{id:'baseline',selected:'audit'},{id:'white-k35',selected:'real',clean:'1',k:'35'},{id:'white-k60',selected:'real',clean:'1',k:'60'},{id:'synthetic-red',selected:'300dpi',marks:'1'},{id:'synthetic-red-white',selected:'300dpi',marks:'1',clean:'1',k:'35'}];for(const c of cases){const child=spawnSync(process.execPath,[path.join(root,'scripts/ocr/measure.mjs'),root,path.resolve(digital),path.resolve(real),path.join(output,c.id),c.selected],{stdio:'inherit',env:{...process.env,OCR_VARIATION:'base',OCR_RED_CLEAN:c.clean||'0',OCR_RED_MARKS:c.marks||'0',OCR_RED_K:c.k||'35'}});if(child.status!==0)process.exit(child.status||1);}process.exit(0);}
for(const variant of (process.env.OCR_VARIATIONS||'base').split(',')){
 const child=spawnSync(process.execPath,[path.join(root,'scripts/ocr/measure.mjs'),root,path.resolve(digital),path.resolve(real),path.join(output,variant),'audit'],{stdio:'inherit',env:{...process.env,OCR_VARIATION:variant}});
 if(child.status!==0)process.exit(child.status||1);
}
