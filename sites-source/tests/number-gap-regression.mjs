import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import {createRequire} from 'node:module';import {test} from 'node:test';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('..',import.meta.url)),req=createRequire(root+'/package.json'),ts=req('typescript'),out=root+'/.sites-runtime/qa/gap-modules';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/package.json','{}');for(const n of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import'])fs.writeFileSync(out+'/'+n+'.js',ts.transpileModule(fs.readFileSync(root+'/lib/'+n+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {recoverNumberGaps,rasterInkStats}=req(out+'/pdf-import.js'),quiz=req(out+'/quiz.js'),pr=createRequire(req.resolve('pdfjs-dist/package.json')),C=pr('@napi-rs/canvas');
const line=(text,y,x=.16)=>({text,y,x,w:.30,h:.012,ocrGeometry:{split:null,glyphWidth:.016}});
function page(){return [line('1. First?',.10),...['A) one','B) two','C) three','D) four'].map((t,i)=>line(t,.14+i*.025,.20)),line('Unnumbered question body',.35),line('A) middle one',.39,.20),line('C) middle two',.42,.20),line('D) middle three',.45,.20),line('E) middle four',.48,.20),line('3. Third?',.60),...['A) last one','B) last two','C) last three','D) last four'].map((t,i)=>line(t,.64+i*.025,.20))];}
test('Only expected, confident, aligned numbers with same-line lettered text fill a bounded gap',async()=>{
 global.document={createElement:()=>C.createCanvas(1,1)};
 for(const mode of ['valid','wrong','off-edge','numeric-only','low-confidence','code']){
  const pages=[page()],before=pages[0].filter(l=>quiz.questionPattern.test(l.text)).map(l=>l.text);let calls=0;
  const doc={getPage:async()=>({getViewport:()=>({width:1000,height:1400}),render:({canvasContext})=>({promise:Promise.resolve().then(()=>{canvasContext.fillStyle='white';canvasContext.fillRect(0,0,1000,1400);})}),cleanup(){}})};
  const result=await recoverNumberGaps(doc,pages,{cancelled:()=>false,progress(){},ocr:async()=>({recognize:async()=>{calls++;const x=mode==='off-edge'?120:19.2;const token={text:mode==='wrong'?'22':'2',confidence:mode==='low-confidence'?50:95,bbox:{x0:x,x1:x+12,y0:122,y1:139}},body={text:mode==='numeric-only'?'55':'Stem',bbox:{x0:x+18,x1:x+45,y0:122,y1:139}};return {data:{text:'2 Stem',lines:[{text:mode==='code'?'2 printf(x);':'2 Stem',words:[token,body]}]}};}})},6);
  assert.equal(calls,1);assert.deepEqual(result.recovered,mode==='valid'?[2]:[]);assert.deepEqual(pages[0].filter(l=>quiz.questionPattern.test(l.text)&&!l.text.startsWith('Soru 2.')).map(l=>l.text),before);
 }
});
test('Digital pages and exhausted budgets never load OCR',async()=>{let calls=0;const opts={cancelled:()=>false,progress(){},ocr:async()=>{calls++;throw Error('must not load');}};await recoverNumberGaps({},[page().map(({ocrGeometry,...l})=>l)],opts,6);await recoverNumberGaps({},[page()],opts,0);assert.equal(calls,0);});
test('Sparse pale dust is blank; text components and a substantial graphic remain nonblank',()=>{
 const w=600,h=800,p=new Uint8ClampedArray(w*h*4);p.fill(255);for(let i=0;i<20;i++){const j=(i*1879)% (w*h);p[j*4]=p[j*4+1]=p[j*4+2]=235;}assert.equal(rasterInkStats(p,w,h).blank,true);
 for(let glyph=0;glyph<12;glyph++)for(let y=0;y<4;y++)for(let x=0;x<3;x++){const n=((100+y)*w+50+glyph*8+x)*4;p[n]=p[n+1]=p[n+2]=0;}assert.equal(rasterInkStats(p,w,h).blank,false);
 const graphic=new Uint8ClampedArray(w*h*4);graphic.fill(255);for(let y=100;y<160;y++)for(let x=100;x<160;x++){const n=(y*w+x)*4;graphic[n]=graphic[n+1]=graphic[n+2]=0;}assert.equal(rasterInkStats(graphic,w,h).blank,false);
});
test('Headerless two-entry PDF rows propose all 50 answers without changing correct answers',()=>{
 const text=Array.from({length:25},(_,i)=>`Soru - ${i+1} E  Soru - ${i+26} B`).join('\n'),p=quiz.pdfTableKey(text);assert.equal(Object.keys(p.keys).length,50);assert.equal(p.keys[1],4);assert.equal(p.keys[26],1);assert.equal(Object.keys(quiz.pdfTableKey('Soru - 1 E ordinary question body').keys).length,0);
 const exam={questions:Array.from({length:50},(_,i)=>({id:String(i),number:i+1,options:['a','b','c','d','e'],correct:null})),title:'test',subject:'',duration:60};const preview=quiz.bulkKeyPreview(exam,Object.entries(p.keys).map(([n,k])=>n+'-'+String.fromCharCode(65+k)).join('\n'));assert.equal(preview.rows.length,50);assert.equal(preview.matched,50);assert.equal(preview.canApply,true);assert.ok(exam.questions.every(q=>q.correct===null));const applied=quiz.applyBulkKey(exam,preview);assert.equal(applied.questions[0].correct,4);assert.ok(exam.questions.every(q=>q.correct===null));
});
