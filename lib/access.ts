import {env} from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
export async function admin(){const user=await getChatGPTUser();const allow=((env as unknown as Record<string,string>).ADMIN_EMAILS||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);return user&&allow.includes(user.email.toLowerCase())?user:null;}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export function runtime(name:string){return (env as unknown as Record<string,string>)[name]||'';}
