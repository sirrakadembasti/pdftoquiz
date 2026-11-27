// Sentetik taranmış sınav (tests/fixtures/scanned-sections.pdf, üreteç: scripts/fixtures/scanned-sections.mjs) gerçek yerel
// dönüşüm hattından (PDF.js + Tesseract, AI yok) geçer. Gerçek belgeye bağlı olmadan, taranmış belgelerdeki yapı sinyallerini korur.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {test} from 'node:test';import assert from 'node:assert/strict';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),require=createRequire(path.join(root,'package.json')),ts=require('typescript');
const out=path.join(root,'.test-tmp/qa/scanned-sections-modules');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'package.json'),'{}');
for(const name of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import'])fs.writeFileSync(path.join(out,name+'.js'),ts.transpileModule(fs.readFileSync(path.join(root,'lib/'+name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const importer=require(path.join(out,'pdf-import.js'));
const pdfReq=createRequire(require.resolve('pdfjs-dist/package.json')),canvasLib=pdfReq('@napi-rs/canvas');global.DOMMatrix=canvasLib.DOMMatrix;global.Path2D=canvasLib.Path2D;global.ImageData=canvasLib.ImageData;
const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs');
// tesseract.js yüklenirken global document görürse tarayıcı sanır; Node sürümünü almak için document tanımlanmadan yüklenir.
delete global.window;delete global.document;const Tesseract=require('tesseract.js');
const {courses,answerKey}=await import('../scripts/fixtures/scanned-sections.mjs');
async function convert(file){global.document={createElement:()=>canvasLib.createCanvas(1,1)};global.Image=canvasLib.Image;const doc=await pdf.getDocument({data:new Uint8Array(fs.readFileSync(file)),standardFontDataUrl:path.join(root,'node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')+'/'}).promise;let worker;
 try{return await importer.convertPDF(doc,{onDiagnostics:process.env.SCANNED_SECTIONS_DUMP?p=>(global.__diag||=[]).push({page:p.page,lines:(p.lines||[]).map(l=>[+l.x.toFixed(3),+l.y.toFixed(3),+l.w.toFixed(3),l.text])}):undefined,mode:'local',engine:pdf,cancelled:()=>false,progress:()=>{},ai:()=>{throw Error('AI çalışmamalı');},ocr:async()=>{if(!worker){worker=await Tesseract.createWorker('tur+eng',1,{langPath:path.join(root,'public/vendor/ocr'),cacheMethod:'none'});await worker.setParameters({tessedit_pageseg_mode:'11',preserve_interword_spaces:'1',user_defined_dpi:'144'});}return {setParameters:s=>worker.setParameters(s),recognize:c=>worker.recognize(c.toBuffer('image/png'),{},{text:true,blocks:true})};}});}
 finally{if(worker)await worker.terminate();await doc.destroy();}}
const result=await convert(path.join(root,'tests/fixtures/scanned-sections.pdf'));
if(process.env.SCANNED_SECTIONS_DUMP)fs.writeFileSync(process.env.SCANNED_SECTIONS_DUMP,JSON.stringify({expectedCount:result.expectedCount,booklet:result.booklet,sections:result.sections,pdfAnswerKey:result.pdfAnswerKey,warnings:result.warnings,excluded:result.excludedBlocks?.map(b=>({page:b.page,reason:b.reason,text:b.text})),diag:global.__diag,questions:result.questions.map(q=>({number:q.number,sectionId:q.sectionId,text:q.text,options:q.options,page:q.page,warnings:q.warnings}))},null,1));
const truth=courses.flatMap(([,qs])=>qs),total=truth.length;
// OCR Türkçe harfleri ve büyük/küçük harfi değişken okur (Ağ→Ag, İndeksleme→indeksleme); karşılaştırma yalnız harf/rakam iskeleti üzerinden.
const norm=s=>s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');
// Bilinen açıklar (docs/YOL-HARITASI.md, madde 25): kapak tablosundaki tek haneli sayfa numaraları OCR'da okunmadığından bölüm çıkmıyor;
// sütun sonunda numarası okunmayan 5–6 kayboluyor.
// Bu testler yanlış davranışı sabitlemez: okunanın doğru olduğunu ve kaybın uyarıyla bildirildiğini sınar. Açıklar kapandıkça sıkılaştırın.

test('Taranmış sentetik sınav: OCR ile okunur; kapaktan beklenen sayı ve kitapçık, AI olmadan',()=>{
 assert.ok(!result.warnings.some(w=>/OCR başarısız/.test(w)),result.warnings.join('\n'));
 assert.equal(result.expectedCount,total);
 assert.equal(result.booklet,'B');
});

test('Sorular: numaralar benzersiz ve aralıkta; eksik numara sessiz kalmaz',()=>{
 const numbers=result.questions.map(q=>q.number);
 assert.ok(numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=total),String(numbers));
 assert.equal(new Set(numbers).size,numbers.length);
 assert.ok(numbers.length>=20,'en az 20 soru beklenir: '+numbers);
 const missing=truth.map((_,i)=>i+1).filter(n=>!numbers.includes(n));
 if(missing.length){assert.match(result.warnings.join(' '),new RegExp(`Belgede ${total} soru yazıyor`));assert.match(result.warnings.join(' '),new RegExp('eksik soru numaraları: '+missing.join(', ')));}
});

test('Sessiz yanlış eşleşme yok: dört şıkkı dolu her soru kendi şıklarını taşır (2×2 ızgara); eksik şıklı soru uyarılıdır',()=>{
 let full=0;
 for(const q of result.questions){const expected=truth[q.number-1][1];
  if(q.options.length===4&&q.options.every(Boolean)){full++;assert.deepEqual(q.options.map(norm),expected.map(norm),'Soru '+q.number);}
  else assert.ok(q.warnings?.length,'Soru '+q.number+' eksik şıklı ama uyarısız');}
 assert.ok(full>=18,'en az 18 soru dört şıkla okunmalı: '+full);
});

test('OCR\'ın okumadığı numaralar komşu numaralardan çıkarılır ve uyarı taşır',()=>{
 const inferred=result.questions.filter(q=>(q.warnings||[]).some(w=>/numara sıradan çıkarıldı/.test(w)));
 assert.ok(inferred.length>=1,'en az bir çıkarım beklenir');
 for(const q of inferred)assert.deepEqual(q.options.filter(Boolean).map(norm),truth[q.number-1][1].map(norm).filter((_,i)=>q.options[i]),'Soru '+q.number);
});

test('PDF cevap anahtarı: son sayfadan okunur, okunan her cevap doğrudur ve otomatik uygulanmaz',()=>{
 const key=result.pdfAnswerKey;assert.ok(key,'anahtar sayfası bulunmalı');assert.equal(key.page,6);
 const entries=Object.entries(key.keys);assert.equal(entries.length,answerKey.length,'anahtarın tamamı okunmalı: '+entries.length);
 for(const [n,v] of entries)assert.equal('ABCDE'[v],answerKey[Number(n)-1],'Cevap '+n);
 assert.ok(result.questions.every(q=>q.correct===null),'anahtar öğretmen onayı olmadan uygulanmamalı');
});
