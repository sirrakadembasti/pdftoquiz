import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {cookieName,sessionUser} from '../lib/local-auth';
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const jar=await cookies();const user=await sessionUser(jar.get(cookieName)?.value);return user?{userId:user.id,displayName:user.name,email:user.email,fullName:user.name}:null;}
export async function requireChatGPTUser(returnTo:string){const user=await getChatGPTUser();if(user)return user;redirect(chatGPTSignInPath(returnTo));}
export function chatGPTSignInPath(returnTo:string){return '/account?return_to='+encodeURIComponent(returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/');}
export function chatGPTSignOutPath(){return '/account';}
