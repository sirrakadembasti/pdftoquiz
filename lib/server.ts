import {sortQuestions,validateExam,attemptSummary,type Exam,type AttemptRow} from './quiz';
import {sqliteBucket} from './storage';
import {currentUser} from './session';
export function bucket(){return sqliteBucket;}
export async function owner(){const u=await currentUser();if(!u)throw new Error('AUTH');const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(u.userId));return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export class HttpError extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status;}}
export class NotFound extends HttpError{constructor(message='Bulunamadı.'){super(404,message);}}
export class Forbidden extends HttpError{constructor(message='Bu işlem için yetkiniz yok.'){super(403,message);}}
// Bilerek fırlatılan düz Error (Türkçe doğrulama iletisi) 400; HttpError kendi durumunu taşır; bozuk JSON (SyntaxError) 400.
// Beklenmeyen hata türleri (TypeError, veritabanı vb.) ayrıntısı istemciye verilmeden 500 döner, sunucu günlüğüne yazılır.
export function error(e:unknown){const plain=e instanceof Error&&e.constructor===Error;let message=e instanceof Error?e.message:'İşlem tamamlanamadı.',status=e instanceof HttpError?e.status:message==='AUTH'?401:400;if(e instanceof SyntaxError){message='İstek verisi geçersiz.';status=400;}else if(!(e instanceof HttpError)&&!plain&&e instanceof Error){console.error('[api] beklenmeyen hata:',e);message='Beklenmeyen bir hata oluştu. Daha sonra tekrar deneyin.';status=500;}return Response.json({error:message==='AUTH'?'Kaydetmek için öğretmen hesabınızla giriş yapın.':message},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');if(!origin){const site=r.headers.get('sec-fetch-site');if(site==='same-origin'||site==='none')return;throw new Error('Geçersiz istek kaynağı.');}const url=new URL(r.url),host=r.headers.get('host');const expected=process.env.APP_ORIGIN?.replace(/\/$/,'')||(host?new URL(url.protocol+'//'+host).origin:url.origin);if(origin!==expected)throw new Error('Geçersiz istek kaynağı.');}
export async function readExam(id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new NotFound('Sınav bulunamadı.');const o=await bucket().get(`exams/${id}/definition.json`);if(!o)throw new NotFound('Sınav bulunamadı.');return await o.json<any>();}

// İstemci IP'si yalnızca TRUST_PROXY=true iken güvenilir ters vekilin eklediği son X-Forwarded-For girdisinden okunur; aksi halde tüm istemciler tek anahtar sayılır.
export function clientIp(r:Request){if(process.env.TRUST_PROXY==='true'){const parts=(r.headers.get('x-forwarded-for')||'').split(',').map(x=>x.trim()).filter(Boolean);const ip=parts[parts.length-1]||r.headers.get('x-real-ip')?.trim();if(ip&&ip.length<=64)return ip;}return 'direct';}
const counters=new Map<string,{count:number;reset:number}>();
// Süreç belleğinde sabit pencereli sayaç (tek süreçli uygulama; yeniden başlatmada sıfırlanır).
export function rateLimit(scope:string,key:string,max:number,windowMs=600000){const now=Date.now();if(counters.size>5000)for(const [k,v] of counters)if(v.reset<=now)counters.delete(k);const id=scope+'|'+key,c=counters.get(id);if(!c||c.reset<=now){counters.set(id,{count:1,reset:now+windowMs});return;}if(++c.count>max)throw new HttpError(429,'Çok fazla istek; birkaç dakika sonra tekrar deneyin.');}
export function attemptLimit(){const n=Number(process.env.ATTEMPT_LIMIT_PER_10MIN);return Number.isInteger(n)&&n>0?n:60;}
const tokenHash=async(t:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))).map(x=>x.toString(16).padStart(2,'0')).join('');
// Tek kullanımlık deneme belirteci: hash'i depoda tutulur, gönderimde atomik silinerek harcanır.
export async function startAttempt(examId:string,duration:number){const bytes=crypto.getRandomValues(new Uint8Array(32)),token=Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('');const now=Date.now(),prefix='exams/'+examId+'/tokens/';const old=await bucket().list({prefix,limit:200,include:['customMetadata']} as any);for(const o of old.objects)if(Number(o.customMetadata?.exp)<now)await (bucket() as any).delete?.(o.key);const ttl=(Math.max(Number(duration)||0,1)*60+900)*1000;await bucket().put(prefix+await tokenHash(token),'1',{customMetadata:{exp:String(now+ttl),st:String(now)}});return token;}
export async function consumeAttempt(examId:string,token:unknown){const bad=new HttpError(400,'Sınav oturumu geçersiz veya zaten kullanıldı. Sayfayı yenileyip sınavı yeniden başlatın.');if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw bad;const key='exams/'+examId+'/tokens/'+await tokenHash(token);const o=await bucket().get(key);if(!o||Number(o.customMetadata?.exp)<Date.now())throw bad;if(!(await (bucket() as any).delete(key)))throw bad;return Number(o.customMetadata?.st)||Date.now();}
// Aynı ad (+ IP) ile ikinci gönderimi atomik olarak reddeder.
export async function claimSubmission(examId:string,name:string,ip:string){const norm=name.toLocaleLowerCase('tr').replace(/\s+/g,' ').trim(),key='exams/'+examId+'/submitted/'+await tokenHash(norm+'|'+ip);if(!(await (bucket() as any).putIfAbsent(key,'1')))throw new HttpError(409,'Bu ad ile bu sınav daha önce gönderilmiş. Sonucunuz öğretmeninize iletildi.');return key;}

// Yalnız sunucunun yönettiği alanlar: istemciden gelen değerler yok sayılır (sürüm, sahip, kapatma, silme…).
export const SERVER_FIELDS=['id','created','owner','hasPdf','version','updated','deleted','closed','opensAt','closesAt'] as const;
// POST (yeni sınav) ve PUT (güncelleme) için ortak: boyut sınırları, doğrulama, PDF sihirli baytı.
export async function parseExamForm(request:Request){
 if(Number(request.headers.get('content-length'))>48*1024*1024)throw new Error('Dosya boyutu çok büyük.');
 const form=await request.formData(),raw=form.get('exam');
 if(typeof raw!=='string'||raw.length>24*1024*1024)throw new Error('Sınav verisi boyutu aşıldı.');
 const e=JSON.parse(raw) as Exam;validateExam(e);e.questions=sortQuestions(e.questions,e.sections);
 const file=form.get('pdf');let pdf:File|undefined;
 if(file instanceof File){if(file.size>20*1024*1024)throw new Error('PDF en fazla 20 MB olabilir.');const magic=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());if(magic!=='%PDF-')throw new Error('Geçerli bir PDF yükleyin.');pdf=file;}
 const base=(e as any).version,clean={...e} as any;for(const k of SERVER_FIELDS)delete clean[k];
 return {exam:clean as Exam,pdf,baseVersion:Number.isInteger(base)?base as number:undefined};
}
// "Sınavlarım" listesi için özet; durum alanları yalnız doluyken yazılır.
export function examSummary(e:any){return {id:e.id,title:e.title,subject:e.subject,duration:e.duration,count:e.questions.length,created:e.created,version:e.version||1,...(e.updated?{updated:e.updated}:{}),...(e.closed?{closed:true}:{}),...(e.opensAt?{opensAt:e.opensAt}:{}),...(e.closesAt?{closesAt:e.closesAt}:{}),...(e.deleted?{deleted:e.deleted}:{})};}

export async function isOwner(e:any){try{return await owner()===e.owner;}catch{return false;}}
// Öğrenci erişimi: silinmiş sınav 404; elle kapatılmış, henüz açılmamış veya süresi dolmuş sınav 403 (açıklamalı). Öğretmen işlemleri bu kapıdan geçmez.
export function assertOpen(e:any,now=Date.now()){
 if(e.deleted)throw new NotFound('Sınav bulunamadı.');
 const fmt=(iso:string)=>new Date(iso).toLocaleString('tr-TR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Istanbul'});
 if(e.closed===true)throw new Forbidden('Bu sınav öğretmeni tarafından kapatıldı.');
 if(e.opensAt&&now<Date.parse(e.opensAt))throw new Forbidden('Bu sınav henüz açılmadı; '+fmt(e.opensAt)+' tarihinde açılacak.');
 if(e.closesAt&&now>Date.parse(e.closesAt))throw new Forbidden('Bu sınavın süresi sona erdi.');
}
// Güncellemede artık başvurulmayan görselleri siler (aynı sınavın assets/ klasörü; yalnız yeni tanımda geçmeyenler).
export async function pruneAssets(id:string,exam:unknown){const used=new Set([...JSON.stringify(exam).matchAll(/action=asset&key=([a-f0-9-]{36})/g)].map(m=>m[1]));const rows=await bucket().list({prefix:`exams/${id}/assets/`,limit:1000});for(const o of rows.objects)if(!used.has(o.key.split('/').pop()!))await (bucket() as any).delete(o.key);}
export async function saveExamState(e:any){const summary=examSummary(e);await bucket().put(`exams/${e.id}/definition.json`,JSON.stringify(e));await bucket().put(`owned/${e.owner}/${e.id}`,JSON.stringify(summary),{customMetadata:{summary:JSON.stringify(summary)}});}

// Sonuç listeleme: kayıtlar `attempts/` altında; hafif özet customMetadata.s içindedir (eski kayıtlar için tam kayıttan türetilir).
async function attemptObjects(id:string,max:number){const out:{key:string;customMetadata?:any}[]=[];let after:string|undefined,truncated=false;for(;;){const page=await bucket().list({prefix:`exams/${id}/attempts/`,limit:1000,after,include:['customMetadata']} as any);out.push(...page.objects);if(out.length>=max){truncated=page.truncated||out.length>max;out.length=Math.min(out.length,max);break;}if(!page.truncated||!page.objects.length)break;after=page.objects[page.objects.length-1].key;}return {objects:out,truncated};}
export async function listAttempts(id:string,max=5000):Promise<{rows:AttemptRow[];truncated:boolean}>{const {objects,truncated}=await attemptObjects(id,max),rows:AttemptRow[]=[];for(let i=0;i<objects.length;i+=50){const chunk=await Promise.all(objects.slice(i,i+50).map(async o=>{try{if(o.customMetadata?.s)return JSON.parse(o.customMetadata.s) as AttemptRow;const full=await bucket().get(o.key);return full?attemptSummary(await full.json()):null;}catch{return null;}}));rows.push(...chunk.filter((r):r is AttemptRow=>!!r));}return {rows,truncated};}
export async function loadAttempts(id:string,max=3000){const {objects}=await attemptObjects(id,max),out:any[]=[];for(let i=0;i<objects.length;i+=50){const chunk=await Promise.all(objects.slice(i,i+50).map(async o=>{try{return await (await bucket().get(o.key))?.json<any>();}catch{return null;}}));out.push(...chunk.filter(Boolean));}return out;}
