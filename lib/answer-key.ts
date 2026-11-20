import type {Exam} from './quiz';
import {manualPatch} from './hybrid';
import {keyBooklet} from './quiz';

export type AnswerDisplayRow={id?:string;section:string;number:number;current:number|null;detected?:number;warning?:string;page?:number};
export function answerKeyDisplayRows(e:Exam):AnswerDisplayRow[]{
 const rows:AnswerDisplayRow[]=[],groups=(e.sections||[]).slice().sort((a,b)=>a.order-b.order).map(s=>({id:s.id,name:s.name,expected:s.expectedCount??(e.sections?.length===1?e.expectedCount:undefined)}));if(e.questions.some(q=>!q.sectionId||!groups.some(s=>s.id===q.sectionId))||!groups.length)groups.push({id:'',name:'Sorular',expected:groups.length?undefined:e.expectedCount});
 const effectiveNumber=(q:Exam['questions'][number])=>q.number??e.questions.indexOf(q)+1;
 for(const group of groups){const questions=e.questions.filter(q=>group.id?q.sectionId===group.id:!q.sectionId||!e.sections?.some(s=>s.id===q.sectionId));const count=Math.min(300,Math.max(group.expected||0,...questions.map(effectiveNumber),0));
 for(let n=1;n<=count;n++){const matches=questions.filter(q=>effectiveNumber(q)===n);for(const q of matches.length?matches:[undefined]){const key=e.pdfAnswerKey?.keys[n],global=e.questions.filter(q=>effectiveNumber(q)===n),mismatch=!!e.booklet&&!!e.pdfAnswerKey?.booklet&&e.booklet!==e.pdfAnswerKey.booklet;let warning=!q?'Soru henüz okunamadı / oluşturulmadı.':matches.length>1?'Soru numarası bu bölümde tekrarlanıyor.':undefined;const valid=Number.isInteger(key)&&key!>=0&&key!<(q?.options.length||0)&&global.length===1&&!mismatch&&!e.pdfAnswerKey?.conflicts?.includes(n);if(key!=null&&!valid)warning=warning||'PDF cevabı belirsiz; bölüm, kitapçık veya şık sayısını kontrol edin.';rows.push({id:q?.id,section:group.name,number:n,current:q?.correct??null,detected:valid?key:undefined,warning,page:q?.page});}}
 }return rows;
}

export function applyDetectedPdfAnswers(e:Exam):Exam{
 const answers=new Map(answerKeyDisplayRows(e).flatMap(row=>row.id&&row.detected!=null?[[row.id,row.detected] as const]:[]));
 return {...e,questions:e.questions.map(q=>answers.has(q.id)&&q.correct!==answers.get(q.id)?manualPatch(q,{correct:answers.get(q.id)!,reviewed:false}):q)};
}

export type KeyEntry={number:number;letter:string;sectionName?:string;sequential?:boolean};
export type ParsedKey={entries:KeyEntry[];warnings:string[];booklet?:string;format:'table'|'sections'|'simple';columns:string[]};
export type KeyRow={id?:string;section:string;sourceSection?:string;number:number;letter:string;previous?:number|null;index?:number;entryIndex:number;error?:string};
export type KeyPreview={rows:KeyRow[];warnings:string[];canApply:boolean;booklet?:string;format:ParsedKey['format'];columns:string[];missing:string[];matched:number;targetCount:number;signature:string};
export type KeyMapping={sectionMap?:Record<string,string>;letters?:Record<number,string>};
export function keyName(value:string){const s=value.toLocaleUpperCase('tr').normalize('NFD').replace(/\p{M}/gu,'').replace(/\b(?:TESTI|TEST|DERSI|DERS|BOLUMU|CEVAP|ANAHTARI)\b/g,'').replace(/[^A-Z0-9]/g,'');return ({FEN:'FENBILIMLERI',FENBILGISI:'FENBILIMLERI',SOSYAL:'SOSYALBILGILER'} as Record<string,string>)[s]||s;}
const clean=(s:string)=>s.replace(/[*_`]/g,'').replace(/[“”"']/g,'').trim();
export {keyBooklet};
const isNo=(s:string)=>/^(?:SORU\s*(?:NO|NUMARASI|NUMARASI\/NO)?|NO|QUESTION\s*(?:NO|NUMBER))\.?$/i.test(clean(s));
function cells(line:string):string[]|null{if(line.includes('|'))return line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(clean);if(line.includes('\t'))return line.split('\t').map(clean);if(/[;,]/.test(line))return line.split(/[;,]/).map(clean);const spaces=line.split(/\s{2,}/).map(clean);return spaces.length>1?spaces:null;}
function pairs(text:string){return [...text.matchAll(/(?<!\d)(\d{1,3})\s*[-.:)]?\s*\(?([A-Z])\)?(?=\s|[,;|]|$|\d)/g)].map(m=>({number:Number(m[1]),letter:m[2]}));}
function noise(line:string){return !line||/^[\s|:\-]+$/.test(line)||/CEVAP\s*ANAHTAR|KITAPCI|KITAPCIK|KITAPÇI|KITAPÇIK|BURSLULUK|NISAN|NİSAN|SINAVI|YAPILAN|ORTAOGRETIM|ORTAÖĞRETİM|^\d+\.\s*SINIF/.test(line);}
export function parseAnswerKey(input:string):ParsedKey{
 const raw=input.replace(/\r/g,'').replace(/\u00a0/g,' '),lines=raw.split('\n').map(l=>l.trim()).filter(Boolean),warnings:string[]=[],entries:KeyEntry[]=[],columns:string[]=[];let format:ParsedKey['format']='simple';
 const rows=lines.map(cells);const headerAt=rows.findIndex(r=>r&&r.some(isNo)&&r.length>1);
 if(headerAt>=0){format='table';const header=rows[headerAt]!,numberColumn=header.findIndex(isNo);header.forEach((name,i)=>{if(i!==numberColumn)columns.push(name);});for(let i=headerAt+1;i<lines.length;i++){if(noise(clean(lines[i]).toUpperCase()))continue;const row=rows[i];if(!row){warnings.push(`Tablo satırı ${i+1} sütunlara ayrılamadı.`);continue;}if(row.every(c=>/^[:\-\s]*$/.test(c)))continue;if(row.length!==header.length){warnings.push(`Tablo satırı ${i+1}: ${header.length} sütun bekleniyor; ${row.length} okundu.`);}
 const number=Number(clean(row[numberColumn]||'').replace(/[.)]$/,''));if(!Number.isInteger(number)||number<1||number>300){warnings.push(`Tablo satırı ${i+1}: soru numarası geçersiz.`);continue;}for(let col=0;col<header.length;col++){if(col===numberColumn)continue;const letter=clean(row[col]||'').toUpperCase();entries.push({number,letter,sectionName:header[col]});}}
 }else{
  let sectionName:string|undefined;for(const line of lines){const cleaned=clean(line).toUpperCase();if(noise(cleaned))continue;const found=pairs(cleaned);if(found.length){const rest=cleaned.replace(/(?<!\d)(\d{1,3})\s*[-.:)]?\s*\(?([A-Z])\)?(?=\s|[,;|]|$|\d)/g,'').replace(/[\s,;|]+/g,'');if(rest)warnings.push('Okunamayan anahtar metni var: '+rest.slice(0,80));entries.push(...found.map(e=>({...e,sectionName})));continue;}
  const compact=cleaned.replace(/\s/g,'');const knownHeading=/^(TURKCE|MATEMATIK|FENBILIMLERI|SOSYALBILGILER|INGILIZCE)$/.test(keyName(cleaned));if(!knownHeading&&/^[A-Z\s]+$/.test(cleaned)&&(/^[A-E\s]+$/.test(cleaned)||compact.length<=2||(compact.match(/[A-E]/g)||[]).length/compact.length>=.75)){entries.push(...cleaned.replace(/\s/g,'').split('').map((letter,i)=>({number:i+1,letter,sectionName,sequential:!sectionName})));continue;}
  if(/^[\p{L}\s]+[:：]?$/u.test(cleaned)){sectionName=cleaned.replace(/[:：]$/,'').trim();format='sections';if(!columns.includes(sectionName))columns.push(sectionName);continue;}warnings.push('Okunamayan anahtar metni var: '+cleaned.slice(0,80));}
 }
 return {entries,warnings:[...new Set(warnings)],booklet:keyBooklet(raw),format,columns};
}
export function keySignature(e:Exam){return JSON.stringify({booklet:e.booklet,sections:e.sections?.map(s=>[s.id,s.name]),questions:e.questions.map(q=>[q.id,q.sectionId,q.number,q.options.length,q.correct])});}
export function bulkKeyPreview(e:Exam,input:string,sectionId='*',booklet='',mapping:KeyMapping={}):KeyPreview{
 const parsed=parseAnswerKey(input),warnings=[...parsed.warnings],rows:KeyRow[]=[],used=new Set<string>();const selected=e.questions.filter(q=>sectionId==='*'||(q.sectionId||'')===sectionId);const effectiveBooklet=booklet||parsed.booklet;if(booklet&&parsed.booklet&&booklet!==parsed.booklet)warnings.push(`Seçilen kitapçık ${booklet}, kaynak anahtar ${parsed.booklet}.`);if(effectiveBooklet&&e.booklet&&effectiveBooklet!==e.booklet)warnings.push(`Kitapçık uyuşmazlığı: sınav ${e.booklet}, anahtar ${effectiveBooklet}.`);
 const resolve=(name:string)=>{if(Object.hasOwn(mapping.sectionMap||{},name))return e.sections?.find(s=>s.id===mapping.sectionMap![name]);const matches=e.sections?.filter(s=>keyName(s.name)===keyName(name))||[];return matches.length===1?matches[0]:undefined;};
 for(const [entryIndex,entry] of parsed.entries.entries()){
  const mapped=entry.sectionName?resolve(entry.sectionName):undefined;if(sectionId!=='*'&&mapped&&mapped.id!==sectionId)continue;
  const hasLegacySection=entry.sectionName&&!e.sections?.length&&parsed.columns.length===1&&keyName(entry.sectionName)===keyName(e.subject);
  const scoped=entry.sectionName?(mapped?selected.filter(q=>q.sectionId===mapped.id):hasLegacySection?selected:[]):selected;
  const candidates=entry.sequential&&!entry.sectionName?(scoped[entry.number-1]?[scoped[entry.number-1]]:[]):scoped.filter(q=>q.number===entry.number);
  const q=candidates.length===1?candidates[0]:undefined,letter=(mapping.letters?.[entryIndex]??entry.letter).trim().toUpperCase(),index=letter.charCodeAt(0)-65;
  let error=entry.sectionName&&!mapped&&!hasLegacySection?'Ders başlığı sınavdaki bölümle eşleşmedi.':candidates.length>1?'Numara birden fazla soruya eşleşiyor; bölüm veya soru numarasını düzeltin.':!q?'Eşleşen soru yok.':!/^[A-Z]$/.test(letter)||index<0||index>=q.options.length?'Harf şık sayısının dışında veya okunamadı.':used.has(q.id)?'Tekrarlanan cevap numarası.':undefined;
  if(q)used.add(q.id);rows.push({id:q?.id,section:mapped?.name||entry.sectionName||e.sections?.find(s=>s.id===q?.sectionId)?.name||'Sorular',sourceSection:entry.sectionName,number:q?.number??entry.number,letter,index,previous:q?.correct,entryIndex,error});
 }
 if(rows.length!==selected.length)warnings.push(`Sayı uyuşmazlığı: ${selected.length} soru, ${rows.length} cevap.`);const missing=selected.filter(q=>!rows.some(r=>r.id===q.id&&!r.error)).map(q=>(e.sections?.find(s=>s.id===q.sectionId)?.name||'Sorular')+' '+(q.number??selected.indexOf(q)+1));if(missing.length)warnings.push('Cevabı eşleşmeyen sorular: '+missing.join(', ')+'.');if(rows.some(r=>r.error))warnings.push('Eşleşme tablosundaki hataları düzeltin.');if(!rows.length)warnings.push('Anahtar girin.');return {rows,warnings:[...new Set(warnings)],canApply:rows.length>0&&!warnings.length,booklet:effectiveBooklet,format:parsed.format,columns:parsed.columns,missing,matched:rows.filter(r=>r.id&&!r.error).length,targetCount:selected.length,signature:keySignature(e)};
}
export function applyBulkKey(e:Exam,preview:KeyPreview):Exam{
 if(!preview.canApply||preview.signature!==keySignature(e))throw new Error('Anahtar önizlemesi değişti veya uyarılar var; eşleşmeyi yeniden önizleyin.');const keys=new Map<string,number>();for(const row of preview.rows){const q=e.questions.find(q=>q.id===row.id);if(!q||row.error||row.index===undefined||row.index<0||row.index>=q.options.length||keys.has(q.id))throw new Error('Anahtar önizlemesi geçersiz.');keys.set(q.id,row.index);}return {...e,questions:e.questions.map(q=>keys.has(q.id)?manualPatch(q,{correct:keys.get(q.id)!,reviewed:false}):q)};
}
