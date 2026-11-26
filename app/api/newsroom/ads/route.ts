import { z } from 'zod';
import { and, eq, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { articles } from '@/db/schema';
import { features } from '@/lib/content';
import { articleAdState } from '@/lib/article-ad-policy';
import { adManagementDenial } from '@/lib/access';
import { PLACEMENTS, AD_MODES, validAdImageUrl } from '@/lib/ad-placements';
import { getAdPlacements, getAdSenseSettings, saveAdPlacement } from '@/lib/ad-placement-store';
import { adClientPattern, adSlotPattern } from '@/lib/adsense.mjs';
import { validAdFrameUrl, validAdScriptUrl } from '@/lib/ad-frame.mjs';
import { validSourceUrl } from '@/lib/editorial.mjs';
import { boundedJson } from '@/lib/input';

const optionalLink = z.string().trim().max(2000);
const placementSchema = z.object({
  placement: z.enum(PLACEMENTS),
  mode: z.enum(AD_MODES),
  version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  name: z.string().trim().max(160),
  url: optionalLink.refine(value => !value || validSourceUrl(value), 'Le lien doit être une adresse HTTPS sans identifiants.'),
  image: optionalLink.refine(value => !value || validAdImageUrl(value),
    'L’image doit utiliser une adresse HTTPS ou un chemin local du site.'),
  alt: z.string().trim().max(300),
  adClient: z.union([z.literal(''), z.string().regex(adClientPattern)]).optional(),
  adSlot: z.union([z.literal(''), z.string().regex(adSlotPattern)]).optional(),
}).strict().superRefine((input, ctx) => {
  if (input.mode === 'adsense' && (!input.adClient || !input.adSlot)) {
    ctx.addIssue({code:'custom', message:'Renseigne un identifiant éditeur et un numéro de bloc AdSense valides.'});
  }
  if (input.mode === 'embed' && (!input.name || !validAdFrameUrl(input.url))) {
    ctx.addIssue({code:'custom', message:'Renseigne le titre et une adresse HTTPS externe valide pour le cadre.'});
  }
  if (input.mode === 'script' && (!input.name || !validAdScriptUrl(input.url))) {
    ctx.addIssue({code: 'custom', message: 'Renseigne le nom de la régie et une adresse HTTPS externe valide pour son script.'});
  }
  if (input.mode !== 'campaign') return;
  if (!input.name || !input.url) {
    ctx.addIssue({code: 'custom', message: 'Pour diffuser une campagne, renseigne l’annonceur et son lien.'});
  }
  if (input.image && !input.alt) {
    ctx.addIssue({code: 'custom', message: 'Un texte alternatif est requis pour le visuel.'});
  }
});

function reply(data: unknown, status = 200) {
  return Response.json(data, {status, headers: {'Cache-Control': 'private, no-store'}});
}

export async function GET(request: Request) {
  const denied = await adManagementDenial(request);
  if (denied) return denied;
  const identifier = new URL(request.url).searchParams.get('article');
  if (identifier !== null) {
    if (!identifier || identifier.length > 220) return reply({error:'Lien ou identifiant d’article invalide.'}, 400);
    const feature = features.find(item => item.slug === identifier);
    if (feature) return reply({article:{slug:feature.slug, title:feature.title, state:'allowed', editable:false}});
    const row = await getDb().select({slug:articles.slug, title:articles.title, review:articles.adReview}).from(articles)
      .where(and(eq(articles.status, 'published'), or(eq(articles.slug, identifier), eq(articles.id, identifier)))).limit(1).get();
    if (!row) return reply({error:'Aucun article en ligne ne correspond à ce lien ou à cet identifiant.'}, 404);
    return reply({article:{slug:row.slug, title:row.title, state:articleAdState(row.review), editable:true}});
  }
  const [placements, adsense] = await Promise.all([getAdPlacements(), getAdSenseSettings()]);
  return reply({placements, adsense});
}

export async function PUT(req: Request) {
  const denied = await adManagementDenial(req);
  if (denied) return denied;
  const input = placementSchema.safeParse(await boundedJson(req, 12000).catch(() => null));
  if (!input.success) {
    const error = input.error.issues.find(issue => issue.code === 'custom')?.message;
    return reply({error: error ?? 'Emplacement invalide. Vérifie les champs et leur longueur.'}, 422);
  }
  const placement = await saveAdPlacement(input.data);
  return placement ? reply({placement}) : reply({error: 'Cet emplacement a changé. Recharge sa configuration.'}, 409);
}
