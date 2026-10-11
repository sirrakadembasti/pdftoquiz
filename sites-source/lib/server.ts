import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../app/chatgpt-auth';
export function bucket(){if(!env.BUCKET)throw new Error('Sınav depolaması kullanılamıyor.');return env.BUCKET;}
export async function owner(){const u=await getChatGPTUser();if(!u)throw new Error('AUTH');const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(u.userId));return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function error(e:unknown){const message=e instanceof Error?e.message:'İşlem tamamlanamadı.';return Response.json({error:message==='AUTH'?'Kaydetmek için ChatGPT ile giriş yapın.':message},{status:message==='AUTH'?401:400,headers:{'Cache-Control':'no-store'}});}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');if(origin&&origin!==new URL(r.url).origin)throw new Error('Geçersiz istek kaynağı.');}
export async function readExam(id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Sınav bulunamadı.');const o=await bucket().get(`exams/${id}/definition.json`);if(!o)throw new Error('Sınav bulunamadı.');return await o.json<any>();}
