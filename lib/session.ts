import {cookies} from 'next/headers';
import {cookieName,sessionUser} from './local-auth';
export type SessionUser={userId:string;name:string;email:string};
export async function currentUser():Promise<SessionUser|null>{const jar=await cookies();const user=await sessionUser(jar.get(cookieName)?.value);return user?{userId:user.id,name:user.name,email:user.email}:null;}
