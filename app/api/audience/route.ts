import { env } from 'cloudflare:workers';
import { audienceRows } from '../../../lib/news-leaders';
export async function POST(req:Request) {
  if(req.headers.get('origin')!==new URL(req.url).origin || !req.headers.get('content-type')?.startsWith('application/json')) return new Response(null,{status:403});
  if(!env.DB)return new Response(null,{status:503});
  const data=await req.json().catch(()=>null) as {slug:string;kind:string}|null;
  if(!data || typeof data.slug!=='string' || data.slug.length>240 || !['view','read','engage'].includes(data.kind)) return new Response(null,{status:400});
  await env.DB.prepare("INSERT INTO audience_daily(day,slug,kind,total) SELECT date('now'),slug,?,1 FROM articles WHERE slug=? AND status='published' ON CONFLICT(day,slug,kind) DO UPDATE SET total=total+1").bind(data.kind,data.slug).run();
  return new Response(null,{status:204});
}
export async function GET() {
  return Response.json(await audienceRows(), {headers:{'Cache-Control':'public,max-age=120'}});
}
