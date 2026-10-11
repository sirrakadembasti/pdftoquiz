import {cookies} from 'next/headers';
import {cookieName,revokeSession} from '../../../../lib/local-auth';
import {sameOrigin} from '../../../../lib/server';
export async function POST(request:Request){try{sameOrigin(request);const jar=await cookies();await revokeSession(jar.get(cookieName)?.value);jar.delete(cookieName);return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Çıkış tamamlanamadı.'},{status:400});}}
