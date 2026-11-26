import { desc, eq } from 'drizzle-orm';
import { getDb } from '../../../db';
import { runs } from '../../../db/schema';
import { boundedJson } from '../../../lib/input';
import { recentHour } from '../../../lib/newswire/edition';
import { deliverRank, DeliveryProblem } from '../../../lib/newswire/publisher';

export const dynamic = 'force-dynamic';
const json = (data: object, status = 200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});

export async function GET() {
  const recent = await getDb().select({id:runs.id, slug:runs.detail, at:runs.createdAt}).from(runs)
    .where(eq(runs.kind,'hourly-publication')).orderBy(desc(runs.createdAt)).limit(45);
  return json({recent});
}
export async function POST(req: Request) {
  let input;
  try { input = await boundedJson(req,384) as Record<string,unknown>; } catch { return json({error:'JSON invalide.'},400); }
  if (!input || Object.keys(input).some(k=>k!=='hour'&&k!=='rank') || !recentHour(input.hour) ||
    typeof input.rank !== 'number' || !Number.isInteger(input.rank) || input.rank<1 || input.rank>15) {
    return json({error:'Une heure UTC récente et un rang entre 1 et 15 sont requis.'},400);
  }
  try {
    const outcome = await deliverRank(input.hour,input.rank);
    return json(outcome,outcome.status==='published'?201:200);
  } catch (e) {
    if (e instanceof DeliveryProblem) return json({error:e.message},e.status);
    return json({error:'Publication temporairement indisponible. Ce rang peut être livré de nouveau.'},503);
  }
}
