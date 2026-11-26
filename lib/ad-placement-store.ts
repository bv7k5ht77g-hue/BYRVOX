import { and, eq } from 'drizzle-orm';
import { getDb } from '../db';
import { adPlacements, adSenseSettings } from '../db/schema';
import { PLACEMENTS, type AdPlacement, type AdSenseSettings, type Placement, type PublicAdPlacements } from './ad-placements';

export async function getAdPlacements(): Promise<AdPlacement[]> {
  const rows = await getDb().select().from(adPlacements).all();
  const configured = new Map(rows.map(row => [row.placement, row]));
  return PLACEMENTS.map(placement => configured.get(placement) ?? {
    placement, mode: 'available', name: '', url: '', image: '', alt: '', adClient: '', adSlot: '', version: 0,
  });
}

export async function getAdSenseSettings(): Promise<AdSenseSettings> {
  const row = await getDb().select().from(adSenseSettings).where(eq(adSenseSettings.id, 1)).get();
  return row ? {client: row.client, enabled: row.enabled, version: row.version} : {client: '', enabled: false, version: 0};
}

export async function getPublicAdConfiguration(allowThirdParty = true): Promise<{placements: PublicAdPlacements; client: string}> {
  const [settings, slots] = await Promise.all([getAdSenseSettings(), getAdPlacements()]);
  const client = allowThirdParty && settings.enabled ? settings.client : '';
  const placements: PublicAdPlacements = {};
  for (const {placement, mode, name, url, image, alt, adClient, adSlot} of slots) {
    if (mode === 'hidden') placements[placement] = {mode};
    if (mode === 'campaign') placements[placement] = {mode, name, url, image, alt};
    if (mode === 'embed' || mode === 'script') {
      placements[placement] = allowThirdParty ? {mode, name, url} : {mode: 'hidden'};
    }
    if (mode === 'adsense') {
      placements[placement] = client && client === adClient ? {mode, adClient, adSlot} : {mode: 'hidden'};
    }
  }
  return {placements, client};
}

const reservedArticleSlots: ReadonlySet<Placement> = new Set(['masthead', 'article-photo', 'article-mid', 'article', 'footer']);

export async function getReservedArticlePlacements(): Promise<PublicAdPlacements> {
  const hidden = await getDb().select({ placement: adPlacements.placement }).from(adPlacements)
    .where(eq(adPlacements.mode, 'hidden')).all();
  const hiddenSlots = new Set(hidden.map(row => row.placement));
  const placements: PublicAdPlacements = {};
  for (const placement of PLACEMENTS) {
    placements[placement] = { mode: reservedArticleSlots.has(placement) && !hiddenSlots.has(placement) ? 'reserved' : 'hidden' };
  }
  return placements;
}

export async function saveAdSenseSettings(input: AdSenseSettings): Promise<AdSenseSettings | null> {
  const db = getDb();
  const values = {client: input.client, enabled: input.enabled, version: input.version + 1};
  const [row] = input.version === 0
    ? await db.insert(adSenseSettings).values({id: 1, ...values}).onConflictDoNothing().returning()
    : await db.update(adSenseSettings).set(values)
        .where(and(eq(adSenseSettings.id, 1), eq(adSenseSettings.version, input.version))).returning();
  return row ? values : null;
}

export async function saveAdPlacement(input: typeof adPlacements.$inferInsert): Promise<AdPlacement | null> {
  const db = getDb();
  const {placement, version, ...creative} = input;
  const changes = {...creative, version: version + 1};
  const [row] = version === 0
    ? await db.insert(adPlacements).values({placement, ...changes})
        .onConflictDoNothing({target: adPlacements.placement}).returning()
    : await db.update(adPlacements).set(changes)
        .where(and(eq(adPlacements.placement, placement), eq(adPlacements.version, version))).returning();
  return row ?? null;
}
