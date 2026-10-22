import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {test} from 'node:test';
import {acceptanceTest} from './test-tier.mjs';import assert from 'node:assert/strict';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),require=createRequire(path.join(root,'package.json')),ts=require('typescript');
const out=path.join(root,'.sites-runtime/qa/text-modules');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'package.json'),'{}');
for(const name of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import'])fs.writeFileSync(path.join(out,name+'.js'),ts.transpileModule(fs.readFileSync(path.join(root,'lib/'+name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const layout=require(path.join(out,'pdf-layout.js')),quiz=require(path.join(out,'quiz.js')),importer=require(path.join(out,'pdf-import.js'));
const pdfReq=createRequire(require.resolve('pdfjs-dist/package.json')),canvasLib=pdfReq('@napi-rs/canvas');global.DOMMatrix=canvasLib.DOMMatrix;global.Path2D=canvasLib.Path2D;global.ImageData=canvasLib.ImageData;
const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs');global.document={createElement:()=>canvasLib.createCanvas(1,1)};

const line=(text,y,x=.05)=>({text,x,y,w:.4,h:.012});
test('Glyph joining uses PDF widths, font spacing and size; real spaces survive',()=>{
 const vp={width:600,height:800,scale:1,transform:[1,0,0,-1,0,800]};
 const item=(str,x,width,size=10,fontName='f')=>({str,width,transform:[size,0,0,size,x,700],fontName});
 const r=layout.textLines([item('5',10,5),item('0',15.02,5),item('adet',23,18),item('soru',44,20)],vp,pdf.Util,{spaces:{f:.28}});assert.equal(r[0].text,'50 adet soru');
 assert.equal(layout.textLines([item('T',10,5),item('olower',15.02,25)],vp,pdf.Util)[0].text,'Tolower');
 const left={...line('a',.1),x:0,endX:.01,fontSize:.02,spaceWidth:.004};const right={...line('b',.1),x:.012,fontSize:.02,spaceWidth:.004};assert.equal(layout.pdfItemSeparator(left,right),' ');assert.equal(layout.pdfItemSeparator({...left,spaceWidth:.012},{...right,spaceWidth:.012}),'');
 assert.equal(layout.pdfItemSeparator({...left,text:'a '},right),'');
});
test('Font space glyph widths are read from PDF.js operators with a safe fallback',async()=>{
 const ops={setFont:1,showText:2},page={getOperatorList:async()=>({fnArray:[1,2],argsArray:[['f',9],[[{unicode:' ',width:226},{unicode:'a',width:500}]]]}),getTextContent:async()=>({styles:{f:{}}}),commonObjs:{get:()=>({name:'Calibri'})}};
 const hints=await layout.pdfStyleHints(page,{width:600,height:800},pdf.Util,ops);assert.equal(hints.spaces.f,.226);
});
test('Joining fragments adjusts bold offsets and does not invent code escapes',()=>{
 const vp={width:600,height:800,scale:1,transform:[1,0,0,-1,0,800]},item=(str,x,width,fontName)=>({str,width,transform:[9,0,0,9,x,700],fontName});
 const joined=layout.textLines([item('bıra',10,18,'normal'),item('karak',28.26,23,'bold')],vp,pdf.Util,{fonts:{bold:true}})[0];assert.equal(joined.text,'bırakarak');assert.deepEqual(joined.marks,[{start:4,end:9,bold:true,underline:false}]);
 assert.equal(layout.textLines([item('\\',10,2.5,'normal'),item('n',12.518,5,'normal')],vp,pdf.Util)[0].text,'\\n');
});
test('Spaced and parenthesized inline labels preserve symbols and short choices',()=>{
 for(const template of ['A ) :: B ) implements C ) interface D ) extends','(A) :: (B) implements (C) interface (D) extends','A . :: B . implements C . interface D . extends']){const q=layout.analyzePage([line('1. Test?',.1),line(template,.15)],1,new Set(),true).regions[0].question;assert.deepEqual(q.options,['::','implements','interface','extends']);assert.equal(q.detectedOptions,4);}
 for(const source of ['A) Add B) Insert C) Set D) In','A) 5 B) 6 C) 7 D) 8'])assert.equal(layout.analyzePage([line('1. Test?',.1),line(source,.15)],1).regions[0].question.detectedOptions,4);
 assert.deepEqual(quiz.parsePages([{page:1,text:'1. Test?\nA ) 5 B ) 6 C ) 7 D ) 8'}])[0].options,['5','6','7','8']);
});
test('Code keeps geometric indentation/newlines while ordinary answer continuations wrap',()=>{
 const code=layout.composeTextLines([line('If A Then',.1),line('Do E',.12,.07),line('Else',.14),line('Do B',.16,.07)]);assert.match(code.text,/If A Then\n +Do E\nElse\n +Do B/);assert.ok(quiz.validTextMarks(code.text,code.marks));
 assert.equal(layout.composeTextLines([line('Uzun bir cevap',.1),line('ikinci satırda devam eder.',.116)]).text,'Uzun bir cevap ikinci satırda devam eder.');
});
test('Duplicate answer warning is exact, nonempty, dynamic and never assigns a key',()=>{
 assert.equal(quiz.duplicateOptionWarnings(['',' ','::',':']).length,0);assert.equal(quiz.duplicateOptionWarnings(['Ab','ab']).length,0);
 const q={id:'q',text:'Test?',options:['x','12.00, 6.00','12.00, 6.00','y'],correct:null,page:1,reviewed:true};const s=quiz.solutionSummary({questions:[q]});assert.match(s.suspicious[0].problems[0],/Aynı metinli şıklar: B, C/);assert.equal(q.correct,null);q.warnings=quiz.duplicateOptionWarnings(q.options);q.reviewed=false;q.options[2]='different';assert.equal(quiz.solutionSummary({questions:[q]}).suspicious.length,0);
});
async function convert(file){global.Image=canvasLib.Image;const doc=await pdf.getDocument({data:new Uint8Array(fs.readFileSync(file)),standardFontDataUrl:path.join(root,'node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')+'/'}).promise;try{return await importer.convertPDF(doc,{mode:'local',engine:pdf,cancelled:()=>false,progress:()=>{},ai:()=>{throw Error('AI must not run');},ocr:()=>{throw Error('Digital reference must not use OCR');}});}finally{await doc.destroy();}}

acceptanceTest('Gerçek kod/metin kabul PDF belgesi: clean spaces, four options, code structure and B/C duplicate warning',['TAPU_REFERENCE_PDF'],{},async()=>{
 const r=await convert(process.env.TAPU_REFERENCE_PDF),q=n=>r.questions.find(q=>q.number===n);
 assert.equal(r.questions.length,50);assert.equal(r.duration,70);assert.equal(r.expectedCount,50);assert.ok(r.questions.every(q=>q.detectedOptions===4));assert.match(r.instructions,/50 adet soru/);assert.match(r.instructions,/70 dakikadır/);assert.ok(!/N o|5 0|7 0/.test(r.instructions));
 assert.match(q(2).text,/bırakarak/);assert.match(q(25).text,/Web-posta/);assert.match(q(35).text,/Tolower/);assert.deepEqual(q(39).options,['\\t','\\n','\\\\','\\0']);
 assert.deepEqual(q(17).options,['::','implements','interface','extends']);assert.ok(!q(7).warnings.some(w=>/Tekrarlanan şık/.test(w)));assert.ok(q(16).options.every(o=>/\n +Do/.test(o)));assert.ok(q(38).options.every(o=>o.split('\n').length===4));assert.match(q(38).text,/printf\("RED = %d\\n"/);
 assert.equal(q(23).options[1],q(23).options[2]);assert.match(q(23).warnings.join(' '),/Aynı metinli şıklar: B, C/);assert.ok(r.questions.every(q=>q.correct===null));
 for(const question of r.questions){assert.ok(quiz.validTextMarks(question.text,question.textMarks));question.options.forEach((o,i)=>assert.ok(quiz.validTextMarks(o,question.optionMarks[i])));assert.ok(quiz.protectedImages(question).options.every(Boolean));}
 fs.writeFileSync(path.join(out,'text-result.json'),JSON.stringify(r));
});
