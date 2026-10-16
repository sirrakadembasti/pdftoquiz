import {bindProtectedImages,protectedImages,imageSignature,type Question} from './quiz';
import {manualPatch} from './hybrid';
type CropInput={target:string;source:string;safe:string;page:number;box?:{x:number;y:number;w:number;h:number};option?:{image?:string;incomplete:boolean;risk:boolean;markerKnown:boolean}};
export function applyEditorCrop(q:Question,crop:CropInput):Question{
 const old=protectedImages(q),meta={source:'manual' as const,confidence:1,warningCodes:['RED_CONTENT_REVIEW'],page:crop.page,box:crop.box,locked:true};
 if(crop.target==='question')return bindProtectedImages(manualPatch(q,{image:crop.source,stemImage:crop.source,studentStemImage:crop.safe,stemProtection:imageSignature(crop.source),visual:true,imageIncludesOptions:false,provenance:{...q.provenance,image:meta}}),crop.safe,old.options);
 const i=Number(crop.target);if(!Number.isInteger(i)||i<0||i>=q.options.length)throw new Error('Geçerli bir şık görseli hedefi seçin.');
 const images=q.options.map((_,j)=>j===i?crop.source:q.optionImages?.[j]||null),safe=q.options.map((_,j)=>j===i?crop.option?.image||null:old.options[j]||null),incomplete=crop.option?.incomplete?[...new Set([...(q.incompleteOptionImages||[]),i])]:(q.incompleteOptionImages||[]).filter(j=>j!==i);
 const next=manualPatch(q,{optionImages:images,optionImageApprovals:q.options.map((_,j)=>j===i?null:q.optionImageApprovals?.[j]||null),markerFreeOptions:!!crop.option?.markerKnown&&safe.every(Boolean),incompleteOptionImages:incomplete,penInkRisk:q.penInkRisk||crop.option?.risk,provenance:{...q.provenance,['optionImages.'+i]:{...meta,warningCodes:[...(crop.option?.risk?['KALEM_IZI_METIN']:[]),...(crop.option?.markerKnown?[]:['MISSING_OPTION_MARKER'])]}}});
 return bindProtectedImages(next,old.image,safe);
}
