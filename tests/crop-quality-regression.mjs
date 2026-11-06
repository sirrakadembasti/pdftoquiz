import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {test} from 'node:test';
import {acceptanceTest} from './test-tier.mjs';import assert from 'node:assert/strict';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),require=createRequire(path.join(root,'package.json')),ts=require('typescript');
const out=path.join(root,'.test-tmp/qa/crop-quality-modules');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'package.json'),'{}');
for(const name of ['conversion-diagnostics','question-quality','ai','hybrid','answer-key','quiz','pdf-layout','pdf-import'])fs.writeFileSync(path.join(out,name+'.js'),ts.transpileModule(fs.readFileSync(path.join(root,'lib/'+name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const layout=require(path.join(out,'pdf-layout.js')),quiz=require(path.join(out,'quiz.js')),importer=require(path.join(out,'pdf-import.js'));
const pdfReq=createRequire(require.resolve('pdfjs-dist/package.json')),canvasLib=pdfReq('@napi-rs/canvas');global.DOMMatrix=canvasLib.DOMMatrix;global.Path2D=canvasLib.Path2D;global.ImageData=canvasLib.ImageData;
const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs');global.document={createElement:()=>canvasLib.createCanvas(1,1)};


const line=(text,y,x=.05,w=.3,h=.012)=>({text,x,y,w,h});
const choices=y=>['A) One','B) Two','C) Three','D) Four'].map((s,i)=>line(s,y+i*.025));
test('Crop padding respects repeated header/footer bounds, not the contents of the question',()=>{
 const header=line('A',.0426,.85,.025,.0261),footer=line('Diğer sayfaya geçiniz.',.9,.5,.4,.012),lines=[header,line('1. Test?',.074),...choices(.2),footer],repeated=new Set([layout.repeatKey('A')]);
 const r=layout.analyzePage(lines,1,repeated).regions[0];assert.ok(r.stem.y>=header.y+header.h);assert.ok(r.whole.y+r.whole.h<footer.y);assert.ok(r.options.every(b=>b.y+b.h<footer.y));
 const inside=line('A',.12,.2,.03,.02);assert.equal(layout.questionCropLimits([...lines,inside],repeated,.025,.975,.074).top,layout.questionCropLimits(lines,repeated,.025,.975,.074).top);
 const early=layout.analyzePage([line('1. Early question?',.04),...choices(.1)],1).regions[0];assert.ok(early.stem.y<=.04,'No blanket top cutoff on a page without a header');
});
test('Actual raster capture removes the header ink and retains the complete diagram',async()=>{
 const lines=[line('A',.0426,.85,.025,.0261),line('1. Diagram?',.074),...choices(.4)],region=layout.analyzePage(lines,1,new Set([layout.repeatKey('A')])).regions[0];
 const canvas=canvasLib.createCanvas(800,1000),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,800,1000);ctx.fillStyle='#000';ctx.fillRect(680,43,20,25);ctx.fillStyle='#0070ff';ctx.fillRect(80,100,80,120);
 const image=await canvasLib.loadImage(Buffer.from(importer.capture(canvas,region.stem).split(',')[1],'base64')),probe=canvasLib.createCanvas(image.width,image.height);probe.getContext('2d').drawImage(image,0,0);const pixels=probe.getContext('2d').getImageData(0,0,image.width,image.height).data;let black=0,blue=0;for(let i=0;i<pixels.length;i+=4){if(Math.max(pixels[i],pixels[i+1],pixels[i+2])<30)black++;if(pixels[i]<20&&pixels[i+1]>90&&pixels[i+1]<140&&pixels[i+2]>240)blue++;}assert.equal(black,0);assert.equal(blue,80*120);
});
test('PDF Form XObject matrices restore image coordinates after nested groups',async()=>{
 const ops=pdf.OPS,page={getViewport:()=>({width:100,height:100,transform:[1,0,0,1,0,0]}),getOperatorList:async()=>({fnArray:[ops.paintFormXObjectBegin,ops.save,ops.transform,ops.paintImageXObject,ops.restore,ops.paintFormXObjectEnd,ops.transform,ops.paintImageXObject,ops.save,ops.transform,ops.paintImageXObject,ops.restore],argsArray:[[[2,0,0,2,0,0]],[],[10,0,0,10,5,5],['nested'],[],[],[10,0,0,10,30,30],['outside'],[],[100,0,0,100,-10,-10],['off-page-tile'],[]]})};
 const boxes=await importer.graphicImageBoxes(page,pdf);assert.deepEqual(boxes,[{x:.1,y:.1,w:.19999999999999998,h:.19999999999999998},{x:.3,y:.3,w:.10000000000000003,h:.10000000000000003}]);
});
test('Only a genuine page continuation gets a continuation warning',async()=>{
 const r=await convert(path.join(root,'tests/fixtures/parse-split.pdf')),continued=r.questions.find(q=>q.sourcePages?.length>1);assert.ok(continued);assert.ok(continued.warnings.some(w=>/sayfalardaki parçalar birleştirildi/.test(w)));assert.ok(r.questions.every(q=>!q.warnings.some(w=>/Metin sayfa sonuna yakın/.test(w))));assert.ok(quiz.protectedImages(continued).image);
});
async function convert(file){global.Image=canvasLib.Image;const doc=await pdf.getDocument({data:new Uint8Array(fs.readFileSync(file)),standardFontDataUrl:path.join(root,'node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')+'/'}).promise;try{return await importer.convertPDF(doc,{mode:'local',engine:pdf,cancelled:()=>false,progress:()=>{},ai:()=>{throw Error('AI must not run');},ocr:()=>{throw Error('Digital reference must not use OCR');}});}finally{await doc.destroy();}}


acceptanceTest('Gerçek şekil/kırpma kabul PDF belgesi: header/footer out, figures/code intact, all five false warnings gone',['TAPU_REFERENCE_PDF'],{},async()=>{
 const regions=[];const original=layout.analyzePage;layout.analyzePage=(...args)=>{const a=original(...args);regions.push(...a.regions.map(r=>({...r,page:args[1]})));return a;};let r;try{r=await convert(process.env.TAPU_REFERENCE_PDF);}finally{layout.analyzePage=original;}
 assert.equal(r.questions.length,50);assert.equal(r.expectedCount,50);assert.equal(r.duration,70);assert.ok(r.questions.every(q=>q.detectedOptions===4&&q.correct===null&&q.sourcePages.length===1));assert.ok(r.questions.every(q=>!q.warnings.some(w=>/Metin sayfa sonuna yakın|sayfalardaki parçalar birleştirildi/.test(w))));
 for(const n of [6,11,21,39,50])assert.ok(!r.questions.find(q=>q.number===n).warnings.some(w=>/devam/.test(w)));
 const q16=regions.find(a=>a.question.number===16);assert.ok(q16.stem.y*841.92>=57.84);assert.ok(q16.stem.y*841.92<62.64);
 const features={12:{left:42,right:200,top:78,bottom:171},16:{left:320,right:548,top:74,bottom:288},23:{left:312,right:587.76,top:185,bottom:609},30:{left:43,right:200,top:80,bottom:176}};
 for(const [raw,b] of Object.entries(features)){const n=Number(raw),region=regions.find(a=>a.question.number===n),stem=region.stem,q=r.questions.find(q=>q.number===n);assert.ok(stem.x*595.32<=b.left&& (stem.x+stem.w)*595.32>=b.right,`Q${n} diagram horizontal bounds`);assert.ok(stem.y*841.92<=b.top&&(stem.y+stem.h)*841.92>=b.bottom,`Q${n} diagram vertical bounds`);const safe=quiz.protectedImages(q);assert.ok(safe.image&&safe.options.every(Boolean));for(const s of [safe.image,...safe.options]){const decoded=await canvasLib.loadImage(Buffer.from(s.split(',')[1],'base64'));assert.ok(decoded.width>10&&decoded.height>10);}}
 for(const region of regions){assert.ok((region.stem.y+region.stem.h)*841.92<795.096);assert.ok(region.optionCells.every(b=>!b||(b.y+b.h)*841.92<795.096));}
 const checkDoc=await pdf.getDocument({data:new Uint8Array(fs.readFileSync(process.env.TAPU_REFERENCE_PDF)),standardFontDataUrl:path.join(root,'node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')+'/'}).promise;try{for(const n of [3,4,6]){const p=await checkDoc.getPage(n),images=await importer.graphicImageBoxes(p,pdf);for(const img of images){const owner=regions.find(a=>a.page===n&&img.x+img.w/2>=a.stem.x&&img.x+img.w/2<=a.stem.x+a.stem.w&&img.y+img.h/2>=a.stem.y&&img.y+img.h/2<=a.stem.y+a.stem.h);assert.ok(owner,'Embedded image has a question owner');assert.ok(owner.stem.x<=img.x&&owner.stem.x+owner.stem.w>=img.x+img.w&&owner.stem.y<=img.y&&owner.stem.y+owner.stem.h>=img.y+img.h,'Actual PDF image operator rectangle is wholly within the crop');}}}finally{await checkDoc.destroy();}
 fs.writeFileSync(path.join(out,'crop-quality-result.json'),JSON.stringify(r));fs.writeFileSync(path.join(out,'crop-quality-bounds.json'),JSON.stringify(regions.map(a=>({page:a.page,number:a.question.number,stem:a.stem,options:a.options,optionCells:a.optionCells,whole:a.whole})),null,2));
});
