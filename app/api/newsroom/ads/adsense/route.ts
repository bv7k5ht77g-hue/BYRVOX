import {z} from 'zod';
import {adManagementDenial} from '@/lib/access';
import {adClientPattern} from '@/lib/adsense.mjs';
import {saveAdSenseSettings} from '@/lib/ad-placement-store';
import {boundedJson} from '@/lib/input';

const configuration = z.object({
  enabled: z.boolean(),
  client: z.union([z.literal(''), z.string().regex(adClientPattern)]),
  version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
}).strict().refine(value => !value.enabled || value.client !== '');

const reply = (body: unknown, status: number) =>
  Response.json(body, {status, headers:{'Cache-Control':'private, no-store'}});

export async function PUT(request: Request) {
  const denied = await adManagementDenial(request);
  if (denied) return denied;
  const input = configuration.safeParse(await boundedJson(request, 2000).catch(() => null));
  if (!input.success) return reply({error:'Configuration AdSense invalide. Vérifie l’identifiant éditeur.'}, 422);
  const adsense = await saveAdSenseSettings(input.data);
  return adsense ? reply({adsense}, 200) : reply({error:'La configuration AdSense a changé. Recharge sa version actuelle.'}, 409);
}
