import {resolve4} from 'node:dns/promises';
import {request as httpsRequest} from 'node:https';

const GEMINI_HOST='generativelanguage.googleapis.com';

async function geminiDnsFallback(url:URL,init:RequestInit):Promise<Response>{
 const [address]=await resolve4(url.hostname);
 if(!address)throw new Error('Gemini DNS çözümlemesi adres döndürmedi.');
 if(init.body!==undefined&&typeof init.body!=='string')throw new TypeError('Gemini DNS geri dönüşü yalnız metin istek gövdesini destekler.');
 return new Promise((resolve,reject)=>{
  const lookup=((_hostname:string,options:any,callback:any)=>{if(typeof options==='function'){callback=options;options={};}if(options?.all)callback(null,[{address,family:4}]);else callback(null,address,4);}) as any;
  const request=httpsRequest(url,{method:init.method||'GET',headers:init.headers as Record<string,string>,signal:init.signal||undefined,lookup},response=>{
   const chunks:Buffer[]=[];
   response.on('data',chunk=>chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk)));
   response.on('error',reject);
   response.on('end',()=>{
    const headers=new Headers();
    for(const [name,value] of Object.entries(response.headers)){if(Array.isArray(value))for(const item of value)headers.append(name,item);else if(value!==undefined)headers.set(name,String(value));}
    resolve(new Response(Buffer.concat(chunks),{status:response.statusCode||502,statusText:response.statusMessage,headers}));
   });
  });
  request.on('error',reject);
  if(typeof init.body==='string')request.write(init.body);
  request.end();
 });
}

export async function providerFetch(input:string|URL|Request,init:RequestInit={}):Promise<Response>{
 try{return await fetch(input,init);}catch(error:any){
  const url=new URL(input instanceof Request?input.url:String(input));
  if(error?.cause?.code!=='ENOTFOUND'||url.hostname!==GEMINI_HOST)throw error;
  return geminiDnsFallback(url,init);
 }
}
