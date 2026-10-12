// Measurement utility only; no key or application imports.
const median = values => { const a=[...values].sort((x,y)=>x-y); return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2; };
// Cells include line wrapping and E's trailing whitespace. Use one first-line
// height, preserving each OCR cell's own x/y anchor rather than forcing a grid.
export function alignedMarkerBoxes(cells,width){
 const valid=b=>b&&['x','y','w','h'].every(k=>Number.isFinite(b[k]))&&b.w>0&&b.h>0;
 const heights=cells.slice(0,4).filter(valid).map(b=>b.h);
 if(!Number.isFinite(width)||width<=0||heights.length<3)return cells.map(()=>null);
 const h=Math.min(.018,median(heights));
 return cells.map(b=>valid(b)&&b.w>width&&b.h>=h*.75?{x:b.x,y:b.y,w:width,h:Math.min(h,b.h)}:null);
}
// No answers enter this baseline. A question is held out in its entirety;
// position captures both A-E glyph shape and systematic final-cell layout.
export function normalizeByPosition(rows,number,field,minSamples=8){
 const row=rows.find(r=>r.number===number),values=row?.options?.map(o=>o?.[field]);
 if(!values||values.length!==5||values.some(v=>!Number.isFinite(v)))return {status:'insufficient-option-geometry',values:null,sampleCounts:[]};
 const peers=rows.filter(r=>r.number!==number),samples=values.map((_,i)=>peers.map(r=>r.options?.[i]?.[field]).filter(Number.isFinite));
 const sampleCounts=samples.map(a=>a.length);
 if(sampleCounts.some(n=>n<minSamples))return {status:'insufficient-baseline',values:null,sampleCounts};
 const baseline=samples.map(median);
 return {status:'measured',values:values.map((v,i)=>v-baseline[i]),sampleCounts,baseline,method:'leave-one-question-out median by option letter/position'};
}
export function contrast(values,key){if(values.length!==5||!Number.isInteger(key)||key<0||key>4||values.some(v=>!Number.isFinite(v)))return null;const other=values.filter((_,i)=>i!==key),mean=other.reduce((a,b)=>a+b,0)/4,sd=Math.sqrt(other.reduce((a,b)=>a+(b-mean)**2,0)/4),difference=values[key]-mean,z=sd>1e-8?difference/sd:null;return {difference,z,uniqueExtreme:values[key]<Math.min(...other)-1e-6||values[key]>Math.max(...other)+1e-6,flag:z!==null&&Math.abs(z)>=2||sd<=1e-8&&Math.abs(difference)>1e-6};}
export function redComponents(data,width,height,predicate,minSize=30){const pending=new Uint8Array(width*height),visible=new Uint8Array(pending.length),queue=new Int32Array(pending.length);for(let i=0;i<pending.length;i++)if(predicate(data[i*4],data[i*4+1],data[i*4+2]))pending[i]=1;for(let i=0;i<pending.length;i++){if(!pending[i])continue;let head=0,tail=1;queue[0]=i;pending[i]=0;while(head<tail){const at=queue[head++],x=at%width,y=Math.floor(at/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*width+xx;if(xx>=0&&xx<width&&yy>=0&&yy<height&&pending[k]){pending[k]=0;queue[tail++]=k;}}}if(tail>=minSize)for(let j=0;j<tail;j++)visible[queue[j]]=1;}return visible;}
