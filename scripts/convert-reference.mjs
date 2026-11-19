// Gerçek PDF dönüşüm simülasyonu: bir veya birkaç PDF'yi uygulamanın yerel dönüşüm hattından (PDF.js + Tesseract OCR)
// geçirir, özet raporu yazdırır ve ayrıntıyı JSON olarak kaydeder. AI çağrısı yapılmaz, veritabanına dokunulmaz.
// Kullanım: node scripts/convert-reference.mjs [pdf ...]   (boşsa tests/reference/*.pdf)
//           GAP_REPAIR=1: uygulamadaki gibi numara boşluğu OCR kurtarmasını açar (varsayılan kapalı, hızlı);
//           DIAGNOSTICS=1: numara adaylarının kabul/ret kararlarını JSON'a yazar.
//           OCR_OUTPUT_DIR ile çıktı klasörü seçilir (varsayılan .test-tmp/reference).
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const root=process.cwd(),req=createRequire(path.join(root,'package.json'));
const ts=req('typescript'),Tesseract=req('tesseract.js'),canvasLib=req('@napi-rs/canvas');
const out=path.resolve(process.env.OCR_OUTPUT_DIR||path.join(root,'.test-tmp/reference')),mods=path.join(out,'modules');
fs.mkdirSync(mods,{recursive:true});fs.writeFileSync(path.join(mods,'package.json'),'{"type":"commonjs"}');
for(const name of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import']){
 fs.writeFileSync(path.join(mods,name+'.js'),ts.transpileModule(fs.readFileSync(path.join(root,'lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
}
global.DOMMatrix=canvasLib.DOMMatrix;global.Path2D=canvasLib.Path2D;global.ImageData=canvasLib.ImageData;global.Image=canvasLib.Image;
const pdf=await import(pathToFileURL(req.resolve('pdfjs-dist/legacy/build/pdf.mjs')));
const importer=req(path.join(mods,'pdf-import.js'));
const fontUrl=path.join(root,'node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')+'/';

const files=process.argv.slice(2);
if(!files.length){const dir=path.join(root,'tests/reference');if(fs.existsSync(dir))files.push(...fs.readdirSync(dir).filter(n=>n.toLowerCase().endsWith('.pdf')).map(n=>path.join(dir,n)));}
if(!files.length)throw new Error('PDF verilmedi ve tests/reference/ boş.');

const summaries=[];
for(const file of files){
 const started=performance.now(),bytes=new Uint8Array(fs.readFileSync(file));
 // Çekirdek tarama: metin katmanı var mı?
 global.document={createElement:()=>canvasLib.createCanvas(1,1)};
 const doc=await pdf.getDocument({data:bytes,standardFontDataUrl:fontUrl}).promise;
 let textChars=0;for(let i=1;i<=doc.numPages;i++){const content=await (await doc.getPage(i)).getTextContent();textChars+=content.items.map(x=>x.str).join('').length;}
 let worker,recognitions=0;const diagPages=[];const warnings=[];
 try{
  const result=await importer.convertPDF(doc,{mode:'local',engine:pdf,cancelled:()=>false,recoverNumberGaps:process.env.GAP_REPAIR==='1',onDiagnostics:process.env.DIAGNOSTICS==='1'?p=>diagPages.push({page:p.page,reading:p.reading,lines:(p.lines||[]).map(l=>({x:+l.x.toFixed(3),y:+l.y.toFixed(3),w:+l.w.toFixed(3),h:+l.h.toFixed(3),text:l.text,confidence:l.confidence}))}):undefined,
   progress:(p,s)=>{if(process.env.VERBOSE)console.log('  '+Math.round(p*100)+'% '+s);},
   ai:()=>{throw new Error('Bu simülasyonda AI çağrısı yapılmamalı.');},
   ocr:async()=>{
    if(!worker){const before=global.document;delete global.document;worker=await Tesseract.createWorker('tur+eng',1,{langPath:path.join(root,'public/vendor/ocr'),cachePath:path.join(mods,'language-cache'),cacheMethod:'none'});global.document=before;}
    return {setParameters:s=>worker.setParameters(s),terminate:()=>{},recognize:async c=>{recognitions++;return worker.recognize(c.toBuffer('image/png'),{},{text:true,blocks:true});}};
   }});
  const qs=result.questions||[],numbers=qs.map(q=>q.number).filter(Boolean);
  const missing=[];if(numbers.length){const max=Math.max(...numbers);for(let n=1;n<=max;n++)if(!numbers.includes(n))missing.push(n);}
  const optionCounts={};for(const q of qs)optionCounts[q.options.length]=(optionCounts[q.options.length]||0)+1;
  const withKey=qs.filter(q=>q.correct!==null&&q.correct!==undefined).length;
  const summary={file:path.basename(file),pages:doc.numPages,textChars,kind:textChars>200*doc.numPages?'dijital metin':'taranmış/OCR',
   ocrCalls:recognitions,seconds:Math.round((performance.now()-started)/100)/10,
   questions:qs.length,expectedCount:result.expectedCount??null,missingNumbers:missing,optionCounts,
   withAnswerKey:withKey,pdfAnswerKey:result.pdfAnswerKey?{page:result.pdfAnswerKey.page,detected:Object.keys(result.pdfAnswerKey.keys).length,conflicts:[...(result.pdfAnswerKey.conflicts||[])].length}:null,withImage:qs.filter(q=>q.image).length,withAllOptionImages:qs.filter(q=>q.optionImages?.length&&q.optionImages.every(Boolean)).length,
   emptyText:qs.filter(q=>!(q.text||'').trim()&&!q.image).length,emptyOption:qs.filter(q=>q.options.some(o=>!(o||'').trim())).length,
   sections:(result.sections||[]).map(s=>({name:s.name,expected:s.expectedCount??null,actual:qs.filter(q=>q.sectionId===s.id).length})),
   excludedBlocks:(result.excludedBlocks||[]).length,warnings:qs.filter(q=>q.warnings?.length).length,suspicious:qs.filter(q=>q.warnings?.length||q.options.length<4).map(q=>q.number).slice(0,40)};
  summaries.push(summary);
  fs.writeFileSync(path.join(out,path.basename(file,'.pdf')+'.json'),JSON.stringify({summary,questions:qs.map(({image,optionImages,stemImage,studentStemImage,studentImage,studentOptionImages,...q})=>({...q,hasImage:!!image,optionImages:(optionImages||[]).map(Boolean)})),numberDiagnostics:process.env.DIAGNOSTICS==='1'?result.numberDiagnostics:undefined,ocrPages:process.env.DIAGNOSTICS==='1'?diagPages:undefined,numberGapDiagnostics:process.env.DIAGNOSTICS==='1'?result.numberGapDiagnostics:undefined},null,1));
  console.log(JSON.stringify(summary,null,1));
 }finally{await worker?.terminate().catch(()=>{});await doc.destroy();}
}
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summaries,null,1));
