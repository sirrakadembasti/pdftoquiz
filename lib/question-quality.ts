import type {Question} from './quiz';
export type WarningClasses={structural:string[];text:string[];info:string[]};
export function warningClasses(q:Question):WarningClasses{
 const codes=[...new Set([...(q.reading?.warningCodes||[]),...Object.values(q.provenance||{}).flatMap(m=>m.warningCodes||[])])];
 const structural:string[]=[],text:string[]=[],info:string[]=[];
 const scanned=q.provenance?.text?.reading==='ocr';
 if(scanned&&!q.reviewed&&(q.provenance?.text?.ocrConfidence??q.provenance?.text?.confidence??1)<.65)text.push('LOW_OCR');
 if(!scanned&&!q.reviewed){if(q.warnings?.some(w=>!w.startsWith('Aynı metinli şıklar:')))structural.push('LOCAL_WARNING');if(![4,5].includes(q.detectedOptions??q.options.length))structural.push('OPTION_COUNT');}
 if(q.placeholder&&!q.placeholder.resolved)structural.push('UNREADABLE');
 if(!q.reviewed&&q.warnings?.some(w=>/numara sıradan çıkarıldı/i.test(w)))structural.push('NUMBER_INFERENCE');
 if(!q.reviewed&&q.warnings?.some(w=>/ikinci şık|tekrarlanan şık|başka soru|yutul/i.test(w)))structural.push('BOUNDARY');
 if(!q.text.trim()&&!q.image)structural.push('EMPTY_TEXT');
 if(q.options.some((v,i)=>!v.trim()&&!q.optionImages?.[i])&&!(q.image&&q.imageIncludesOptions))structural.push('EMPTY_OPTION');
 if(q.hasFigure&&!q.image&&!q.optionImages?.some(Boolean))structural.push('FIGURE');
 for(const code of codes){
  if(['NUMBER_INFERENCE','BOUNDARY','UNREADABLE','EMPTY_OPTION','HEADER_BAND','FOOTER_BAND','NEIGHBOR_OVERLAP'].includes(code)){if(!q.reviewed||code==='UNREADABLE'&&q.placeholder&&!q.placeholder.resolved)structural.push(code);}
  else if(['LOW_READING','MISSING_OPTION','OPTION_COUNT','TARGETED_OCR','LOW_OCR'].includes(code)){if(!q.reviewed)text.push(code);}
  else if(code==='CODE_CONTENT'){if(!q.reviewed&&((q.reading?.score??1)<.8||q.reading?.missingOptions?.length))text.push(code);else info.push(code);}
  else if(code==='LOCAL_WARNING'){if(!q.reviewed&&q.warnings?.some(w=>/uzak metin|kesil|devam|sınır|eşleşmedi/i.test(w)&&!/^Sıra çıkarımı|^numara sıradan çıkarıldı/i.test(w)))structural.push('BOUNDARY');}
  else info.push(code);
 }
 if(scanned&&!q.reviewed&&(![4,5].includes(q.detectedOptions??q.options.length)||q.options.some(v=>!v.trim())))text.push('OPTION_COUNT');
 return {structural:[...new Set(structural)],text:[...new Set(text)],info:[...new Set(info)]};
}
