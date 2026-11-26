import { env } from 'cloudflare:workers';
import { and, eq, exists, or, sql } from 'drizzle-orm';
import { getDb } from '../../db';
import { articles, articleTranslations, revisions, runs } from '../../db/schema';
import { unreviewedWireAds } from '../article-ad-policy';
import { publicLocales } from '../i18n';
import { boundedBytes } from '../input';
import { publicStoryCategory } from '../story-topics';
import { photoByteLimit, photoFormat, photoRoute, photoTypes, type ArticlePhoto } from '../article-photo';
import { storeStoryTranslations } from '../public-translations';
import { articleError, canonicalSource, editionSchema, imageAddress, repoBase, type WireEdition, type WireStory } from './edition';

export class DeliveryProblem extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function readRemote(url: string, limit: number) {
  const remote = await fetch(url, { redirect:'manual', signal:AbortSignal.timeout(18000),
    headers:{ 'User-Agent':'BYRVOX/1.0 (https://byrvox.noventra.ca)' }});
  if (!remote.ok) {
    throw new DeliveryProblem(remote.status === 404 ? 404 : 503, 'Le fichier de la rédaction est indisponible.');
  }
  return boundedBytes(remote, limit);
}

// Parse only documents from the newsroom repository. A small cache avoids downloading
// the same document for every rank and expires promptly after a correction.
const recent = new Map<string, { expires: number; edition: WireEdition }>();
export async function fetchEdition(hour: string, refresh = false) {
  const saved = recent.get(hour);
  if (!refresh && saved && saved.expires > Date.now()) return saved.edition;
  const data = await readRemote(repoBase + hour + '/edition.json', 3000000);
  const parsed = editionSchema.safeParse(JSON.parse(new TextDecoder().decode(data)));
  if (!parsed.success || parsed.data.hour !== hour || new Set(parsed.data.articles.map(s=>s.eventKey)).size !== parsed.data.articles.length) {
    throw new DeliveryProblem(422,'Vérifie le format du manifeste GitHub, le nombre d’articles et l’unicité des identifiants.');
  }
  for (const [key, value] of recent) if (value.expires <= Date.now()) recent.delete(key);
  recent.set(hour, { expires:Date.now()+60000, edition:parsed.data });
  return parsed.data;
}

async function hash(bytes: Uint8Array<ArrayBuffer>) {
  const bytesHash = await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(bytesHash), b=>b.toString(16).padStart(2,'0')).join('');
}

async function storePhoto(url: string) {
  const bucket = env.BUCKET;
  if (!bucket) throw new DeliveryProblem(503,'Stockage des photos indisponible.');
  const bytes = await readRemote(url, photoByteLimit);
  const format = photoFormat(bytes);
  if (!format) throw new DeliveryProblem(422,'Le fichier photo doit être au format JPEG, PNG ou WebP.');
  const key = await hash(bytes);
  // The newsroom image route expects UUID-shaped names. Equal content produces the
  // same key, including on concurrent deliveries and after an interrupted D1 write.
  const name = [key.slice(0,8), key.slice(8,12), '4'+key.slice(13,16), '8'+key.slice(17,20), key.slice(20,32)].join('-')+'.'+format;
  if (!await bucket.head('photos/'+name)) await bucket.put('photos/'+name,bytes,{httpMetadata:{contentType:photoTypes[format]}});
  return photoRoute + name;
}

async function wirePhoto(story: WireStory, hour: string): Promise<ArticlePhoto> {
  const url = await storePhoto(imageAddress(story.photo.download,hour)!);
  const {alt,caption,credit,sourceUrl,license,licenseUrl,blueskyPost,blueskyCaption} = story.photo;
  return {url,alt,caption,credit,sourceUrl,license,licenseUrl,
    ...(blueskyPost && {blueskyPost}), ...(blueskyCaption && {blueskyCaption})};
}

// The newsroom manifest identifies the exact published image and its original metadata.
function photoHash(photo: ArticlePhoto) {
  return hash(new TextEncoder().encode(JSON.stringify([
    photo.url, photo.alt, photo.caption, photo.credit, photo.sourceUrl, photo.license, photo.licenseUrl,
    ...(photo.blueskyPost ? [photo.blueskyPost] : []),
    ...(photo.blueskyCaption ? [publicLocales.map(locale=>photo.blueskyCaption?.[locale] ?? null)] : []),
  ])));
}

async function correctPhoto(story: WireStory, hour: string, receiptSlug: string) {
  const expected = story.photo.replacesPublishedHash;
  if (!expected || receiptSlug !== story.eventKey) throw new DeliveryProblem(422,'Aucune correction photo correspondante dans cette édition.');
  const db = getDb();
  const stored = await db.select().from(articles).where(eq(articles.slug, receiptSlug)).get();
  if (!stored?.photo || stored.status !== 'published' || stored.photoHidden || stored.draft) {
    throw new DeliveryProblem(409,'La rédaction doit valider la photo de cette version.');
  }
  const replacement = await wirePhoto(story,hour);
  const currentHash = await photoHash(stored.photo);
  const newHash = await photoHash(replacement);
  if (currentHash === newHash) return {status:'recorded',slug:receiptSlug};
  if (currentHash !== expected) throw new DeliveryProblem(409,'La photo a déjà été modifiée dans la rédaction.');
  const sameVersion = and(eq(articles.id,stored.id),eq(articles.version,stored.version));
  const guard = db.select({id:articles.id}).from(articles).where(sameVersion);
  const now = new Date().toISOString();
  const snapshot = JSON.stringify({...stored,sources:JSON.parse(stored.sources),draft:undefined});
  const translations = Object.entries(story.translations ?? {}).flatMap(([locale, copy]) => {
    if (!copy?.photoAlt || !copy.photoCaption) return [];
    return [db.update(articleTranslations).set({photo:{
      sourceUrl:replacement.url, sourceAlt:replacement.alt, sourceCaption:replacement.caption,
      alt:copy.photoAlt, caption:copy.photoCaption,
    }}).where(and(eq(articleTranslations.slug,receiptSlug),eq(articleTranslations.locale,locale),exists(guard)))];
  });
  const result = await db.batch([
    db.insert(revisions).select(db.select({
      id:sql<string>`${crypto.randomUUID()}`.as('id'),articleId:articles.id,
      snapshot:sql<string>`${snapshot}`.as('snapshot'),actor:sql<string>`${stored.authorId}`.as('actor'),
      action:sql<string>`${'correction-photo-edition'}`.as('action'),createdAt:sql<string>`${now}`.as('created_at'),
    }).from(articles).where(sameVersion)),
    ...translations,
    db.update(articles).set({photo:replacement,updatedAt:now,version:stored.version+1}).where(sameVersion).returning({id:articles.id}),
  ]);
  if (!(result.at(-1) as {id:string}[]).length) throw new DeliveryProblem(409,'L’article vient de changer. Vérifie de nouveau la photo.');
  return {status:'photo_corrected',slug:receiptSlug};
}

export async function deliverRank(hour: string, rank: number, photoCorrection = false) {
  const db = getDb();
  const marker = 'wire:' + hour + ':' + rank;
  const recorded = () => db.select({slug:runs.detail}).from(runs).where(eq(runs.id,marker)).get();
  const prior = await recorded();
  if (prior && !photoCorrection) return {status:'recorded',slug:prior.slug};
  const edition = await fetchEdition(hour,photoCorrection);
  const story = edition.articles[rank-1];
  if (!story) return {status:'no_entry',size:edition.articles.length};
  const error = articleError(story,hour);
  if (error) throw new DeliveryProblem(422,error);
  if (prior) return correctPhoto(story,hour,prior.slug);
  if (photoCorrection && !story.photo.replacesPublishedHash) throw new DeliveryProblem(422,'Aucune correction photo dans cette édition.');
  const primary = story.sources[0];
  // A rolling official bulletin can reuse its URL for a different event on a later day.
  const publicationDay = new Date(primary.publishedAt).toISOString().slice(0,10);
  const sourceIdentity = JSON.stringify([canonicalSource(primary.url), publicationDay]);
  const id = 'wire-' + await hash(new TextEncoder().encode(sourceIdentity));
  const existing = () => db.select({slug:articles.slug}).from(articles)
    .where(or(eq(articles.id,id),eq(articles.slug,story.eventKey))).limit(1).get();
  const duplicate = await existing();
  if (duplicate) return {status:'duplicate',slug:duplicate.slug};
  const photo = await wirePhoto(story,hour);
  const now = new Date().toISOString();
  const thematic = hour.endsWith('-thematique');
  const authorId = thematic ? 'byrvox-agent-thematique' : 'byrvox-agent-horaire';
  const entry = {id,slug:story.eventKey,title:story.title,category:publicStoryCategory(story),summary:story.summary,body:story.body,
    sources:JSON.stringify(story.sources.map(({name,url})=>({name,url}))), status:'published',risk:'standard',
    adReview:unreviewedWireAds(authorId,now),authorId,createdAt:now,updatedAt:now,publishedAt:now,
    photo,gallery:[]};
  if (story.translations) await storeStoryTranslations(entry,story.translations);
  try {
    await db.batch([db.insert(articles).values(entry),
      db.insert(revisions).values({id:marker,articleId:id,actor:entry.authorId,action:thematic ? 'publication-thematique' : 'publication-horaire',snapshot:JSON.stringify(entry),createdAt:now}),
      db.insert(runs).values({id:marker,kind:thematic ? 'thematic-publication' : 'hourly-publication',status:'published',detail:entry.slug,createdAt:now})]);
  } catch (cause) {
    const done = await recorded() || await existing();
    if (done) return {status:'recorded',slug:done.slug};
    throw cause;
  }
  return {status:'published',slug:entry.slug};
}
