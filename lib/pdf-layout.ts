import {applyAnswerKey,expectedCount,extractAnswerKey,isBoilerplate,isAnswerBoundary,isWatermark,duplicateOptionWarnings,optionPattern,questionPattern,type Question,type Section,type ExcludedBlock,type TextMark} from './quiz';
export type Box={x:number;y:number;w:number;h:number};
export type OCRGeometry={split:number|null;glyphWidth:number;gutter?:[number,number]};
export type OCRToken=Box&{text:string;confidence?:number;symbols?: (Box&{text:string})[]};
export type Line=Box&{confidence?:number;ocrGeometry?:OCRGeometry;ocrTokens?:OCRToken[];text:string;marks?:TextMark[];monospace?:boolean;fontName?:string;fontSize?:number;spaceWidth?:number;endX?:number};
export type Region={question:Question;stem:Box;stemReliable?:boolean;options:(Box|null)[];optionCells?:(Box|null)[];optionContent?:(Box|null)[];whole:Box;lastContentY:number};
export function sliceTextLine(line:Line,start:number,end=line.text.length):Line{return {...line,text:line.text.slice(start,end),marks:line.marks?.map(m=>({...m,start:Math.max(start,m.start)-start,end:Math.min(end,m.end)-start})).filter(m=>m.end>m.start)};}
export function composeTextLines(lines:Line[]){
type Glyph={c:string;bold?:boolean;underline?:boolean;code?:boolean};const glyphs:Glyph[]=[];let previous:Line|undefined;
const codeLike=(l:Line)=>!!l.monospace||/^(?:#\s*include\b|(?:\d+\s*[:.]\s*)?(?:int|void|enum|printf|return|If|Else|Then|Do|Loop|End If|Select)\b|[{}]\s*$|[A-Z][A-Z_]+\s*=)|[;{}]\s*$/.test(l.text.trim());
const codeCandidates=lines.map((l,i)=>codeLike(l)?i:-1).filter(i=>i>=0),codeIndices=new Set<number>();
if(codeCandidates.length>=2)for(let i=codeCandidates[0];i<=codeCandidates.at(-1)!;i++)if(!/hangisi|aşağıdaki|yukarıdaki|which|what|\?/i.test(lines[i].text))codeIndices.add(i);
const codeLeft=Math.min(...lines.filter((_,i)=>codeIndices.has(i)&&lines[i].text.trim()).map(l=>l.x));
let previousCode=false;
for(let index=0;index<lines.length;index++){const source=lines[index],isCode=codeIndices.has(index);
const lead=source.text.length-source.text.trimStart().length;const l=sliceTextLine(source,lead,source.text.trimEnd().length);if(!l.text)continue;
if(previous){const gap=l.y-(previous.y+previous.h),bullet=/^[•●▪◦]\s*/.test(l.text),wasBullet=/^[•●▪◦]\s*/.test(previous.text);const paragraph=gap>Math.max(.006,previous.h*.55)||!!l.marks?.some(m=>m.bold)&&!previous.marks?.some(m=>m.bold);
const splitWord=/\p{Ll}{2,}\s*-\s*$/u.test(previous.text)&&/^\p{Ll}/u.test(l.text)&&l.y>previous.y&&gap<.02&&!/[=+×÷−]/.test(previous.text);
if(!isCode&&!previousCode&&splitWord){while(glyphs.length&&/[\s-]/.test(glyphs.at(-1)!.c))glyphs.pop();}else{const separator=isCode&&previousCode?'\n':isCode||previousCode?'\n\n':bullet?'\n':paragraph?'\n\n':wasBullet&&l.x<=previous.x+.005?'\n\n':' ';for(const c of separator)glyphs.push({c});}}
if(isCode){const unit=Math.max(.002,(source.spaceWidth||source.fontSize&&source.fontSize*.3||source.h*.25));const indent=Math.min(40,Math.max(0,Math.round((source.x-codeLeft)/unit)));for(let i=0;i<indent;i++)glyphs.push({c:' ',code:true});}
for(let i=0;i<l.text.length;i++){const active=l.marks?.filter(m=>i>=m.start&&i<m.end)||[];glyphs.push({c:l.text[i],bold:active.some(m=>m.bold),underline:active.some(m=>m.underline),code:isCode});}previous=l;previousCode=isCode;}
// Keep line breaks, mathematical signs and decimal separators intact.
for(let i=glyphs.length-1;i>0;i--)if(!glyphs[i].code&&/[,;:!?]/.test(glyphs[i].c))while(i>0&&/[ \t]/.test(glyphs[i-1].c)){glyphs.splice(i-1,1);i--;}
const text=glyphs.map(g=>g.c).join(''),marks:TextMark[]=[];for(let i=0;i<glyphs.length;i++){const g=glyphs[i];if(!g.bold&&!g.underline)continue;const last=marks.at(-1);if(last&&last.end===i&&!!last.bold===!!g.bold&&!!last.underline===!!g.underline)last.end=i+1;else marks.push({start:i,end:i+1,bold:!!g.bold,underline:!!g.underline});}return {text,marks};
}
export async function pdfStyleHints(page:any,viewport:any,util:any,ops:any){
const fonts:Record<string,boolean>={},monospace:Record<string,boolean>={},spaces:Record<string,number>={},underlines:Box[]=[];try{const list=await page.getOperatorList();const content=await page.getTextContent();for(const name of Object.keys(content.styles||{})){try{const font=page.commonObjs.get(name);fonts[name]=!!font.bold||/bold|black|demi/i.test(font.name||'');if(font.spaceWidth>0)spaces[name]=font.spaceWidth/1000;monospace[name]=!!font.isMonospace||/courier|consolas|mono|typewriter/i.test(font.name||'');}catch{}}
let activeFont='';for(let i=0;i<list.fnArray.length;i++){if(list.fnArray[i]===ops.setFont)activeFont=list.argsArray[i][0];if(list.fnArray[i]===ops.showText)for(const glyph of list.argsArray[i]?.[0]||[]){if(glyph?.unicode===' '&&glyph.width>0){const width=glyph.width/1000;if(width>=.15&&width<=.65)spaces[activeFont]=width;}}}
let matrix=[1,0,0,1,0,0];const stack:number[][]=[];for(let i=0;i<list.fnArray.length;i++){const op=list.fnArray[i],args=list.argsArray[i];if(op===ops.save)stack.push([...matrix]);else if(op===ops.restore)matrix=stack.pop()||[1,0,0,1,0,0];else if(op===ops.transform)matrix=util.transform(matrix,args);else if(op===ops.constructPath){const bounds=args?.[2];if(!bounds||bounds.length!==4)continue;const t=util.transform(viewport.transform,matrix);const point=(x:number,y:number)=>({x:t[0]*x+t[2]*y+t[4],y:t[1]*x+t[3]*y+t[5]});const a=point(bounds[0],bounds[1]),b=point(bounds[2],bounds[3]);const w=Math.abs(b.x-a.x)/viewport.width,h=Math.abs(b.y-a.y)/viewport.height;if(w>.015&&h<.0018)underlines.push({x:Math.min(a.x,b.x)/viewport.width,y:Math.min(a.y,b.y)/viewport.height,w,h});}}}catch{/* Style hints are optional; text extraction remains available. */}return {fonts,monospace,spaces,underlines};
}
const keyHeader=/^(?:cevap\s*anahtar[ıiİ]|yanıt\s*anahtar[ıiİ]|answer\s*key)/i;
// Normalize varying page counters only for repeated marginal text.
export function repeatKey(text:string){return text.normalize('NFKC').replace(/\d+/g,'#').replace(/[^\p{L}\p{N}#]+/gu,' ').trim().toLocaleLowerCase('tr');}
export function isMargin(l:Line){return l.y<.12||l.y>.82;}
export function repeatedLines(pages:Line[][]){const seen=new Map<string,Set<number>>();pages.forEach((lines,page)=>{for(const l of lines){if(!isMargin(l)||questionPattern.test(l.text)||optionPattern.test(l.text))continue;const key=repeatKey(l.text);if(!seen.has(key))seen.set(key,new Set());seen.get(key)!.add(page);}});return new Set([...seen].filter(([,pages])=>pages.size>=2).map(([key])=>key));}
function isRepeated(l:Line,repeated:Set<string>){return !questionPattern.test(l.text)&&!optionPattern.test(l.text)&&isMargin(l)&&(repeated.has(repeatKey(l.text))||repeated.has(l.text.trim()));}
export function layoutNoise(l:Line,repeated=new Set<string>()){return l.y<.055&&/^\d{1,2}\.\s*(?:SINIF)?$/i.test(l.text.trim())||isBoilerplate(l.text)||isWatermark(l.text)||isRepeated(l,repeated)||isMargin(l)&&/^[-–—]?\s*\d{1,3}\s*[.)]?\s*[-–—]?$/.test(l.text.trim())&&!(questionPattern.test(l.text)&&l.y>.045&&l.y<.9);}
// OCR geometry comes from word rectangles; digital PDF heuristics stay unchanged.
function median(values:number[]){const a=values.slice().sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:0;}
export function inferOCRGeometry(words:Line[],markers:Line[],aspect:number):OCRGeometry{
 const body=words.filter(w=>w.y>.055&&w.y<.91&&w.w>0&&w.h>0),glyphWidth=median(body.map(w=>w.h))*aspect;
 const result:OCRGeometry={split:null,glyphWidth};if(body.length<40||!glyphWidth)return result;
 // One title spanning the gutter is tolerated; a body text column is not.
 const bins=512,ink=new Float64Array(bins);for(const w of body)for(let i=Math.max(0,Math.floor(w.x*bins));i<Math.min(bins,Math.ceil((w.x+w.w)*bins));i++)ink[i]+=w.h*aspect;
 const gaps:[number,number][]=[];for(let i=Math.ceil(.35*bins);i<Math.floor(.65*bins);i++)if(ink[i]<=glyphWidth*1.5){let end=i+1;while(end<Math.floor(.65*bins)&&ink[end]<=glyphWidth*1.5)end++;gaps.push([i/bins,end/bins]);i=end-1;}
 for(const gutter of gaps.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))){if(gutter[1]-gutter[0]<Math.max(.012,glyphWidth*.8))continue;const split=(gutter[0]+gutter[1])/2;
  const sides=[body.filter(w=>w.x+w.w<=split),body.filter(w=>w.x>=split)],mass=sides.map(ws=>ws.reduce((n,w)=>n+w.w*w.h,0)),total=mass[0]+mass[1];
  if(sides.some(ws=>ws.length<20)||mass.some(m=>m/total<.15))continue;
  const numberSides=[markers.filter(w=>w.x<split&&questionPattern.test(w.text)),markers.filter(w=>w.x>=split&&questionPattern.test(w.text))],options=markers.filter(w=>/^[a-e]\s*[).]/i.test(w.text));
  if(!numberSides.every(ns=>ns.length>0)||options.length<4)continue;
  return {split,glyphWidth,gutter};
 }return result;
}
function columnSplit(lines:Line[]){const geometry=lines.find(l=>l.ocrGeometry)?.ocrGeometry;if(geometry?.split!==null&&geometry?.split!==undefined)return geometry.split;const starts=lines.filter(l=>l.y>.055&&l.y<.91&&questionPattern.test(l.text));const left=starts.filter(l=>l.x<.16),right=starts.filter(l=>l.x>.44&&l.x<.58);const topPair=left.some(l=>l.y<.2)&&right.some(l=>l.y<.2);const rawOption=/^\(?[a-e]\s*[).:\-]/i;const leftOptions=lines.filter(l=>l.x<.22&&rawOption.test(l.text)),rightOptions=lines.filter(l=>l.x>.5&&rawOption.test(l.text));const distributed=left.length>0&&right.length>0&&leftOptions.length>=2&&rightOptions.length>=2;return topPair||distributed?.5:null;}
export function pageReadingOrder(lines:Line[]){const split=columnSplit(lines),sort=(ls:Line[])=>ls.slice().sort((a,b)=>Math.abs(a.y-b.y)<.006?a.x-b.x:a.y-b.y);return split===null?sort(lines):[...sort(lines.filter(l=>l.x<split)),...sort(lines.filter(l=>l.x>=split))];}
// PDF widths, not the minimum display box width, decide whether glyph runs touch.
export function pdfItemSeparator(left:Line,right:Line){if(/\s$/.test(left.text)||/^\s/.test(right.text))return '';const em=Math.min(left.fontSize||left.h,right.fontSize||right.h),space=Math.min(left.spaceWidth||em*.28,right.spaceWidth||em*.28),threshold=Math.max(em*.08,Math.min(em*.18,space*.45));return right.x-(left.endX??left.x+left.w)>threshold?' ':'';}
export function textLines(items:any[],viewport:any,util:any,hints:{fonts?:Record<string,boolean>;monospace?:Record<string,boolean>;spaces?:Record<string,number>;underlines?:Box[]}={}):Line[]{const pieces:Line[]=items.filter(x=>typeof x.str==='string'&&x.str.trim()&&!(Math.abs(x.transform[1])>Math.abs(x.transform[0])&&isBoilerplate(x.str))).map(item=>{const t=util.transform(viewport.transform,item.transform);const height=Math.max(4,Math.hypot(t[2],t[3]));const box={x:t[4]/viewport.width,y:(t[5]-height)/viewport.height,w:Math.max(item.width*viewport.scale,4)/viewport.width,h:height/viewport.height};const bold=!!hints.fonts?.[item.fontName],underline=!!hints.underlines?.some(b=>Math.abs(b.y-(box.y+box.h))<box.h*.35&&Math.min(b.x+b.w,box.x+box.w)-Math.max(b.x,box.x)>box.w*.65&&b.w<box.w*1.35);return {text:item.str,...box,endX:(t[4]+item.width*viewport.scale)/viewport.width,fontName:item.fontName,fontSize:height/viewport.width,spaceWidth:(hints.spaces?.[item.fontName]||(hints.monospace?.[item.fontName]?.6:.28))*height/viewport.width,monospace:!!hints.monospace?.[item.fontName]||/monospace/i.test(item.fontFamily||''),marks:bold||underline?[{start:0,end:item.str.length,bold,underline}]:[]};});pieces.sort((a,b)=>a.y-b.y||a.x-b.x);const rows:Line[][]=[];for(const p of pieces){const row=rows.find(r=>Math.abs(r[0].y-p.y)<Math.max(.004,Math.min(r[0].h,p.h)*.45));if(row)row.push(p);else rows.push([p]);}const split=columnSplit(pieces);const lines:Line[]=[];for(const row of rows){row.sort((a,b)=>a.x-b.x);let line:Line|undefined;for(const p of row){if(!line||optionPattern.test(p.text)&&optionPattern.test(line.text)||p.x-(line.x+line.w)>.075||split!==null&&line.x<split&&p.x>=split){if(line)lines.push(line);line={...p};}else{const separator=pdfItemSeparator(line,p),offset=line.text.length+separator.length;line.marks=[...(line.marks||[]),...(p.marks||[]).map(m=>({...m,start:m.start+offset,end:m.end+offset}))];line.monospace=!!line.monospace||!!p.monospace;line.text+=separator+p.text;line.endX=p.endX;line.fontName=p.fontName;line.fontSize=p.fontSize;line.spaceWidth=p.spaceWidth;line.w=Math.max(line.x+line.w,p.x+p.w)-line.x;line.y=Math.min(line.y,p.y);line.h=Math.max(line.h,p.h);}}if(line)lines.push(line);}return lines.map(normalizeOptionPrefix);}
export function ocrLines(data:any,w:number,h:number):Line[]{const source=data.lines||data.blocks?.flatMap((b:any)=>b.paragraphs.flatMap((p:any)=>p.lines))||[];const markers:Line[]=source.map((l:any)=>({text:l.text?.trim()||'',x:l.bbox.x0/w,y:l.bbox.y0/h,w:(l.bbox.x1-l.bbox.x0)/w,h:(l.bbox.y1-l.bbox.y0)/h}));for(const line of source)for(const word of line.words||[]){const b=word.bbox;markers.push({text:word.text,x:b.x0/w,y:b.y0/h,w:(b.x1-b.x0)/w,h:(b.y1-b.y0)/h});}const wordsForGeometry=source.flatMap((l:any)=>(l.words||[]).map((word:any)=>{const b=word.bbox;return {text:word.text,x:b.x0/w,y:b.y0/h,w:(b.x1-b.x0)/w,h:(b.y1-b.y0)/h};}));const geometry=inferOCRGeometry(wordsForGeometry,markers,h/w);const split=geometry.split??columnSplit(markers);const lines:Line[]=[];for(const l of source){const words=l.words||[];if(words.length){let group:Line|undefined;for(const word of words){const b=word.bbox;const token:OCRToken={text:word.text,confidence:word.confidence,x:b.x0/w,y:b.y0/h,w:(b.x1-b.x0)/w,h:(b.y1-b.y0)/h,symbols:(word.symbols||[]).map((s:any)=>({text:s.text,x:s.bbox.x0/w,y:s.bbox.y0/h,w:(s.bbox.x1-s.bbox.x0)/w,h:(s.bbox.y1-s.bbox.y0)/h}))};const piece={...token,confidence:l.confidence,ocrTokens:[token]};if(!group||piece.x-(group.x+group.w)>.075||split!==null&&group.x<split&&piece.x>=split){if(group)lines.push(group);group=piece;}else{group.text+=' '+piece.text;group.ocrTokens=[...(group.ocrTokens||[]),token];group.w=Math.max(group.x+group.w,piece.x+piece.w)-group.x;group.y=Math.min(group.y,piece.y);group.h=Math.max(group.h,piece.h);}}if(group)lines.push(group);}else lines.push({confidence:l.confidence,text:l.text.trim(),x:l.bbox.x0/w,y:l.bbox.y0/h,w:(l.bbox.x1-l.bbox.x0)/w,h:(l.bbox.y1-l.bbox.y0)/h});}
for(const l of lines){l.ocrGeometry=geometry;l.text=l.text.trim().replace(/^([a-e])\s*[).]\s*/i,(_,letter)=>letter.toUpperCase()+') ').replace(/^([A-E])\1\)\s*/i,(_,letter)=>letter.toUpperCase()+') ');}return lines.filter(l=>l.text);}

// Infer a missing label only inside one OCR question, between reliable neighbours.
// No symbol-to-letter table: the accepted neighbours determine the missing letter.
// OCR bazen şık harflerini (A/B/C) hiç okumaz ve satırlar yalnız ")" ile başlar. En az 3 (ve en çok maxChoices) hizalı, ")" ile
// başlayan ya da harfli satır tek sütunda ardışıksa ve harfli olanlar konumlarıyla uyuşuyorsa harf konumdan çıkarılır (uyarılı).
// Izgara yerleşimi (2×2, 1×4): harfli ve harfsiz (")") şık parçaları satır-büyük-sütun sırasıyla maxChoices adet ve düzenli bir ızgara
// oluşturuyorsa, harfli parçalar konumlarıyla uyuşuyorsa eksik harfler konumdan çıkarılır. Tek sütun yerleşim eski yola bırakılır.
function inferGridChoices(block:Line[],maxChoices:number){
 const rowText=(l:Line)=>l.text.trim(),isBare=(l:Line)=>/^\)\s*\S/.test(rowText(l))&&!l.monospace,isLabeled=(l:Line)=>optionPattern.test(rowText(l));
 const first=block[0];if(!first)return null;
 const pieces=block.filter(l=>l!==first&&l.y>first.y&&(isLabeled(l)||isBare(l)));
 if(pieces.length!==maxChoices||!pieces.some(isBare))return null;
 const rowTolerance=Math.max(...pieces.map(l=>l.h))*.7,sorted=pieces.slice().sort((a,b)=>a.y-b.y),rows:Line[][]=[];
 for(const l of sorted){const row=rows.at(-1);if(row&&l.y-row[0].y<=rowTolerance)row.push(l);else rows.push([l]);}
 rows.forEach(r=>r.sort((a,b)=>a.x-b.x));
 const xs=pieces.map(l=>l.x).sort((a,b)=>a-b),columns:number[]=[];for(const x of xs){if(columns.length&&x-columns[columns.length-1]<.04)continue;columns.push(x);}
 if(columns.length<2||rows.slice(0,-1).some(r=>r.length!==columns.length)||rows.at(-1)!.length>columns.length)return null;
 const column=(l:Line)=>columns.reduce((best,x,i)=>Math.abs(l.x-x)<Math.abs(l.x-columns[best])?i:best,0);
 if(rows.some(r=>r.some((l,i)=>i&&column(l)<=column(r[i-1]))))return null;
 const ordered=rows.flat();
 if(ordered.some((l,i)=>isLabeled(l)&&rowText(l).match(optionPattern)![1].charCodeAt(0)-65!==i))return null;
 const copy=block.slice(),repairs:{letter:string;original:string;x:number;y:number}[]=[];
 ordered.forEach((l,i)=>{if(!isBare(l))return;const letter=String.fromCharCode(65+i);copy[block.indexOf(l)]={...l,text:letter+') '+rowText(l).replace(/^\)\s*/,'')};repairs.push({letter,original:l.text,x:l.x,y:l.y});});
 return {lines:copy,repairs};
}
function inferUnlabeledChoices(block:Line[],maxChoices:number){
 const rowText=(l:Line)=>l.text.trim(),isBare=(l:Line)=>/^\)\s*\S/.test(rowText(l))&&!l.monospace;
 const first=block[0];if(!first)return null;
 const rows=block.filter(l=>l!==first&&l.y>first.y&&(optionPattern.test(rowText(l))||isBare(l))).sort((a,b)=>a.y-b.y);
 if(rows.length<3||rows.length>maxChoices||!rows.some(isBare))return null;
 const glyph=median(block.filter(l=>l.ocrGeometry).map(l=>l.ocrGeometry!.glyphWidth)),tolerance=Math.max(glyph*2,.02),anchor=median(rows.map(l=>l.x));
 if(rows.some(l=>Math.abs(l.x-anchor)>tolerance)||rows.some((l,i)=>i&&l.y-rows[i-1].y>.12))return null;
 if(rows.some((l,i)=>!isBare(l)&&rowText(l).match(optionPattern)![1].charCodeAt(0)-65!==i))return null;
 const copy=block.slice(),repairs:{letter:string;original:string;x:number;y:number}[]=[];
 rows.forEach((l,i)=>{if(!isBare(l))return;const letter=String.fromCharCode(65+i);copy[block.indexOf(l)]={...l,text:letter+') '+rowText(l).replace(/^\)\s*/,'')};repairs.push({letter,original:l.text,x:l.x,y:l.y});});
 return {lines:copy,repairs};
}
export function repairOptionSequence(block:Line[],maxChoices=4){
 const repairs:{letter:string;original:string;x:number;y:number}[]=[];
 if(!block.some(l=>l.ocrGeometry))return {lines:block,repairs};
 {const grid=inferGridChoices(block,maxChoices);if(grid)return grid;}
 if(block.filter(l=>optionPattern.test(l.text)).length<2){const inferred=inferUnlabeledChoices(block,maxChoices);if(inferred)return inferred;}
 const labels=block.filter(l=>optionPattern.test(l.text));if(labels.length<2)return {lines:block,repairs};
 const glyph=median(block.filter(l=>l.ocrGeometry).map(l=>l.ocrGeometry!.glyphWidth));
 const tolerance=Math.max(glyph*.6,median(labels.map(l=>l.h))*.35);
 const clusters:Line[][]=[];for(const l of labels){const c=clusters.find(c=>Math.abs(l.x-median(c.map(a=>a.x)))<=tolerance);if(c)c.push(l);else clusters.push([l]);}
 const cluster=clusters.sort((a,b)=>b.length-a.length)[0],anchor=median(cluster.map(l=>l.x));
 if(cluster.length<2)return {lines:block,repairs};
 let trusted=cluster.slice().sort((a,b)=>a.y-b.y),index=(l:Line)=>l.text.match(optionPattern)![1].charCodeAt(0)-65;
 if(trusted.some((l,i)=>i&&index(l)<=index(trusted[i-1])))return {lines:block,repairs};
 const copy=block.slice();
 const offsets=cluster.flatMap(l=>{const words=l.ocrTokens||[],first=words[0],prefix=first?.text.match(/^\(?[a-e]\s*[).:\-]/i);if(!prefix)return [];const symbol=first.symbols?.[prefix[0].length];return symbol?[symbol.x-l.x]:words[1]?[words[1].x-l.x]:[];});
 const bodyOffset=offsets.length?median(offsets):0,edgeTolerance=bodyOffset?Math.max(tolerance,bodyOffset*.65):tolerance;
 const aligned=(l:Line)=>l.x>=anchor-tolerance&&l.x<=anchor+edgeTolerance;
 const candidateBody=(l:Line)=>{const token=l.text.trim().split(/\s+/)[0];if(/^\d+$/.test(token)||l.monospace)return null;
  const fused=token.match(/^[a-e](\d.*)$/i);if(fused)return (fused[1]+l.text.trim().slice(token.length)).trim();
  const first=l.ocrTokens?.[0],symbols=first?.symbols;if(bodyOffset&&symbols?.length&&/[^\p{L}]/u.test(token)&&symbols[0].x+symbols[0].w/2<anchor+bodyOffset-glyph*.25){const suffix=symbols.filter(s=>s.x+s.w/2>=anchor+bodyOffset-glyph*.25).map(s=>s.text).join('');if(/[\p{L}\p{N}]/u.test(suffix))return (suffix+l.text.trim().slice(token.length)).trim();}
  if(token.length>3)return /^\p{L}+$/u.test(token)?l.text.trim():null;if(/^\p{L}{3}$/u.test(token))return l.text.trim()===token?token:null;return l.text.trim().slice(token.length).trim();};
  for(let i=1;i<trusted.length;i++){
   const previous=trusted[i-1],next=trusted[i],missing=index(next)-index(previous)-1;if(missing<1||missing>3)continue;
   const step=(next.y-previous.y)/(missing+1),used=new Set<Line>();
   const eligible=block.filter(l=>l.y>previous.y+previous.h*.45&&l.y<next.y-next.h*.35&&aligned(l)&&!optionPattern.test(l.text)&&!questionPattern.test(l.text)&&candidateBody(l)!==null);
   if(eligible.length!==missing)continue;
   for(let gap=1;gap<=missing;gap++){
    const target=previous.y+step*gap,candidates=eligible.filter(l=>!used.has(l)).sort((a,b)=>Math.abs(a.y-target)-Math.abs(b.y-target));
    const candidate=candidates[0];if(!candidate||Math.abs(candidate.y-target)>Math.max(step*.75,candidate.h*2.5))continue;
    const letter=String.fromCharCode(65+index(previous)+gap),sameRow=block.filter(l=>l!==candidate&&Math.abs(l.y-candidate.y)<Math.max(l.h,candidate.h)*.6&&l.x>anchor+tolerance),rest=candidateBody(candidate)!;
    if(!rest&&!sameRow.length)continue;copy[block.indexOf(candidate)]={...candidate,y:Math.min(candidate.y,...sameRow.map(l=>l.y)),text:letter+') '+rest};repairs.push({letter,original:candidate.text,x:candidate.x,y:candidate.y});used.add(candidate);
   }
  }
 // Endpoints require three consecutive trusted labels and regular row spacing.
 trusted=copy.filter(l=>optionPattern.test(l.text)&&Math.abs(l.x-anchor)<=tolerance).sort((a,b)=>a.y-b.y);
 const spacing=median(trusted.slice(1).map((l,i)=>l.y-trusted[i].y));
 const attach=(candidate:Line,letter:string)=>{const rest=candidateBody(candidate);const sameRow=block.filter(l=>l!==candidate&&Math.abs(l.y-candidate.y)<Math.max(l.h,candidate.h)*.6&&l.x>anchor+tolerance);if(rest===null||!rest&&!sameRow.length)return;copy[block.indexOf(candidate)]={...candidate,y:Math.min(candidate.y,...sameRow.map(l=>l.y)),text:letter+') '+rest};repairs.push({letter,original:candidate.text,x:candidate.x,y:candidate.y});};
 // When only A/B survived, accept exactly three regularly spaced rows in the
 // same marker column as C/D/E. Their content is preserved; only the damaged
 // marker prefix is replaced. This covers the common red-circle OCR failure.
 if(maxChoices===5&&trusted.length===2&&index(trusted[0])===0&&index(trusted[1])===1&&spacing>0){
  const tail=copy.filter(l=>!optionPattern.test(l.text)&&!questionPattern.test(l.text)&&aligned(l)&&candidateBody(l)!==null&&l.y-trusted[1].y>spacing*.55&&l.y-trusted[1].y<spacing*3.8).sort((a,b)=>a.y-b.y);
  const regular=tail.length===3&&tail.every((l,i)=>{const prior=i?tail[i-1]:trusted[1];const gap=l.y-prior.y;return gap>spacing*.55&&gap<spacing*1.5;});
  if(regular)tail.forEach((l,i)=>attach(l,String.fromCharCode(67+i)));
 }
 if(trusted.length>=3&&trusted.every((l,i)=>!i||index(l)===index(trusted[i-1])+1)&&spacing>0){
  for(const [letter,target,direction] of [['A',trusted[0],-1],[String.fromCharCode(64+maxChoices),trusted.at(-1)!,1]] as const){
   if(direction===-1&&index(target)!==1||direction===1&&index(target)!==maxChoices-2)continue;
   const candidates=block.filter(l=>!optionPattern.test(l.text)&&!questionPattern.test(l.text)&&(aligned(l)||!!bodyOffset&&Math.abs(l.x-(anchor+bodyOffset))<=tolerance)&&(l.y-target.y)*direction>spacing*.55&&(l.y-target.y)*direction<spacing*1.5);
   if(candidates.length===1)attach(candidates[0],letter);
  }
  // Continue a regular tail one slot at a time; each decision still needs one unique row.
  let last=copy.filter(l=>optionPattern.test(l.text)&&aligned(l)).sort((a,b)=>a.y-b.y).at(-1)!;
  while(index(last)<maxChoices-1){const candidates=copy.filter(l=>!optionPattern.test(l.text)&&!questionPattern.test(l.text)&&aligned(l)&&l.y-last.y>spacing*.55&&l.y-last.y<spacing*1.5);if(candidates.length!==1)break;const count=repairs.length;attach(candidates[0],String.fromCharCode(66+index(last)));if(repairs.length===count)break;last=copy[block.indexOf(candidates[0])];}
 }return {lines:copy,repairs};
}

function normalizeOptionPrefix(line:Line):Line{return {...line,text:line.text.replace(/^(\(?)([a-e])(\s*[).:\-])/i,(_,open,letter,separator)=>open+letter.toUpperCase()+separator)};}
function splitOptions(line:Line):Line[]{const labeled=[...line.text.matchAll(/(?:^|\s)(\(?[A-E]\s*[).:\-])(?=\s|$)/gi)],optionRow=/^\(?[A-E]\s*[).:\-]|^\)\s/i.test(line.text.trim()),bare=optionRow?[...line.text.matchAll(/(?:^|\s)(\))(?=\s+\S)/g)].filter(b=>!labeled.some(m=>b.index!>=m.index!&&b.index!<m.index!+m[0].length)):[],matches=[...labeled,...bare].sort((a,b)=>a.index!-b.index!);if(matches.length<2)return [normalizeOptionPrefix(line)];const result:Line[]=[];const first=matches[0].index!;if(first>0)result.push({...sliceTextLine(line,0,first),w:line.w*first/line.text.length});for(let i=0;i<matches.length;i++){const start=matches[i].index!+(matches[i][0].startsWith(' ')?1:0),end=i+1<matches.length?matches[i+1].index!:line.text.length;result.push(normalizeOptionPrefix({...sliceTextLine(line,start,end),x:line.x+line.w*start/line.text.length,w:line.w*(end-start)/line.text.length}));}return result;}

// Number-only answers stay forbidden in the general pass. They are repaired
// only inside an already separated, unnumbered proposal when three reliable
// labels establish one narrow and ordered A-E column.
export function repairNumericOptionColumn(block:Line[]){
 const reliable=block.filter(l=>l.ocrGeometry&&optionPattern.test(l.text));
 const letters=new Set(reliable.map(l=>l.text.match(optionPattern)![1].toUpperCase()));
 if(reliable.length<3||!letters.has('B')||!letters.has('D')||!letters.has('E'))return block;
 const glyph=median(reliable.map(l=>l.ocrGeometry!.glyphWidth)),anchor=median(reliable.map(l=>l.x)),tolerance=Math.max(glyph*.75,median(reliable.map(l=>l.h))*.45);
 if(reliable.some(l=>Math.abs(l.x-anchor)>tolerance))return block;
 const numeric=block.filter(l=>l.ocrGeometry&&Math.abs(l.x-anchor)<=tolerance&&!optionPattern.test(l.text)&&/^(?:a\s*)?\d+$/i.test(l.text.trim()));
 const rows=[...reliable,...numeric].sort((a,b)=>a.y-b.y);if(rows.length!==5)return block;
 const copy=block.slice();for(let i=0;i<rows.length;i++){const row=rows[i],expected=String.fromCharCode(65+i),match=row.text.match(optionPattern);if(match){if(match[1].toUpperCase()!==expected)return block;continue;}if(expected!=='A'&&expected!=='C')return block;const body=row.text.trim().replace(/^a\s*/i,'');copy[block.indexOf(row)]={...row,text:expected+') '+body};}
 return copy;
}

// A second ordered choice run cannot overwrite a question whose number was read.
// Preserve the unnumbered remainder for teacher review instead of inventing a number.
export function separateOCRChoiceRun(block:Line[]){
 if(!block.some(l=>l.ocrGeometry))return {lines:block,remainder:[] as Line[]};
 const labels=block.filter(l=>optionPattern.test(l.text));const glyph=median(block.map(l=>l.ocrGeometry?.glyphWidth||0).filter(Boolean));
 for(let i=3;i<labels.length-2;i++){
  const previous=labels[i-1],next=labels[i],idx=(l:Line)=>l.text.match(optionPattern)![1].charCodeAt(0);
  if(idx(next)>=idx(previous)||next.y-previous.y<Math.max(previous.h,next.h)*1.5)continue;
  const run=labels.slice(i,i+3);if(idx(run.at(-1)!)<4||!run.every((l,j)=>!j||idx(l)>idx(run[j-1])))continue;
  let boundary=block.find(l=>l.y>previous.y+previous.h*1.5&&l.y<=next.y&&Math.abs(l.x-block[0].x)<=glyph*2&&!optionPattern.test(l.text));
  if(!boundary)continue;
  const rowHeight=median(block.map(l=>l.h));const between=block.filter(l=>l.y>previous.y+previous.h&&l.y<=boundary!.y).sort((a,b)=>a.y-b.y);
  for(let j=between.length-2;j>=0;j--){if(boundary.y-between[j].y>rowHeight*1.8)break;boundary=between[j];}
  return {lines:block.filter(l=>l.y<boundary!.y),remainder:repairNumericOptionColumn(block.filter(l=>l.y>=boundary!.y))};
 }
 return {lines:block,remainder:[] as Line[]};
}

// Only an unambiguous second sequence can stand in for one obscured number.
export function inferOCRQuestionBoundary(block:Line[]):Line|null{
 if(!block.some(l=>l.ocrGeometry))return null;
 const repaired=repairOptionSequence(block,5).lines,labels=repaired.filter(l=>optionPattern.test(l.text));
 const index=(l:Line)=>l.text.match(optionPattern)![1].charCodeAt(0)-65;
 const glyph=median(block.map(l=>l.ocrGeometry?.glyphWidth||0).filter(Boolean)),boundaries:Line[]=[];
 for(let i=3;i<labels.length-2;i++){
  if(index(labels[i])>1||index(labels[i-1])<3)continue;
  const previous=labels.slice(0,i),last=labels[i-1];
  const tail=repairOptionSequence(block.filter(l=>l.y>last.y+last.h),5).lines.filter(l=>optionPattern.test(l.text));
  const run=tail.slice(0,3);
  if(run.length<3||!run.every((l,j)=>index(l)===j)||!previous.slice(-3).every((l,j,a)=>!j||index(l)===index(a[j-1])+1))continue;
  const next=run[0];
  const body=block.filter(l=>l.y>last.y+last.h*1.5&&l.y<next.y&&Math.abs(l.x-block[0].x)<=glyph*2&&!optionPattern.test(l.text)&&!questionPattern.test(l.text));
  if(!body.length)continue;
  const first=body.slice().sort((a,b)=>a.y-b.y)[0];
  // Multiple separated stem starts cannot be resolved from sequence alone.
  if(body.some((l,j)=>j>0&&l.y-body[j-1].y>Math.max(l.h,body[j-1].h)*4))continue;
  boundaries.push(first);
 }
 return boundaries.length===1?boundaries[0]:null;
}

export type NumberGap={number:number;page:number;column:'left'|'right';anchor:number;glyph:number;x:number;w:number;top:number;bottom:number;local:boolean};
export function numberGapSpans(pages:Line[][],accepted:{number:number;page:number;marker:Line;endY?:number}[],limit=6):NumberGap[]{
 const spans:NumberGap[]=[],seen=new Set(accepted.map(q=>q.number));
 for(let n=2;n<Math.max(0,...seen);n++){
  if(seen.has(n))continue;const a=accepted.find(q=>q.number===n-1),b=accepted.find(q=>q.number===n+1);if(!a||!b)continue;
  const column=(q:typeof a)=>{const split=pages[q.page-1].find(l=>l.ocrGeometry)?.ocrGeometry?.split;return split!=null&&q.marker.x>=split?'right' as const:'left' as const;};
  const local=a.page===b.page&&column(a)===column(b);
  const parts=local?[{page:a.page,column:column(a),top:Math.max(a.marker.y+a.marker.h,a.endY||0),bottom:b.marker.y}]:[{page:a.page,column:column(a),top:Math.max(a.marker.y+a.marker.h,a.endY||0),bottom:.91},{page:b.page,column:column(b),top:.055,bottom:b.marker.y}];
  for(const p of parts){const anchors=accepted.filter(q=>q.page===p.page&&column(q)===p.column).map(q=>q.marker.x),anchor=median(anchors),glyph=pages[p.page-1].find(l=>l.ocrGeometry)?.ocrGeometry?.glyphWidth||0;if(!glyph||p.bottom<=p.top||!pages[p.page-1].some(l=>l.y>=p.top&&l.y<p.bottom&&Math.abs(l.x-anchor)<glyph*2&&!optionPattern.test(l.text)&&/[\p{L}]{4}/u.test(l.text)))continue;spans.push({number:n,...p,anchor,glyph,x:Math.max(0,anchor-glyph*1.2),w:glyph*7.5,local});}
 }
 return spans.sort((a,b)=>Number(b.local)-Number(a.local)||(a.bottom-a.top)*a.w-(b.bottom-b.top)*b.w).slice(0,limit);
}
export type NumberContext={expectedNumber?:number;total?:number;pageKind?:string;recoverRejected?:boolean;graphics?:Box[]};
export type NumberDiagnostic={page:number;number:number;text:string;x:number;columnEdge:number;anchor:number;indent:number;expected:number|undefined;decision:string;reason:string;indentTolerance?:number;glyphWidth?:number;columnSplit?:number|null};
// Only noise outside this question sets crop limits; diagrams inside it are retained.
export function questionCropLimits(lines:Line[],repeated:Set<string>,left:number,right:number,firstY:number){const noise=lines.filter(l=>l.x+l.w>left&&l.x<right&&layoutNoise(l,repeated));const headers=noise.filter(l=>l.y<.12&&l.y+l.h<=firstY+.001);const footers=noise.filter(l=>l.y>.82&&l.y>firstY&&(!/^\d{1,3}$/.test(l.text.trim())||l.x<=left+(right-left)*.85));return {top:Math.min(firstY,Math.max(.02,...headers.map(l=>l.y+l.h+.002))),bottom:Math.min(.95,...footers.map(l=>l.y-.003))};}
export function inferMissingOptionText(block:Line[],opts:Line[],optionText:string[],repeated=new Set<string>()){
 const suggestions:{index:number;text:string;reason:string}[]=[],index=(l:Line)=>l.text.match(optionPattern)![1].charCodeAt(0)-65;
 const labels=opts.slice().sort((a,b)=>a.y-b.y),markerX=median(labels.map(l=>l.x)),rowHeight=median(block.map(l=>l.h).filter(h=>h>0));
 const bodyStarts=labels.flatMap(l=>{const marker=l.ocrTokens?.[0],body=l.ocrTokens?.find((_,i)=>i>0);return body?[body.x]:marker?[marker.x+marker.w]:[];}),bodyX=bodyStarts.length?median(bodyStarts):markerX+Math.max(.012,rowHeight*1.6);
 for(let i=1;i<optionText.length-1;i++){
  if(optionText[i].trim())continue;
  const previous=labels.filter(l=>index(l)<i).sort((a,b)=>index(b)-index(a))[0],next=labels.filter(l=>index(l)>i).sort((a,b)=>index(a)-index(b))[0];
  if(!previous||!next)continue;const before=index(previous),after=index(next),distance=after-before;if(distance<2||i<=before||i>=after)continue;
  const rows=block.filter(l=>l.y>previous.y+previous.h*.6&&l.y<next.y-next.h*.25&&!optionPattern.test(l.text)&&!questionPattern.test(l.text)&&!layoutNoise(l,repeated)).sort((a,b)=>a.y-b.y||a.x-b.x);
  if(!rows.length)continue;
  const target=previous.y+(next.y-previous.y)*(i-before)/distance,tolerance=Math.max(rowHeight*1.4,(next.y-previous.y)/distance*.42);
  const aligned=rows.map((l,j)=>({j,l,distance:Math.abs(l.y-target),alignment:Math.min(Math.abs(l.x-markerX),Math.abs(l.x-bodyX)),restart:/^(?:\p{Lu}|\p{N}|[^\p{L}\p{N}])/u.test(l.text.trim())||j>0&&l.x<rows[j-1].x-rowHeight*.45})).filter(c=>c.distance<=tolerance&&c.alignment<=Math.max(.045,rowHeight*4));
  if(!aligned.length)continue;const restarts=aligned.filter(c=>c.restart),choice=(restarts.length?restarts:aligned).sort((a,b)=>a.distance-b.distance||a.alignment-b.alignment)[0];let at=choice.j;
  if(!choice.restart)while(at>0&&rows[at].y-target>rowHeight*.35&&target-(rows[at-1].y+rows[at-1].h)<rowHeight*.45)at--;
  const candidateRows=rows.slice(at),first=candidateRows[0],token=first.ocrTokens?.[0],symbols=token?.symbols||[],bodyThreshold=bodyX-rowHeight*.3,bodySymbol=symbols.findIndex(s=>s.x+s.w/2>=bodyThreshold),markerPrefix=bodySymbol>0&&bodySymbol<=2?symbols.slice(0,bodySymbol).map(s=>s.text).join('').length:0;
  if(markerPrefix>0)candidateRows[0]=sliceTextLine(first,markerPrefix);
  const physicalRows:Line[][]=[];for(const line of candidateRows){const center=line.y+line.h/2,group=physicalRows.find(g=>Math.abs(center-median(g.map(r=>r.y+r.h/2)))<Math.max(.004,Math.min(line.h,median(g.map(r=>r.h)))*.65));if(group)group.push(line);else physicalRows.push([line]);}
  const mergedRows=physicalRows.map(group=>{const ordered=group.slice().sort((a,b)=>a.x-b.x),x=Math.min(...ordered.map(l=>l.x)),y=Math.min(...ordered.map(l=>l.y)),right=Math.max(...ordered.map(l=>l.x+l.w)),bottom=Math.max(...ordered.map(l=>l.y+l.h));return {...ordered[0],x,y,w:right-x,h:bottom-y,text:ordered.map(l=>l.text.trim()).filter(Boolean).join(' '),ocrTokens:ordered.flatMap(l=>l.ocrTokens||[])};}).sort((a,b)=>a.y-b.y);
  const candidate=composeTextLines(mergedRows).text.replace(/\s+/g,' ').trim();
  if(candidate.length<2||candidateRows[0].y<previous.y+previous.h*.8||candidateRows.at(-1)!.y+candidateRows.at(-1)!.h>next.y+next.h*.15)continue;
  suggestions.push({index:i,text:candidate,reason:`${String.fromCharCode(65+i)} işareti okunmadı; komşu şıkların düşey sırası ve içerik sütunundaki sahipsiz satırlar öğretmen önerisine bağlandı.`});
 }
 return suggestions;
}
function numberedCodeLines(ordered:Line[]){const result=new Set<Line>();const code=(t:string)=>/^(?:#\s*include\b|(?:int|void|float|double|char|return|printf|cout|std::|if|for|while)\b|[{}]\s*$)|[;{}]\s*$/i.test(t.trim());const question=(t:string)=>/\?|hangisi|aşağıdaki|yukarıdaki|which|what|soru\s*\d/i.test(t);for(let i=0;i<ordered.length;i++){const m=ordered[i].text.match(questionPattern);if(!m||Number(m[1])>20||question(m[2]))continue;const run:Line[]=[ordered[i]];let n=Number(m[1]);for(let j=i+1;j<ordered.length;j++){const next=ordered[j],nm=next.text.match(questionPattern);if(!nm||Number(nm[1])!==n+1||Number(nm[1])>20||Math.abs(next.x-run[0].x)>.02||next.y-run.at(-1)!.y>.05||question(nm[2]))break;run.push(next);n++;}const syntax=run.filter(l=>code(l.text.match(questionPattern)![2])).length,colon=run.filter(l=>/^\d+\s*:/.test(l.text)).length,mono=run.filter(l=>l.monospace).length;if(run.length>=3&&(colon>=3||syntax>=2||mono/run.length>=.6)||/^\d+\s*:/.test(ordered[i].text)&&code(m[2])){run.forEach(l=>result.add(l));i+=run.length-1;}}return result;}
// OCR bazen kalın soru numarasının noktasını okumaz ve numarayı metinden ayrı, tek başına bir satır verir ("10" + "Visual Basic'te ..."). Genel geometri sinyali: soldaki çıplak 1-3 haneli satır, aynı taban çizgisinde sağdaki bir metin satırıyla birleşir; yalnız (a) sütundaki komşu numaralı soruların arasına sıra olarak oturuyorsa ve (b) bir sonraki işarete kadar en az iki şık satırı varsa. Birleşen satır "numara sıradan çıkarıldı" uyarısı taşır.
export const MERGED_NUMBER=Symbol('mergedNumber');
export function mergeDetachedNumbers(lines:Line[],total?:number):Line[]{const bare=(l:Line)=>/^\d{1,3}$/.test(l.text.trim()),optionLike=(t:string)=>optionPattern.test(t.trim())||/^\)\s*\S/.test(t.trim());const sameColumn=(a:Line,b:Line)=>Math.abs(b.x-a.x)<.05,inColumn=(a:Line,b:Line)=>b.x>=a.x-.03&&b.x<a.x+.33;const markers=lines.filter(l=>!bare(l)&&questionPattern.test(l.text)).map(l=>({line:l,n:Number(l.text.match(questionPattern)![1])}));const detached=lines.filter(l=>l.ocrGeometry&&bare(l)&&l.y>.055&&l.y<.91);if(!detached.length)return lines;const drop=new Set<Line>(),made:Line[]=[];for(const c of detached){const n=Number(c.text.trim());if(n<1||total&&n>total)continue;if(detached.some(o=>o!==c&&Math.abs(o.y-c.y)<Math.max(o.h,c.h)*.7&&Math.abs(o.x-c.x)<.03))continue;const right=lines.filter(r=>r!==c&&!bare(r)&&r.ocrGeometry&&Math.abs(r.y-c.y)<=Math.max(r.h,c.h)*.7&&r.x>=c.x+c.w-.005&&r.x-(c.x+c.w)<=.07&&r.text.trim().length>=4&&!optionLike(r.text)&&!questionPattern.test(r.text)&&!/[;{}=<>]|\b(?:int|void|printf|return|if|for)\b/.test(r.text)).sort((a,b)=>a.x-b.x)[0];if(!right||drop.has(right))continue;const col=markers.filter(m=>sameColumn(c,m.line)),above=col.filter(m=>m.line.y<c.y).sort((a,b)=>b.line.y-a.line.y)[0],below=col.filter(m=>m.line.y>c.y).sort((a,b)=>a.line.y-b.line.y)[0];if(above&&n<=above.n||below&&n>=below.n)continue;const boundary=Math.min(below?below.line.y:1,...detached.filter(o=>o!==c&&o.y>c.y&&sameColumn(c,o)).map(o=>o.y));const choices=lines.filter(o=>o.y>c.y&&o.y<boundary&&inColumn(c,o)&&optionLike(o.text));if(choices.length<2)continue;const prefix=n+'. ',top=Math.min(c.y,right.y),merged:Line={...right,text:prefix+right.text,marks:right.marks?.map(m=>({...m,start:m.start+prefix.length,end:m.end+prefix.length})),x:c.x,w:Math.max(.01,right.x+right.w-c.x),y:top,h:Math.max(c.y+c.h,right.y+right.h)-top};(merged as any)[MERGED_NUMBER]=true;drop.add(c);drop.add(right);made.push(merged);markers.push({line:merged,n});}return made.length?[...lines.filter(l=>!drop.has(l)),...made]:lines;}
// OCR bazen birden çok art arda gelen kalın soru numarasını hiç okumaz. Sütun, "şık koşusu + büyük boşluk" ile soru gruplarına bölünür;
// numarasız grupların sayısı komşu numaralar arasındaki boşlukla TAM olarak eşleşirse numaralar sırayla çıkarılır. Eşleşmezse hiçbir şey değişmez.
// Tek numaralık boşluk (run=1) mevcut politikada kalır: yalnızca öğretmen önerisi olarak yer tutucuya bağlanır (inferOCRQuestionBoundary).
export const GROUP_NUMBER=Symbol('groupNumber');
export function assignGroupNumbers(columns:{lines:Line[]}[],expected?:number,total?:number){
 const isChoice=(l:Line)=>optionPattern.test(l.text.trim())||(/^\)\s*\S/.test(l.text.trim())&&!l.monospace);
 type Group={col:number;lines:Line[];choices:number;number?:number};const groups:Group[]=[];
 columns.forEach((col,ci)=>{if(!col.lines.some(l=>l.ocrGeometry))return;const ordered=col.lines.flatMap(splitOptions).sort((a,b)=>Math.abs(a.y-b.y)<.006?a.x-b.x:a.y-b.y);const keyAt=ordered.findIndex(l=>keyHeader.test(l.text));if(keyAt>=0)ordered.splice(keyAt);
  const rowHeight=median(ordered.map(l=>l.h));let current:Group={col:ci,lines:[],choices:0},previous:Line|undefined;
  for(const l of ordered){if(previous&&current.choices>=3&&!isChoice(l)&&l.y-previous.y>rowHeight*1.9){groups.push(current);current={col:ci,lines:[],choices:0};}current.lines.push(l);if(isChoice(l))current.choices++;previous=l;}
  if(current.lines.length)groups.push(current);});
 for(const g of groups){const firstChoice=g.lines.findIndex(isChoice),head=g.lines.slice(0,firstChoice<0?g.lines.length:firstChoice),m=head.map(l=>l.text.match(questionPattern)).find(Boolean);if(m)g.number=Number(m[1]);}
 const replacements=new Map<number,Map<Line,Line>>();let before=expected!==undefined?expected-1:undefined;
 for(let i=0;i<groups.length;i++){const g=groups[i];if(g.number!==undefined){before=g.number;continue;}
  let j=i;while(j<groups.length&&groups[j].number===undefined)j++;const run=groups.slice(i,j),after=groups[j]?.number;
  if(before!==undefined&&after!==undefined&&run.length>=2&&run.length===after-before-1&&run.every(r=>r.choices>=3)&&(!total||after<=total)){
   run.forEach((r,k)=>{const col=columns[r.col],anchors=col.lines.filter(l=>questionPattern.test(l.text)).map(l=>l.x),first=r.lines[0],number=before!+1+k,x=anchors.length?Math.min(first.x,median(anchors)):first.x;
    const original=col.lines.find(l=>l.y===first.y&&l.x===first.x&&l.text===first.text);if(!original)return;
    const marked:Line={...original,text:number+'. '+original.text,marks:original.marks?.map(mk=>({...mk,start:mk.start+String(number).length+2,end:mk.end+String(number).length+2})),x,w:Math.max(.01,original.x+original.w-x)};(marked as any)[GROUP_NUMBER]=true;
    if(!replacements.has(r.col))replacements.set(r.col,new Map());replacements.get(r.col)!.set(original,marked);});}
  i=j-1;}
 replacements.forEach((map,ci)=>{columns[ci].lines=columns[ci].lines.map(l=>map.get(l)??l);});
}
export function analyzePage(lines:Line[],page:number,repeated=new Set<string>(),includePartial=false,context:NumberContext={}){if(context.pageKind&&context.pageKind!=='questions')return {regions:[] as Region[],warnings:[] as string[],excluded:[] as ExcludedBlock[],excludedRegions:[] as {id:string;region:Region}[],numberDiagnostics:[] as NumberDiagnostic[],firstY:undefined,answerKey:{},expected:undefined};const choiceEvidence=lines.filter(l=>l.ocrGeometry&&optionPattern.test(l.text));const possibleChoice=(l:Line)=>!!l.ocrGeometry&&l.y>.055&&l.y<.91&&l.text.trim().split(/\s+/)[0].length<=3&&choiceEvidence.some(o=>Math.abs(l.x-o.x)<Math.max(l.ocrGeometry!.glyphWidth*.6,l.h*.35)&&Math.abs(l.y-o.y)<Math.max(l.h,o.h)*4);const clean=mergeDetachedNumbers(lines.filter(l=>l.y>.018&&l.y<.95&&(!layoutNoise(l,repeated)||possibleChoice(l))),context.total);const split=columnSplit(clean);const columns=split!==null?[{left:.025,right:split-.003,lines:clean.filter(l=>l.x<split)},{left:split+.003,right:.975,lines:clean.filter(l=>l.x>=split)}]:[{left:.025,right:.975,lines:clean}];const regions:Region[]=[];const warnings:string[]=[];const excluded:ExcludedBlock[]=[];const excludedRegions:{id:string;region:Region}[]=[],numberDiagnostics:NumberDiagnostic[]=[];let expectedNumber=context.expectedNumber;assignGroupNumbers(columns,expectedNumber,context.total);
for(const col of columns){const ordered=col.lines.flatMap(splitOptions).sort((a,b)=>Math.abs(a.y-b.y)<.006?a.x-b.x:a.y-b.y);const keyAt=ordered.findIndex(l=>keyHeader.test(l.text));if(keyAt>=0)ordered.splice(keyAt);const codeLines=numberedCodeLines(ordered);const candidates=ordered.filter(l=>questionPattern.test(l.text));const geometry=col.lines.find(l=>l.ocrGeometry?.split!==null&&l.ocrGeometry?.split!==undefined)?.ocrGeometry;const realCandidates=candidates.filter(l=>!codeLines.has(l));const clusterTolerance=geometry?Math.max(geometry.glyphWidth*1.5,(col.right-col.left)*.015):0;const clusters:Line[][]=[];for(const l of realCandidates.slice().sort((a,b)=>a.x-b.x)){const cluster=clusters.find(c=>Math.abs(l.x-median(c.map(a=>a.x)))<=clusterTolerance);if(cluster)cluster.push(l);else clusters.push([l]);}const anchor=geometry?median((clusters[0]||[]).map(l=>l.x)):realCandidates[0]?.x??0;const tolerance=geometry?Math.max(geometry.glyphWidth,(col.right-col.left)*.025):.016;const starts:number[]=[],rejected:Line[]=[];for(const l of candidates){const m=l.text.match(questionPattern)!,number=Number(m[1]),expected=expectedNumber;const leftEnough=geometry?Math.abs(l.x-anchor)<=Math.min(tolerance*3,(col.right-col.left)*.12)+1e-9:l.x>=col.left-.004&&l.x-col.left<=Math.min(.10,(col.right-col.left)*.20),sequential=expected!==undefined&&number===expected&&leftEnough;let decision='accept',reason=sequential?'Beklenen ardışık numara ve sütunun sol kenarı doğrulandı.':'Sütun içindeki anchor girinti kontrolü geçti.';if(codeLines.has(l)){decision='body';reason='Kod satırı: küçük ardışık numaralar, iki nokta/monospace/kod sözdizimi; soru gövdesinde korundu.';}else if(context.total&&number>context.total){decision='reject';reason='Kapaktan/bölümden okunan toplam soru üst sınırı aşıldı.';}else if(!sequential&&Math.abs(l.x-anchor)>tolerance+1e-9){decision='reject';reason='Sıra/sol kenar doğrulaması başarısız; gövde/şekil içindeki girintili numara.';}if(decision==='accept'){starts.push(ordered.indexOf(l));if(geometry&&expectedNumber===undefined||expectedNumber!==undefined&&number>=expectedNumber)expectedNumber=number+1;}else if(decision==='reject')rejected.push(l);numberDiagnostics.push({page,number,text:l.text,x:l.x,columnEdge:geometry?anchor:col.left,anchor,indent:l.x-anchor,expected,decision,reason,...(geometry?{indentTolerance:tolerance,glyphWidth:geometry.glyphWidth,columnSplit:split}:{})});}const inferredMarkers=new Set<Line>();for(let k=0;k<starts.length-1;k++){const start=starts[k],end=starts[k+1],before=Number(ordered[start].text.match(questionPattern)![1]),after=Number(ordered[end].text.match(questionPattern)![1]);if(after!==before+2||candidates.filter(l=>Number(l.text.match(questionPattern)![1])===before||Number(l.text.match(questionPattern)![1])===after).length!==2)continue;const boundary=inferOCRQuestionBoundary(ordered.slice(start,end));if(!boundary)continue;const at=ordered.indexOf(boundary),marker={...boundary,text:'Soru '+(before+1)+'. '+boundary.text};ordered[at]=marker;inferredMarkers.add(marker);starts.splice(k+1,0,at);numberDiagnostics.push({page,number:before+1,text:marker.text,x:marker.x,columnEdge:anchor,anchor,indent:marker.x-anchor,expected:before+1,decision:'infer',reason:'İki ardışık şık grubu, sütun sol kenarında gövde ve tek numara boşluğu.'});k++;}for(const l of rejected){const i=ordered.indexOf(l),end=ordered.findIndex((n,j)=>j>i&&questionPattern.test(n.text)&&!codeLines.has(n));const segment=ordered.slice(i,end<0?ordered.length:end);const id=crypto.randomUUID(),reason=numberDiagnostics.find(d=>d.text===l.text&&d.x===l.x)!.reason;let region:Region|undefined;if(context.recoverRejected!==false&&segment.filter(x=>optionPattern.test(x.text)).length>=2)region=analyzePage(segment,page,repeated,true,{recoverRejected:false}).regions[0];excluded.push({id,page,reason,text:region?.question.text||l.text,question:region?.question});if(region)excludedRegions.push({id,region});}
for(let s=0;s<starts.length;s++){const start=starts[s],end=starts[s+1]??ordered.length;const first=ordered[start],qm=first.text.match(questionPattern)!,cropLimits=questionCropLimits(lines.filter(l=>!possibleChoice(l)),repeated,col.left,col.right,first.y);let block=ordered.slice(start,end);const separated=separateOCRChoiceRun(block);if(separated.remainder.length){block=separated.lines;const marker={...separated.remainder[0],text:'Soru 0. '};const child=analyzePage([marker,...separated.remainder],page,repeated,true,{recoverRejected:false}).regions[0];const id=crypto.randomUUID();if(child){child.question.number=undefined;child.question.warnings=[...(child.question.warnings||[]),'Soru numarası okunamadı; kaynaktan elle doğrulayın.'];excludedRegions.push({id,region:child});}excluded.push({id,page,reason:'Numara okunamadı; ikinci şık dizisi önceki sorudan ayrıldı. Numara çıkarımı yapılmadı.',text:separated.remainder.map(l=>l.text).join(' '),question:child?.question});warnings.push(`Sayfa ${page}, ${qm[1]}. soru: numarasız sonraki blok ayrı incelemeye alındı; kaynak sınırlarını kontrol edin.`);}const cutoff=block.findIndex(l=>keyHeader.test(l.text)||/^(?:doğru\s*(?:cevap|yanıt)|cevap|yanıt)\s*[:.]/i.test(l.text));let answer:number|null=null;if(cutoff>=0){const a=block[cutoff].text.match(/(?:cevap|yanıt)\s*[:.]\s*([A-E])/i);if(a)answer=a[1].toUpperCase().charCodeAt(0)-65;block=block.slice(0,cutoff);}const repaired=repairOptionSequence(block,col.lines.some(l=>/^E[).]/.test(l.text))?5:4);block=repaired.lines;const opts=block.filter(l=>optionPattern.test(l.text));if(!opts.length&&clean.some(l=>l.y<first.y&&/^(?:aç[ıiİ]klamalar|tal[ıiİ]matlar|s[ıiİ]nav kurallar[ıiİ])\s*[:.]?$/i.test(l.text))&&!/^Soru\s*\d/i.test(first.text)){excluded.push({id:crypto.randomUUID(),page,reason:'Numaralı talimat maddesi; şık yok.',text:block.map(l=>l.text).join(' ')});continue;}if(opts.length<2&&!includePartial){if(qm[2].trim())warnings.push(`Sayfa ${page}, ${qm[1]}. soru: seçenek sınırları okunamadı; elle kontrol edin.`);continue;}const lastLabel=Math.max(-1,...opts.map(o=>o.text.match(optionPattern)![1].charCodeAt(0)-65));if(lastLabel>4)continue;const textParts:Line[]=[sliceTextLine(first,first.text.length-qm[2].length)],optionText=Array.from({length:lastLabel+1},()=>''),optionBoxes:(Box|null)[]=Array.from({length:lastLabel+1},()=>null);let oi=-1,lastY=first.y;const firstOptionY=opts.length?Math.min(...opts.map(o=>o.y)):.94;let regionStemBottom:number|undefined;let bottom=Math.min(cropLimits.bottom,(ordered[end]?.y??.96)-.010);const boundary=lines.filter(l=>!repaired.repairs.some(r=>Math.abs(l.x-r.x)<1e-8&&Math.abs(l.y-r.y)<1e-8)&&l.y>Math.max(first.y,...opts.map(o=>o.y))&&l.y<bottom&&l.x+l.w>col.left&&l.x<col.right&&(!/^\d{1,3}$/.test(l.text.trim())||l.x<=col.left+(col.right-col.left)*.85)&&(layoutNoise(l,repeated)&&(!isWatermark(l.text)||isMargin(l))||isAnswerBoundary(l.text)||keyHeader.test(l.text))).sort((a,b)=>a.y-b.y)[0];if(boundary)bottom=Math.min(bottom,boundary.y-.008);const optionAnchor=opts.length?Math.min(...opts.map(o=>o.x)):col.right;for(const l of block.slice(1)){if(l.y>=bottom)break;const om=l.text.match(optionPattern);if(om){oi=om[1].charCodeAt(0)-65;optionText[oi]=om[2];lastY=l.y;continue;}if(oi<0){textParts.push(l);lastY=l.y;}else {const completedFive=oi===4&&new Set(opts.map(o=>o.text.match(optionPattern)![1])).size===5;const nextBodyAfterChoices=completedFive&&l.x<optionAnchor-Math.max(l.ocrGeometry?.glyphWidth||0,.012)&&l.y-lastY>.02;if(nextBodyAfterChoices||(l.y-lastY>.045&&!opts.some(o=>!o.text.match(optionPattern)![2].trim()))||isAnswerBoundary(l.text)){if(!isAnswerBoundary(l.text))warnings.push(`Sayfa ${page}, ${qm[1]}. soru: şık sonrası uzak metin ayrıldı; son şık sınırını kontrol edin.`);bottom=Math.min(bottom,l.y-.008);break;}optionText[oi]+=' '+l.text;lastY=l.y;}}
const cellBottom=bottom;const optionCells:(Box|null)[]=optionText.map(()=>null);const graphicalOptions=opts.some(o=>!o.text.match(optionPattern)![2].trim());if(opts.length&&!graphicalOptions){const content=block.filter(l=>l.y<bottom&&!layoutNoise(l,repeated)&&!isAnswerBoundary(l.text));bottom=Math.min(bottom,Math.max(...content.map(l=>l.y+l.h))+(graphicalOptions?.025:.012));}
const optionContent:(Box|null)[]=optionText.map(()=>null);const optionMarks:(TextMark[]|null)[]=optionText.map(()=>null);
for(const o of opts){const i=o.text.match(optionPattern)![1].charCodeAt(0)-65;const row=opts.filter(n=>Math.abs(n.y-o.y)<.006).sort((a,b)=>a.x-b.x);const same=row.find(n=>n.x>o.x+.01);const prevRow=opts.filter(n=>n.y<o.y-.006).sort((a,b)=>b.y-a.y)[0];const next=opts.filter(n=>n.y>o.y+.006).sort((a,b)=>a.y-b.y)[0];const x=Math.max(col.left,o.x-.003),cellRight=same?same.x-.003:col.right;const y=Math.max(o.y-.002,prevRow?prevRow.y+prevRow.h+.0005:0);const lower=Math.min(bottom,next?Math.max(o.y+o.h,next.y-.002):bottom);const owned=block.filter(l=>(l===o||!optionPattern.test(l.text))&&l.y>=o.y-.004&&l.y<lower&&l.x>=o.x-.015&&l.x<cellRight&&!layoutNoise(l,repeated)&&!isAnswerBoundary(l.text));const om=o.text.match(optionPattern)!;const body=owned.map(l=>l===o?sliceTextLine(l,l.text.length-om[2].length):l);const formatted=composeTextLines(body);optionText[i]=formatted.text;optionMarks[i]=formatted.marks;
// Text choices have a tight content bound. Empty labels reserve their whole cell for figures.
const textOnly=!!om[2].trim();const rightEdge=textOnly?Math.min(cellRight,Math.max(o.x+o.w,...owned.map(l=>l.x+l.w))+.004):cellRight;const contentBottom=textOnly?Math.min(lower,Math.max(o.y+o.h,...owned.map(l=>l.y+l.h))+.002):lower;optionBoxes[i]={x,y,w:Math.max(.015,rightEdge-x),h:Math.max(.008,contentBottom-y)};optionCells[i]={x,y,w:Math.max(.015,cellRight-x),h:Math.max(.008,(next?Math.min(cellBottom,next.y-.002):cellBottom)-y)};}
for(const o of opts){const i=o.text.match(optionPattern)![1].charCodeAt(0)-65,cell=optionCells[i];if(!cell)continue;const token=o.ocrTokens?.[0];const markerEnd=token&&/^[a-e][).:\-]?$/.test(token.text.toLowerCase())?token.x+token.w:o.x+(o.ocrGeometry?.glyphWidth||.009)*2;const bodyToken=o.ocrTokens?.find((t,j)=>j>0&&t.x>=markerEnd);const x=Math.max(cell.x,markerEnd+.003);if(cell.x+cell.w-x>.008&&(!bodyToken||x<bodyToken.x+bodyToken.w*.1))optionContent[i]={...cell,x,w:cell.x+cell.w-x};}const firstChoiceX=Math.min(...opts.map(o=>o.x));const glyph=first.ocrGeometry?.glyphWidth||0;const sideCode=glyph&&firstChoiceX-first.x>glyph*5?block.filter(l=>l.y>=firstOptionY&&l.y<bottom&&l.x<firstChoiceX-glyph&&!optionPattern.test(l.text)):[];if(sideCode.length>=2&&sideCode.some(l=>/[;{}]|\b(?:if|return|printf)\b/.test(l.text))){textParts.push(...sideCode);regionStemBottom=Math.min(bottom,Math.max(...sideCode.map(l=>l.y+l.h))+.012);}
const stemText=composeTextLines(textParts);
 const optionTextSuggestions=inferMissingOptionText(block,opts,optionText,repeated);
const q:Question={id:crypto.randomUUID(),number:Number(qm[1]),text:stemText.text,textMarks:stemText.marks,options:optionText,optionMarks,correct:answer,page,reviewed:false,visual:true,sourcePages:[page],detectedOptions:new Set(opts.map(o=>o.text.match(optionPattern)![1])).size,warnings:[],...(optionTextSuggestions.length?{optionTextSuggestions}:{})};if(inferredMarkers.has(first))q.warnings!.push('numara sıradan çıkarıldı; kaynak sınırlarını doğrulayın');if((first as any)[GROUP_NUMBER])q.warnings!.push('Numara OCR\'da okunamadı; komşu numaralar ve şık koşusu geometrisinden çıkarıldı (numara sıradan çıkarıldı); kaynak sınırlarını doğrulayın.');if((first as any)[MERGED_NUMBER])q.warnings!.push('Numara noktası okunamadı; ayrı satırdaki sayı soru numarası olarak birleştirildi (numara sıradan çıkarıldı); kaynak sınırlarını doğrulayın.');q.warnings!.push(...repaired.repairs.map(r=>'Sıra çıkarımı: '+r.letter+' şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin.'),...duplicateOptionWarnings(q.options));if(opts.length!==q.detectedOptions)q.warnings!.push('Tekrarlanan şık harfleri var; seçenek sırasını kontrol edin.');const x=Math.min(col.left,first.x-.004),y=Math.max(cropLimits.top,first.y-.003);const stemBottom=regionStemBottom??Math.min(firstOptionY-.006,bottom),stemRight=sideCode.length?Math.min(col.right,firstChoiceX-.006):col.right;const stemReliable=opts.length>0&&stemBottom>y+.012&&stemRight>x+.03;const region:Region={question:q,stem:{x,y,w:Math.max(.03,stemRight-x),h:Math.max(.012,stemBottom-y)},options:optionBoxes,optionCells,optionContent,whole:{x,y,w:col.right-x,h:Math.max(.025,bottom-y)},lastContentY:lastY,stemReliable};
const owns=(box:Box,img:Box)=>img.x+img.w/2>=box.x&&img.x+img.w/2<=box.x+box.w&&img.y+img.h/2>=box.y&&img.y+img.h/2<=box.y+box.h;
const extend=(box:Box,img:Box)=>{const left=Math.max(0,Math.min(box.x,img.x-.0015)),top=Math.max(cropLimits.top,Math.min(box.y,img.y-.0015)),right=Math.min(1,Math.max(box.x+box.w,img.x+img.w+.0015)),lower=Math.min(cropLimits.bottom,(ordered[end]?.y??.96)-.010,Math.max(box.y+box.h,img.y+img.h+.0015));return {x:left,y:top,w:right-left,h:lower-top};};
for(const img of context.graphics||[]){if(owns(region.stem,img)){region.stem=extend(region.stem,img);region.whole=extend(region.whole,img);}else for(let i=0;i<optionCells.length;i++){const cell=optionCells[i];if(cell&&owns(cell,img)){optionCells[i]=extend(cell,img);optionBoxes[i]=extend(optionBoxes[i]||cell,img);region.whole=extend(region.whole,img);break;}}}if(inferredMarkers.has(first)){const id=crypto.randomUUID();q.number=undefined;q.warnings=[...(q.warnings||[]),'Numarası okunamadı; otomatik soru olarak uygulanmadı.'];excludedRegions.push({id,region});excluded.push({id,page,reason:'Numara boşluğu için ayrılan blok; yer tutucuya öğretmen önerisi olarak bağlanır.',text:q.text,question:q});}else regions.push(region);}}
const firstY=regions.length?Math.min(...regions.map(r=>r.whole.y)):undefined;return {regions,warnings,excluded,excludedRegions,numberDiagnostics,firstY,answerKey:extractAnswerKey(lines.map(l=>l.text).join('\n')),expected:expectedCount(lines.map(l=>l.text).join(' '))};}
export function numberWarnings(questions:Question[],expected?:number,sections?:Section[]){const warnings:string[]=[];if(expected&&questions.length!==expected)warnings.push(`Belgede ${expected} soru yazıyor; ${questions.length} soru çıkarıldı. Eksik/tekrar soruları kontrol edin.`);const groups=sections?.length?sections.map(s=>({name:s.name,qs:questions.filter(q=>q.sectionId===s.id),expected:s.expectedCount,from:s.firstNumber??1})):[{name:'Sınav',qs:questions,expected:undefined,from:1}];for(const group of groups){const numbers=group.qs.map(q=>q.number).filter((n):n is number=>n!==undefined),set=new Set(numbers);if(set.size<numbers.length)warnings.push(group.name+': bölüm içinde tekrarlanan soru numaraları var.');const max=group.expected?group.from+group.expected-1:Math.max(0,...numbers);if(max<=300){const missing=Array.from({length:Math.max(0,max-group.from+1)},(_,i)=>group.from+i).filter(n=>!set.has(n));if(missing.length)warnings.push(group.name+': eksik soru numaraları: '+missing.join(', ')+'.');}if(group.expected&&group.qs.length!==group.expected)warnings.push(`${group.name}: ${group.qs.length}/${group.expected} soru algılandı.`);}return warnings;}
// Numara dizisinde boşluk varken önceki sorunun kutusu atlanan soruların metin/şıklarını yutmuş olabilir (sessiz yanlış eşleşme); öğretmen onaylayana kadar sınır uyarısı verir.
export function gapBoundaryWarnings(questions:Question[],expected?:number,sections?:Section[]):Question[]{const note=new Map<string,string>();const groups=sections?.length?sections.map(s=>({qs:questions.filter(q=>q.sectionId===s.id),expected:s.expectedCount,from:s.firstNumber??1})):[{qs:questions,expected,from:1}];for(const g of groups){const last=g.expected?g.from+g.expected-1:undefined;const numbered=g.qs.filter(q=>Number.isInteger(q.number)).sort((a,b)=>a.number!-b.number!);numbered.forEach((q,i)=>{const next=numbered[i+1],nextNumber=next?next.number!:last!==undefined&&last>q.number!&&last<=300?last+1:undefined;if(nextNumber!==undefined&&nextNumber>q.number!+1)note.set(q.id,`Sonraki soru numarası atlanıyor (${q.number} → ${next?nextNumber:'eksik'}); bu soru başka soru içeriği (metin veya şık) içerebilir, kaynak PDF ile karşılaştırın.`);});}return note.size?questions.map(q=>note.has(q.id)&&!q.warnings?.includes(note.get(q.id)!)?{...q,warnings:[...(q.warnings||[]),note.get(q.id)!]}:q):questions;}
export function attachKeys(questions:Question[],keys:Record<number,number>){return applyAnswerKey(questions,keys);}

const lessonPattern=/(TÜRKÇE|MATEMAT[İI]K|FEN B[İI]L[İI]MLER[İI]|SOSYAL B[İI]LG[İI]LER|[İI]NG[İI]L[İI]ZCE)/i;
export function sectionHeading(lines:Line[]){return lines.filter(l=>l.y<.12).map(l=>l.text).find(t=>lessonPattern.test(t)&&/TEST[İI]|BÖLÜMÜ/i.test(t))?.match(lessonPattern)?.[1];}
// Kapaktaki "DERS ADI / SAYFA" tablosu ve "Her ders için N soru" cümlesi: okul dersi olmayan bölümler (örn. mesleki sertifika dersleri).
// Bölümler başlangıç sayfasına (SAYFA sütunu) göre sıralanır; her sayfa numarası bulunamazsa ya da toplam "Soru Sayısı" ile çelişirse bölüm çıkarılmaz.
export function tableSections(lines:Line[],text=lines.map(l=>l.text).join(' ')):Section[]{
 const header=lines.find(l=>/DERS\s*ADI/i.test(l.text));if(!header)return [];
 const stop=lines.filter(l=>l.y>header.y+.02&&/her\s+ders\s+i[çc]in\s*\d|bulunmaktad[ıi]r/i.test(l.text)).sort((a,b)=>a.y-b.y)[0],count=Number(stop?.text.match(/her\s+ders\s+i[çc]in\s*(\d{1,3})\s*soru/i)?.[1]);
 if(!stop||!(count>0&&count<=300))return [];
 const body=lines.filter(l=>l.y>header.y+.008&&l.y<stop.y-.004),names=body.filter(l=>/^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ .'’\-]{3,}$/.test(l.text.trim())&&!/DERS\s*ADI|SAYFA/.test(l.text)),nums=body.filter(l=>/^\d{1,3}$/.test(l.text.trim()));
 if(names.length<2||names.length>50)return [];
 const rows=names.map(n=>{const nextX=Math.min(Infinity,...names.filter(m=>m!==n&&Math.abs(m.y-n.y)<.012&&m.x>n.x).map(m=>m.x)),cell=nums.filter(x=>Math.abs(x.y-n.y)<.012&&x.x>n.x&&x.x<nextX).sort((a,b)=>a.x-b.x)[0];return {name:n.text.trim().replace(/\s+/g,' '),page:cell?Number(cell.text):NaN};});
 if(rows.some(r=>!Number.isInteger(r.page))||new Set(rows.map(r=>r.page)).size!==rows.length||new Set(rows.map(r=>r.name)).size!==rows.length)return [];
 const declared=text.match(/soru\s*say[ıi]s[ıi]\s*[:：]\s*(\d{1,3})(?!\d)/i)?.[1];if(declared&&Number(declared)!==count*rows.length)return [];
 return rows.sort((a,b)=>a.page-b.page).map((r,i)=>({id:'section-'+(i+1),name:r.name,order:i,expectedCount:count}));
}
// Bölüm başlığı olmayan, belge boyunca sürekli numaralı sınavlarda: kapak tablosundaki sıra ve soru sayılarından numara aralığı → bölüm.
// Yalnız tüm bölümlerin sayısı biliniyorsa, toplam beklenen sayıya eşitse, hiçbir soru henüz bölümlenmemişse ve numaralar benzersiz/aralıktaysa uygulanır.
export function assignSectionRanges(questions:Question[],sections:Section[],expected?:number):boolean{
 if(sections.length<2||!expected||sections.some(s=>!s.expectedCount)||sections.reduce((n,s)=>n+s.expectedCount!,0)!==expected)return false;
 if(!questions.length||questions.some(q=>q.sectionId||!Number.isInteger(q.number)||q.number!<1||q.number!>expected))return false;
 if(new Set(questions.map(q=>q.number)).size!==questions.length)return false;
 const ordered=sections.slice().sort((a,b)=>a.order-b.order);let from=1;for(const s of ordered){s.firstNumber=from;from+=s.expectedCount!;}
 for(const q of questions)q.sectionId=ordered.find(s=>q.number!>=s.firstNumber!&&q.number!<s.firstNumber!+s.expectedCount!)?.id;
 return true;
}
export function coverMetadata(lines:Line[]){const text=lines.map(l=>l.text).join(' '),sections:Section[]=[];if(!/DERS ADI/i.test(text)||!/SORU SAYISI/i.test(text)){if(!/K[İI]TAPÇIK TÜRÜ/i.test(text)||!/GENEL AÇIKLAMA/i.test(text)){const minutes=text.match(/cevaplama\s*süresi\s*(?:toplam\s*)?(\d{1,3})\s*dak/i);return minutes?{duration:Number(minutes[1])}:{};}const count=text.match(/yer alan\s*(\d[\d\s]{0,5})\s*adet\s*soru/i),minutes=text.match(/cevaplama\s*süresi\s*(?:toplam\s*)?(\d[\d\s]{0,5})\s*dak/i);return {expectedCount:count?Number(count[1].replace(/\s/g,'')):undefined,duration:minutes?Number(minutes[1].replace(/\s/g,'')):undefined,booklet:lines.find(l=>/^[AB]$/.test(l.text.trim()))?.text.trim()};}for(const l of lines){const name=l.text.match(lessonPattern)?.[1];if(!name||l.y<.2)continue;const same=lines.filter(n=>Math.abs(n.y-l.y)<.009&&n.x>l.x&&/^\d{1,3}$/.test(n.text.trim())).sort((a,b)=>a.x-b.x)[0];const inline=l.text.match(/\s(\d{1,3})\s*$/);const count=Number(inline?.[1]||same?.text);if(count>0&&count<=300&&!sections.some(s=>s.name===name))sections.push({id:'section-'+(sections.length+1),name,order:sections.length,expectedCount:count});}if(!sections.length)sections.push(...tableSections(lines,text));const header=lines.find(l=>/TOPLAM SORU/i.test(l.text));const durationHeader=lines.find(l=>/SINAV SÜRES[İI]/i.test(l.text));const sum=sections.reduce((n,s)=>n+(s.expectedCount||0),0);const totalCell=header&&lines.find(l=>l.y>header.y&&l.y<header.y+.12&&l.x>header.x&&l.x<(lines.find(n=>/\(DAK[İI]KA\)/i.test(n.text))?.x??1)&&/^\d{1,3}$/.test(l.text.trim()));const durationAnchor=lines.find(l=>/\(DAK[İI]KA\)/i.test(l.text));const durationCell=durationHeader&&lines.filter(l=>l.y>durationHeader.y&&l.y<durationHeader.y+.12&&l.x>(durationAnchor?.x??durationHeader.x+.15)&&l.x<(durationAnchor?durationAnchor.x+.15:1)&&/^\d{1,3}$/.test(l.text.trim())).sort((a,b)=>a.x-b.x)[0];const bookletLabel=lines.find(l=>/K[İI]TAPÇIK TÜRÜ/i.test(l.text));const booklet=bookletLabel&&lines.filter(l=>/^[AB]$/.test(l.text.trim())&&l.y<bookletLabel.y&&Math.abs(l.x-bookletLabel.x)<.12).sort((a,b)=>b.y-a.y)[0]?.text;return {sections:sections.length?sections:undefined,expectedCount:sum|| (totalCell?Number(totalCell.text):undefined),duration:durationCell?Number(durationCell.text):Number(text.match(/s[ıi]nav\s*süres[ıi]\s*[:：]\s*(\d{1,3})\s*dak/i)?.[1])||undefined,booklet};}
// Cevap anahtarı sayfasında OCR çoğu kez yalnız numaraları okur, tek harfleri düşürür. Çıplak numara satırları x'e göre
// sütunlanır (≥6 satır); her sütun için harfleri de içeren bir okuma bandı döner (normalize koordinat).
// Cevap anahtarı sayfasının metni. OCR başlığı iki parça okuyup ("B TEST KİTAPÇIĞI" solda, "CEVAP ANAHTARI" sağ sütunun tepesinde) sütun sırası
// başlığı soldaki cevapların ardına koyarsa, answerKeyInfo yalnız başlıktan sonrasını aldığı için o cevaplar düşerdi. Başlık, kendinden önce gelen
// tüm "N. X" satırlarının üstündeyse (sayfanın üst bandında) metnin başına alınır; aksi halde okuma sırası aynen korunur.
export function answerKeyPageText(lines:Line[]){const ordered=pageReadingOrder(lines),heading=ordered.findIndex(l=>/(?:cevap|yanıt)\s*anahtar[ıiİ]|answer\s*key/i.test(l.text));if(heading>0){const rows=ordered.slice(0,heading).filter(l=>/^\d{1,3}\s*[-.:)]?\s*\(?[A-E]\)?$/i.test(l.text.trim()));if(rows.length&&rows.every(l=>l.y>=ordered[heading].y-.006))return [ordered[heading],...ordered.slice(0,heading),...ordered.slice(heading+1)].map(l=>l.text).join('\n');}return ordered.map(l=>l.text).join('\n');}
export function keyNumberColumns(lines:Line[]):{x:number;x0:number;x1:number;y0:number;y1:number}[]{
 const nums=lines.filter(l=>/^\d{1,3}\s*[.,)]?$/.test(l.text.trim())&&l.w<.06&&l.h<.04).sort((a,b)=>a.x-b.x),groups:Line[][]=[];
 for(const l of nums){const g=groups.find(g=>Math.abs(g[0].x-l.x)<.03||Math.abs(g[0].x+g[0].w-l.x-l.w)<.012);if(g)g.push(l);else groups.push([l]);}
 const cols=groups.filter(g=>g.length>=6).map(g=>({x:Math.min(...g.map(l=>l.x)),right:Math.max(...g.map(l=>l.x+l.w)),y0:Math.min(...g.map(l=>l.y)),y1:Math.max(...g.map(l=>l.y+l.h))})).sort((a,b)=>a.x-b.x);
 const top=Math.max(0,...lines.filter(l=>/CEVAP\s*ANAHTAR|YANIT\s*ANAHTAR|ANSWER\s*KEY/i.test(l.text)).map(l=>l.y+l.h));
 return cols.map((c,i)=>({x:c.x,x0:Math.max(0,c.x-.04),x1:Math.min(1,i+1<cols.length?cols[i+1].x-.04:c.right+.16),y0:Math.max(top,.02),y1:Math.min(1,Math.max(c.y1+.03,.95))}));
}
export function classifyPage(lines:Line[]){const text=lines.map(l=>l.text).join(' ');if(!text.trim())return {kind:'blank' as const,reason:'Metin katmanı/OCR boş.'};if(/CEVAP\s*ANAHTAR[İI]|YANIT\s*ANAHTAR[İI]|ANSWER\s*KEY/i.test(text))return {kind:'answer-key' as const,reason:'Cevap anahtarı başlığı.'};if(/K[İI]TAPÇIK TÜRÜ/i.test(text)&&/GENEL AÇIKLAMA/i.test(text)||/DERS ADI/i.test(text)&&/SORU SAYISI/i.test(text))return {kind:'cover' as const,reason:'Ders ve soru sayısı tablosu.'};if(/ADAYLARIN D[İI]KKAT[İI]NE|SINAV(?:DA| SÜRES[İI]NCE)?(?: UYULACAK)? KURALLAR[İI]?|AÇIKLAMALAR|TAL[İI]MATLAR/i.test(text)&&!lines.some(l=>optionPattern.test(l.text)))return {kind:'instructions' as const,reason:'Talimat başlığı ve çoktan seçmeli şık bulunmaması.'};return {kind:'questions' as const,reason:'Soru/şık adayları; blok düzeyinde ayrıca doğrulanır.'};}
