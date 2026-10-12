import type {Question} from './quiz';
/** Rendering only. Does not extract text, invoke OCR, save a candidate or approve it. */
export async function renderOptionCandidate(pdf:any,q:Question,index:number):Promise<string>{
 if(!pdf)throw new Error('Kaynak PDF yüklü değil.');
 const meta=q.provenance?.['optionImages.'+index],box=meta?.box;
 if(!box)throw new Error('Bu şıkkın kaynak geometrisi yok; PDF’den elle kırpın veya görsel yükleyin.');
 if(!Number.isInteger(index)||index<0||index>=q.options.length||![box.x,box.y,box.w,box.h].every(Number.isFinite)||box.x<0||box.y<0||box.w<=0||box.h<=0||box.x+box.w>1.000001||box.y+box.h>1.000001)throw new Error('Şık kırpma geometrisi geçersiz.');
 const page=await pdf.getPage(meta.page),v=page.getViewport({scale:250/72});
 if(!Number.isFinite(v.width)||!Number.isFinite(v.height)||v.width<=0||v.height<=0||v.width*v.height>16000000)throw new Error('PDF sayfası yüksek DPI önizlemesi için çok büyük; elle alan seçin.');
 const c=document.createElement('canvas'),out=document.createElement('canvas');c.width=Math.floor(v.width);c.height=Math.floor(v.height);
 try{
  await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
  const x=Math.floor(box.x*c.width),y=Math.floor(box.y*c.height),w=Math.min(c.width-x,Math.ceil(box.w*c.width)),h=Math.min(c.height-y,Math.ceil(box.h*c.height));
  if(w<3||h<3)throw new Error('Şık alanı çok küçük; elle kırpın.');
  const scale=Math.min(1,1600/w);out.width=Math.round(w*scale);out.height=Math.round(h*scale);out.getContext('2d')!.drawImage(c,x,y,w,h,0,0,out.width,out.height);
  let image=out.toDataURL('image/png');if(image.length>750000)image=out.toDataURL('image/jpeg',.94);if(image.length>800000)throw new Error('Görsel alanını daraltın; sınır 800 KB.');return image;
 }finally{c.width=c.height=out.width=out.height=1;}
}
