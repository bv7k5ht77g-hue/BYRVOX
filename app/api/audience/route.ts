import { env } from 'cloudflare:workers';
export async function POST(req:Request) {
  if(req.headers.get('origin')!==new URL(req.url).origin || !req.headers.get('content-type')?.startsWith('application/json')) return new Response(null,{status:403});
  if(!env.DB)return new Response(null,{status:503});
  const data=await req.json().catch(()=>null) as {slug:string;kind:string}|null;
  if(!data || typeof data.slug!=='string' || data.slug.length>240 || !['view','read','engage'].includes(data.kind)) return new Response(null,{status:400});
  await env.DB.prepare("INSERT INTO audience_daily(day,slug,kind,total) SELECT date('now'),slug,?,1 FROM articles WHERE slug=? AND status='published' ON CONFLICT(day,slug,kind) DO UPDATE SET total=total+1").bind(data.kind,data.slug).run();
  return new Response(null,{status:204});
}
export async function GET() {
  if(!env.DB)return Response.json([]);
  const {results}=await env.DB.prepare(`SELECT a.slug,a.title,a.category,d.kind,(SELECT json_group_object(t.locale,t.title) FROM article_translations t WHERE t.slug=a.slug AND t.source_title=a.title) localized,
    sum(case when day>=date('now','-6 days') then total else 0 end) week,
    sum(case when day>=date('now','-29 days') then total else 0 end) month,sum(total) year
    FROM audience_daily d JOIN articles a ON a.slug=d.slug AND a.status='published'
    WHERE day>=date('now','-364 days') GROUP BY a.slug,d.kind`).all();
  return Response.json(results.map(({localized,...row})=>({...row,titles:JSON.parse(String(localized||"{}"))})),{headers:{'Cache-Control':'public,max-age=120'}});
}
