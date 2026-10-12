// Local audit only: answers stay in memory for contrasts, never key indices in output.
import {contrast,redComponents,alignedMarkerBoxes,normalizeByPosition} from './leakage-metrics.mjs';
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const req=createRequire(path.resolve('package.json')),C=req('@napi-rs/canvas'),ts=req('typescript');
global.DOMMatrix=C.DOMMatrix;global.Path2D=C.Path2D;global.ImageData=C.ImageData;global.Image=C.Image;global.document={createElement:()=>C.createCanvas(1,1)};
const [source,examPath,outPath]=process.argv.slice(2);
if(!source||!examPath||!outPath)throw Error('Usage: node scripts/measure-leakage.mjs source.pdf exam.json output.json');
const modules=path.resolve('.audit/leakage-modules');fs.mkdirSync(modules,{recursive:true});fs.writeFileSync(modules+'/package.json','{"type":"commonjs"}');
for(const n of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import'])fs.writeFileSync(modules+'/'+n+'.js',ts.transpileModule(fs.readFileSync('lib/'+n+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const imp=req(modules+'/pdf-import.js'),quiz=req(modules+'/quiz.js'),pdf=await import(pathToFileURL(req.resolve('pdfjs-dist/legacy/build/pdf.mjs'))),e=JSON.parse(fs.readFileSync(examPath));
const localAnswers=e.pdfAnswerKey?.keys||{};delete e.pdfAnswerKey;
const doc=await pdf.getDocument({data:new Uint8Array(fs.readFileSync(source))}).promise,rows=[],strongRows=[],questions=[];
function pixels(canvas,b){
 if(!b)return null;
 const x=Math.max(0,Math.floor(b.x*canvas.width)),y=Math.max(0,Math.floor(b.y*canvas.height)),w=Math.min(canvas.width-x,Math.ceil(b.w*canvas.width)),h=Math.min(canvas.height-y,Math.ceil(b.h*canvas.height));
 if(w<=0||h<=0)return null;
 const d=canvas.getContext('2d').getImageData(x,y,w,h).data;let dark=0,red=0;
 for(let i=0;i<d.length;i+=4){if(Math.max(d[i],d[i+1],d[i+2])<160)dark++;if(imp.reddish(d[i],d[i+1],d[i+2]))red++;}
 return {dark:dark/(w*h),red:red/(w*h),area:w*h};
}
for(const pageNumber of [...new Set(e.questions.map(q=>q.page))]){
 const page=await doc.getPage(pageNumber),v=page.getViewport({scale:2}),c=C.createCanvas(Math.floor(v.width),Math.floor(v.height));
 await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
 const safe=imp.whitePage(c),strong=redComponents(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height,(r,g,b)=>r-g>35&&r-b>35);
 const strongCount=b=>{let n=0;for(let y=Math.max(0,Math.floor(b.y*c.height));y<Math.min(c.height,Math.ceil((b.y+b.h)*c.height));y++)for(let x=Math.max(0,Math.floor(b.x*c.width));x<Math.min(c.width,Math.ceil((b.x+b.w)*c.width));x++)n+=strong[y*c.width+x];return n;};
 for(const q of e.questions.filter(q=>q.page===pageNumber)){
  const cells=q.options.map((_,i)=>q.provenance?.['optionImages.'+i]?.box||null),width=q.optionMarkerWidth,aligned=alignedMarkerBoxes(cells,width),options=[];
  for(let i=0;i<q.options.length;i++){
   const cell=cells[i];if(!cell||!Number.isFinite(width)||width<=0||cell.w<=width){options.push(null);continue;}
   const marker={...cell,w:width},body={...cell,x:cell.x+width,w:cell.w-width},before=pixels(c,marker),clean=pixels(safe,marker),firstBefore=pixels(c,aligned[i]),firstClean=pixels(safe,aligned[i]),bodyBefore=pixels(c,body),bodyClean=pixels(safe,body);
   const masked=await C.loadImage(imp.captureMaskedOption(safe,cell,cell.x+width)),mc=C.createCanvas(masked.width,masked.height);mc.getContext('2d').drawImage(masked,0,0);
   const maskedRatio=pixels(mc,{x:0,y:0,w:Math.min(1,width/cell.w),h:1});mc.width=mc.height=1;
   options.push({letter:String.fromCharCode(65+i),geometry:aligned[i]?'first-line-anchor-assumed':'unknown',cell,alignedMarker:aligned[i],markerDarkBefore:before?.dark??null,markerDarkClean:clean?.dark??null,markerDarkMasked:maskedRatio?.dark??null,alignedDarkBefore:firstBefore?.dark??null,alignedDarkClean:firstClean?.dark??null,erasedArea:before?.red??null,alignedErasedArea:firstBefore?.red??null,bodyDarkLoss:bodyBefore&&bodyClean?bodyBefore.dark-bodyClean.dark:null,bodyRed:bodyBefore?.red??null,disabled:q.incompleteOptionImages?.includes(i)||false});
   if(strongCount(cell))strongRows.push({number:q.number,option:i,markerRed:strongCount(marker),bodyRed:strongCount(body)});
   if((before?.red||0)+(bodyBefore?.red||0)>0)rows.push({number:q.number,option:i});
  }
  const key=localAnswers[q.number],score=field=>contrast(options.map(o=>o?.[field]),key);
  questions.push({number:q.number,page:q.page,status:options.length===5&&options.every(Boolean)?'measured':'insufficient-option-geometry',options,raw:{before:score('markerDarkBefore'),clean:score('markerDarkClean'),masked:score('markerDarkMasked'),erased:score('erasedArea'),bodyLoss:score('bodyDarkLoss')},aligned:{before:score('alignedDarkBefore'),clean:score('alignedDarkClean'),erased:score('alignedErasedArea')}});
 }
 c.width=c.height=safe.width=safe.height=1;page.cleanup();console.log(`Measured page ${pageNumber}: ${questions.length} question records`);
}
for(const row of questions){
 row.normalized={};
 for(const [name,field] of Object.entries({before:'alignedDarkBefore',clean:'alignedDarkClean',erased:'alignedErasedArea',masked:'markerDarkMasked',bodyLoss:'bodyDarkLoss'})){
  const n=normalizeByPosition(questions,row.number,field);
  row.normalized[name]={status:n.status,sampleCounts:n.sampleCounts,contrast:n.values?contrast(n.values,localAnswers[row.number]):null};
 }
 row.scoringStatus=Number.isInteger(localAnswers[row.number])?'available':'unknown-reference';
}
let safeImages=0,maxRed=0;
for(const q of e.questions){const protectedSet=quiz.protectedImages(q);for(const src of [protectedSet.image,quiz.safeStem(q),...protectedSet.options].filter(Boolean)){const im=await C.loadImage(src),c=C.createCanvas(im.width,im.height);c.getContext('2d').drawImage(im,0,0);maxRed=Math.max(maxRed,pixels(c,{x:0,y:0,w:1,h:1}).red);safeImages++;c.width=c.height=1;}}
const summarize=a=>{const matched=a.filter(r=>localAnswers[r.number]===r.option).length;return {affected:a.length,match:matched,ratio:a.length?matched/a.length:null};};
const counts=group=>Object.fromEntries(['before','clean','masked','erased','bodyLoss'].map(stage=>{const contrasts=questions.map(q=>group==='normalized'?q.normalized[stage]?.contrast:q.raw[stage]).filter(Boolean);return [stage,{measured:contrasts.length,flagged:contrasts.filter(c=>c.flag).length,uniqueExtreme:contrasts.filter(c=>c.uniqueExtreme).length}];}));
const expected=e.expectedCount||Math.max(...e.questions.map(q=>q.number)),missing=Array.from({length:expected},(_,i)=>i+1).filter(n=>!questions.some(q=>q.number===n));
const result={measurementOnly:true,keySource:'Reference PDF answer key, memory-only scoring; no option key indices emitted',thresholdUnchanged:true,renderDpi:144,ocrConfigurationUnchanged:'tur+eng / OEM 1 / PSM 11 / 144 DPI',metric:'Dark RGB max <160; production reddish predicate; correct-minus-other-four mean and descriptive z. Exploratory flag |z|>=2, or nonzero difference with zero other-choice variance.',geometryMethod:'Same question-level marker width; common first-line height from A-D median capped at .018 page height; own OCR x/y anchor retained. No key is used in geometry or baseline.',normalizationMethod:'Aligned dark density minus leave-one-question-out median for same option letter/position; minimum eight finite peer questions per position. Baseline is pooled across page styles and does not certify glyph recognition.',coverage:{imported:questions.length,expected,missingNumbers:missing,completeGeometry:questions.filter(q=>q.status==='measured').length,unknownGeometry:questions.filter(q=>q.status!=='measured').map(q=>q.number)},oldOverlap:{match:18,affected:23,ratio:18/23},newOverlap:summarize(strongRows),rawThresholdOverlap:summarize(rows),first11:summarize(strongRows.filter(r=>r.number<=11)),aggregate:{raw:counts('raw'),normalized:counts('normalized')},questions,safeImages,maxRedRatio:maxRed,limits:['OCR anchors can be wrong; fixed first-line windows are geometry normalization, not verified glyph boxes.','Five choices do not yield a calibrated statistical leakage detector; no multiple-testing control.','Letter/position baselines mix fonts, pages and possible marked options; robust median does not guarantee clean controls.','Body-loss normalization retains dependence on differing option content; body erasure is a remaining signal and content-loss risk.','Masked metric reconstructs the production strip at 144 DPI; protected image scan reports actual stored student image red ratio separately.','Missing question/option geometry remains unknown and cannot support a no-leakage conclusion.'],claim:'Zero red is not proof of no leakage; geometry/baseline normalization is descriptive and no leak-free claim is made.'};
fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(result,null,2));
console.log(JSON.stringify({coverage:result.coverage,aggregate:result.aggregate,overlap:result.newOverlap,safeImages,maxRed}));await doc.destroy();
