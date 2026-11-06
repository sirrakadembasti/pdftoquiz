import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {test} from 'node:test';
import {acceptanceTest} from './test-tier.mjs';import assert from 'node:assert/strict';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),require=createRequire(path.join(root,'package.json')),ts=require('typescript');
const out=path.join(root,'.test-tmp/qa/layout-modules');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'package.json'),'{}');
for(const name of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import'])fs.writeFileSync(path.join(out,name+'.js'),ts.transpileModule(fs.readFileSync(path.join(root,'lib/'+name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const layout=require(path.join(out,'pdf-layout.js')),quiz=require(path.join(out,'quiz.js')),importer=require(path.join(out,'pdf-import.js'));
const pdfReq=createRequire(require.resolve('pdfjs-dist/package.json')),canvasLib=pdfReq('@napi-rs/canvas');global.DOMMatrix=canvasLib.DOMMatrix;global.Path2D=canvasLib.Path2D;global.ImageData=canvasLib.ImageData;
const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs');global.document={createElement:()=>canvasLib.createCanvas(1,1)};
const line=(text,y,x=.1,h=.012)=>({text,x,y,w:.3,h});
test('Liste, paragraf, noktalama, bölünmüş sözcük ve matematik işaretleri',()=>{
 const r=layout.composeTextLines([line('• İlk anlam',.1),line('madde devamı',.116,.12),line('• İkinci anlam',.15),{...line('Aşağıdakilerden hangisi kulla -',.19),marks:[{start:0,end:29,bold:true}]},line('nılmamıştır ?',.206)]);
 assert.match(r.text,/• İlk anlam madde devamı\n• İkinci anlam\n\nAşağıdakilerden hangisi kullanılmamıştır\?/);
 assert.ok(r.marks.length);assert.equal(quiz.validTextMarks(r.text,r.marks),true);
 assert.equal(layout.composeTextLines([line('x -',.1),line('y = 3 − 2',.116)]).text,'x - y = 3 − 2');
 assert.equal(layout.composeTextLines([line('Türk-',.1),line('İslam',.116)]).text,'Türk- İslam');
});
test('Kısa aralıklı 2×2 şıklarda satır yüksekliği ve komşu hücreler korunur',()=>{
 const lines=[line('1. Soru?',.1,.05),{...line('A) Bir',.2,.1),w:.08},{...line('B) İki',.2,.32),w:.08},{...line('C) Üç',.2167,.1),w:.08},{...line('D) Dört',.2167,.32),w:.08}];
 const r=layout.analyzePage(lines,1).regions[0];assert.deepEqual(r.question.options,['Bir','İki','Üç','Dört']);
 for(let i=0;i<4;i++){const b=r.options[i],l=lines[i+1];assert.ok(b.y<=l.y);assert.ok(b.y+b.h>=l.y+l.h);if(i<2)assert.ok(b.y+b.h<=lines[3].y);if(i%2===0)assert.ok(b.x+b.w<lines[2].x);}
 assert.ok(r.options[2].y>=lines[1].y+lines[1].h);
});
test('Biçim bilgisi güvenli ve geriye uyumlu; öğrenciye aktarılır',()=>{
 assert.equal(quiz.validTextMarks('abc',undefined),true);assert.equal(quiz.validTextMarks('abc',[{start:0,end:2,bold:true}]),true);assert.equal(quiz.validTextMarks('abc',[{start:0,end:9}]),false);assert.equal(quiz.validTextMarks('abc',[{start:0,end:2},{start:1,end:3}]),false);
 const q={id:'x',text:'abc',textMarks:[{start:0,end:2,bold:true}],options:['x','y'],correct:0,page:1,reviewed:true};const e={title:'Test',subject:'Ders',duration:10,questions:[q]};quiz.validateExam(e);assert.deepEqual(quiz.studentExam(e).questions[0].textMarks,q.textMarks);assert.equal(quiz.studentExam(e).questions[0].correct,undefined);
});
async function inspect(file){const doc=await pdf.getDocument({data:new Uint8Array(fs.readFileSync(file)),standardFontDataUrl:path.join(root,'node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')+'/'}).promise;try{return await importer.convertPDF(doc,{mode:'local',engine:pdf,cancelled:()=>false,progress:()=>{},ai:()=>{throw new Error('AI kullanılmamalı');},ocr:()=>{throw new Error('OCR kullanılmamalı');}});}finally{await doc.destroy();}}
test('Özgün sentetik PDF: maddeler, kalın/alt çizgi, çok satırlı ve şekilli şıklar',async()=>{
 const r=await inspect(path.join(root,'tests/fixtures/layout-quality.pdf'));assert.equal(r.questions.length,2);const q=r.questions[0];assert.match(q.text,/• Birinci açıklama satırı aynı maddeye devam eder\.\n• İkinci açıklama\n\nAşağıdaki anlamlardan hangisi kullanılmamıştır\?/);assert.ok(q.textMarks.some(m=>m.bold));assert.ok(q.textMarks.some(m=>m.underline));assert.match(q.options[0],/Birinci uzun cevap ikinci satırı da içerir/);assert.match(q.options[1],/Sağdaki cevap sağdaki devam satırı/);assert.ok(!q.options[0].includes('Sağdaki'));assert.ok(r.questions.every(q=>q.optionImages.every(Boolean)));
 const mixed=await canvasLib.loadImage(Buffer.from(r.questions[1].optionImages[0].split(',')[1],'base64'));assert.ok(mixed.height>180,'Metinle birlikte şeklin tam yüksekliği korunmalı');
 for(const [i,q] of r.questions.entries())for(const [j,img] of q.optionImages.entries())fs.writeFileSync(path.join(root,'.test-tmp/qa/layout-synthetic-'+i+'-'+j+'.png'),Buffer.from(img.split(',')[1],'base64'));
});
acceptanceTest('Referans PDF: sözcük ve 2×2 şık kırpmaları',['REFERENCE_PDF'],{},async()=>{
 const r=await inspect(process.env.REFERENCE_PDF);assert.equal(r.questions.length,80);assert.ok(r.questions.every(q=>q.options.length===4));const q=r.questions[0];assert.deepEqual(q.options,['Aylin','Cenk','Kadir','Meltem']);assert.match(q.text,/cümle kurmalarını/);assert.match(q.text,/uygun değildir\?/);const paragraphs=r.questions.find(q=>q.text.includes('Yoğurt'));assert.match(paragraphs.text,/tüketilmektedir/);assert.match(paragraphs.text,/sütün mayalandırılması/);assert.ok(paragraphs.text.includes('\n\nBu metinde'));
 for(const [j,img] of q.optionImages.entries())fs.writeFileSync(path.join(root,'.test-tmp/qa/layout-reference-option-'+j+'.png'),Buffer.from(img.split(',')[1],'base64'));
 fs.writeFileSync(path.join(root,'.test-tmp/qa/layout-reference-text.json'),JSON.stringify(r.questions.map(q=>({number:q.number,section:q.sectionId,text:q.text,marks:q.textMarks,options:q.options})),null,2));
});
