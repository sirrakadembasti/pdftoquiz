import {bindProtectedImages,imageSignature,protectedImages,safeStem,optionImageApproved,type Question} from './quiz';
import {manualPatch} from './hybrid';
export {optionImageApproved};
function slot(q:Question,i:number){if(!Number.isInteger(i)||i<0||i>=q.options.length)throw new Error('Geçerli bir şık seçin.');}
export function stageOptionImage(q:Question,i:number,source:string|null):Question{
 slot(q,i);const old=protectedImages(q),images=q.options.map((_,j)=>j===i?source:q.optionImages?.[j]||null),safe=old.options.map((s,j)=>j===i?null:s||null);
 const next=manualPatch(q,{...(q.imageIncludesOptions?{imageIncludesOptions:false,image:q.stemImage}:{}),optionImages:images,optionImageApprovals:q.options.map((_,j)=>j===i?null:q.optionImageApprovals?.[j]||null),incompleteOptionImages:[...(q.incompleteOptionImages||[]).filter(j=>j!==i),...(source?[i]:[])],markerFreeOptions:!!source&&safe.every(Boolean),provenance:{...q.provenance,['optionImages.'+i]:{...q.provenance?.['optionImages.'+i],source:'manual',confidence:1,page:q.provenance?.['optionImages.'+i]?.page||q.page,locked:true,warningCodes:source?['OPTION_IMAGE_UNAPPROVED']:[]}}});
 const bound=bindProtectedImages(next,q.imageIncludesOptions?safeStem(q):old.image,safe);return manualPatch(bound,{studentImage:bound.studentImage,studentOptionImages:bound.studentOptionImages,imageProtection:bound.imageProtection});
}
export function approveOptionImage(q:Question,i:number,safeImage:string):Question{
 slot(q,i);const source=q.optionImages?.[i];if(!source||!safeImage)throw new Error('Önce şık görselini ekleyin ve temizlenmiş önizlemeyi kontrol edin.');
 q=stageOptionImage(q,i,source);
 const old=protectedImages(q),safe=old.options.map((s,j)=>j===i?safeImage:s||null),incomplete=(q.incompleteOptionImages||[]).filter(j=>j!==i);
 const next=manualPatch(q,{optionImageApprovals:q.options.map((_,j)=>j===i?imageSignature(source)+'|'+imageSignature(safeImage):q.optionImageApprovals?.[j]||null),incompleteOptionImages:incomplete,markerFreeOptions:!incomplete.length&&safe.every(Boolean),provenance:{...q.provenance,['optionImages.'+i]:{...q.provenance?.['optionImages.'+i],source:'manual',confidence:1,page:q.provenance?.['optionImages.'+i]?.page||q.page,locked:true,warningCodes:[]}}});
 return bindProtectedImages(next,old.image,safe);
}
