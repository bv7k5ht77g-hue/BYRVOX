import { and, eq } from 'drizzle-orm';
import { getDb } from '../db';
import { adPlacements } from '../db/schema';
import { PLACEMENTS, type AdPlacement, type PublicAdPlacements } from './ad-placements';

export async function getAdPlacements(): Promise<AdPlacement[]> {
  const rows = await getDb().select().from(adPlacements).all();
  const configured = new Map(rows.map(row => [row.placement, row]));
  return PLACEMENTS.map(placement => configured.get(placement) ?? {
    placement, mode: 'available', name: '', url: '', image: '', alt: '', version: 0,
  });
}

export async function getPublicAdPlacements(): Promise<PublicAdPlacements> {
  const result: PublicAdPlacements = {};
  for (const {placement, mode, name, url, image, alt} of await getAdPlacements()) {
    if (mode === 'hidden') result[placement] = {mode};
    if (mode === 'campaign') result[placement] = {mode, name, url, image, alt};
  }
  return result;
}

export async function saveAdPlacement(input: AdPlacement): Promise<AdPlacement | null> {
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
