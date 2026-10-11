import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),require=createRequire(path.join(root,'package.json'));
const ts=require('typescript'),before=process.argv.includes('--record-before');
const dir=path.join(root,'.sites-runtime/qa/tail-modules');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'package.json'),'{}');
for(const name of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import']){
 const source=before&&!['ai','answer-key','hybrid'].includes(name)?path.join(root,'.sites-runtime/qa/tail-before',name+'.ts'):path.join(root,'lib',name+'.ts');
 fs.writeFileSync(path.join(dir,name+'.js'),ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
}
const pdfRequire=createRequire(require.resolve('pdfjs-dist/package.json')),canvas=pdfRequire('@napi-rs/canvas');
global.DOMMatrix=canvas.DOMMatrix;global.Path2D=canvas.Path2D;global.ImageData=canvas.ImageData;global.Image=canvas.Image;
const Tesseract=require('tesseract.js');global.document={createElement:()=>canvas.createCanvas(1,1)};
const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs'),importer=require(path.join(dir,'pdf-import.js')),layout=require(path.join(dir,'pdf-layout.js'));
let worker;const results=[];
try{
for(const name of ['tail-single','tail-columns','tail-repeated','tail-scanned']){
 const doc=await pdf.getDocument({data:new Uint8Array(fs.readFileSync(path.join(root,'tests/fixtures',name+'.pdf'))),standardFontDataUrl:path.join(root,'node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')+'/'}).promise;
 const converted=await importer.convertPDF(doc,{mode:'local',engine:pdf,progress:()=>{},cancelled:()=>false,ai:()=>{throw new Error('AI kullanılmamalı');},ocr:async()=>{
 if(!worker){worker=await Tesseract.createWorker('tur+eng',1,{langPath:path.join(root,'public/vendor/ocr'),cachePath:path.join(root,'.sites-runtime/qa')});}
 return {setParameters:settings=>worker.setParameters(settings),recognize:c=>worker.recognize(c.toBuffer('image/png'),{},{text:true,blocks:true})};
 }});
 const summary={pdf:name+'.pdf',questions:converted.questions.map(q=>({number:q.number,text:q.text,options:q.options})),warnings:converted.warnings};results.push(summary);
 if(!before){
 assert.equal(converted.questions.length,name==='tail-columns'?3:2,name+' soru sayısı');
 for(const q of converted.questions)for(const o of q.options)assert.doesNotMatch(o,/KONTROL KODU|Sayfa 7|TAL[İI]MAT|KURUM|KOPYA|ÖRNEK|D[İI]KKAT|FEN B[İI]L[İI]MLER[İI]|SONRAK[İI] SAYFA/i,name+' alakasız şık metni');
 if(name==='tail-single'){assert.equal(converted.questions[0].options[3],'Gerçek şık metni ikinci satırda devam eder.');const page=await doc.getPage(1);const viewport=page.getViewport({scale:1});const content=await page.getTextContent();const lines=layout.textLines(content.items,viewport,pdf.Util);const a=layout.analyzePage(lines,1);const end=a.regions[0].options[3];const footer=lines.find(l=>l.text==='Sayfa 7');assert.ok(end.y+end.h<footer.y,'Şık görüntüsü de footer öncesinde bitmeli');}
 if(name==='tail-columns'){assert.deepEqual(converted.questions.map(q=>q.number),[1,2,3]);assert.deepEqual(converted.questions[0].options,['Sol A','Sol B','Sol C','Sol D']);assert.deepEqual(converted.questions[1].options,['Sağ A','Sağ B','Sağ C','Sağ D']);}
 if(name==='tail-repeated')assert.ok(converted.questions.every(q=>q.options[3]==='4'));
 assert.ok(converted.questions.every(q=>q.optionImages?.filter(Boolean).length===q.options.length),name+' şık görselleri');
 }
 await doc.destroy();console.log((before?'ÖNCE':'SONRA')+': '+name+' — '+JSON.stringify(summary.questions));
}
// Guard against over-filtering and column false positives with normal answer continuations.
if(!before){
 const a=layout.analyzePage([{x:.05,y:.1,w:.8,h:.02,text:'1. İfade?'},{x:.05,y:.2,w:.3,h:.02,text:'A) Başarılar sözcüğü'},{x:.05,y:.25,w:.3,h:.02,text:'B) Son seçenek'},{x:.05,y:.275,w:.3,h:.02,text:'çok satırda sürer.'},{x:.05,y:.3,w:.3,h:.02,text:'12 sayfa okunmuştur.'}],1);
 assert.equal(a.regions[0].question.options[1],'Son seçenek çok satırda sürer. 12 sayfa okunmuştur.');
 const same=layout.analyzePage([{x:.05,y:.1,w:.4,h:.02,text:'1. Soru?'},{x:.05,y:.2,w:.3,h:.02,text:'A) Kısa'},{x:.05,y:.3,w:.3,h:.02,text:'B) Doğru metin'},{x:.05,y:.325,w:.3,h:.02,text:'Talimatı öğrenci okur.'}],1);
 assert.equal(same.regions[0].question.options[1],'Doğru metin Talimatı öğrenci okur.');
  const water=layout.analyzePage([{x:.05,y:.1,w:.4,h:.02,text:'1. Soru?'},{x:.05,y:.2,w:.3,h:.02,text:'A) 1'},{x:.05,y:.3,w:.3,h:.02,text:'B) Uzun şık'},{x:.4,y:.315,w:.3,h:.02,text:'ÖRNEKTİR'},{x:.05,y:.325,w:.3,h:.02,text:'ikinci satır.'}],1);assert.equal(water.regions[0].question.options[1],'Uzun şık ikinci satır.');
 const order=layout.pageReadingOrder([{x:.05,y:.1,w:.4,h:.02,text:'1. Sol'},{x:.54,y:.1,w:.4,h:.02,text:'2. Sağ'},{x:.05,y:.2,w:.3,h:.02,text:'A) sol'},{x:.54,y:.2,w:.3,h:.02,text:'A) sağ'}]);assert.deepEqual(order.map(l=>l.text),['1. Sol','A) sol','2. Sağ','A) sağ']);
 const qr=require(path.join(dir,'quiz.js')).parsePages([{page:1,text:'1. Soru?\nA) 1\nB) 2\nTalimat: Sonraki bölüme geçiniz.\nKONTROL KODU: ZX-41'}]);assert.equal(qr[0].options[1],'2');
}
fs.mkdirSync(path.join(root,'docs'),{recursive:true});const report=path.join(root,'docs/tail-comparison.json');
if(before)fs.writeFileSync(report,JSON.stringify({before:results},null,2)+'\n');else{const prior=JSON.parse(fs.readFileSync(report,'utf8'));if(process.argv.includes('--update-report'))fs.writeFileSync(report,JSON.stringify({...prior,after:results},null,2)+'\n');console.log('4 gerçek PDF ve çok satırlı metin/alan sınırı kontrolleri başarılı.');}
}finally{if(worker)await worker.terminate();}
