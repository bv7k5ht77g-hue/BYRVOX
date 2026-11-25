import { listSavedArticles } from '../../../lib/public-articles';
import{z}from'zod';import{boundedJson}from'../../../lib/input';
import {getChatGPTUser} from '../../chatgpt-auth';import {getDb} from '../../../db';import {preferences} from '../../../db/schema';import {eq} from 'drizzle-orm';import {sameOrigin} from '../../../lib/access';
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:'Connexion requise.'}, {status:401, headers});
  const [row] = await getDb().select().from(preferences).where(eq(preferences.userId, user.userId));
  const prefs = row ? JSON.parse(row.data) : {saved:[], topics:[]};
  const includeStories = new URL(request.url).searchParams.get('lectures') === '1';
  return Response.json({name:user.displayName, preferences:prefs,
    ...(includeStories ? {stories: await listSavedArticles(prefs.saved || [])} : {})}, {headers});
}
export async function POST(req:Request){const u=await getChatGPTUser();if(!u||!sameOrigin(req))return Response.json({error:'Connexion requise.'},{status:403});const parsed=z.object({saved:z.array(z.string().max(150)).max(200).default([]),topics:z.array(z.string().max(100)).max(50).default([])}).safeParse(await boundedJson(req,20000).catch(()=>null));if(!parsed.success)return Response.json({error:'Préférences invalides.'},{status:422});const d=parsed.data;if(JSON.stringify(d).length>20000)return Response.json({error:'Limite dépassée.'},{status:413});const p={userId:u.userId,data:JSON.stringify(d),updatedAt:new Date().toISOString()};await getDb().insert(preferences).values(p).onConflictDoUpdate({target:preferences.userId,set:p});return Response.json({ok:true})}
export async function DELETE(req:Request){const u=await getChatGPTUser();if(!u||!sameOrigin(req))return Response.json({error:'Accès interdit.'},{status:403});await getDb().delete(preferences).where(eq(preferences.userId,u.userId));return Response.json({ok:true})}
