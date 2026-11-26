// Run after npm run build: node --test tests/worker-cms.mjs
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Miniflare } = createRequire(require.resolve('wrangler/package.json'))('miniflare');
const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://byrvox.noventra.ca';
const publicOrigin = 'https://byrvox.today';
const providerOrigin = 'https://byrvox.h2y4xnnm6g.chatgpt.site';
const editor = 'editor@example.invalid';
const initial = {
  title: 'Conseil & culture <édition locale>',
  category: 'Canada',
  summary: 'Le conseil a présenté son programme.',
  body: 'Cette édition présente le programme initial.',
  sources: [{ name: 'Procès-verbal local', url: 'https://source.example.invalid/compte-rendu' }],
};

const originalEdition = 'byrvox-2026-11-25';
const iowaEdition = 'byrvox-2026-11-25-iowa';
const originalKey = process.env.BYRVOX_REVIEW_KEY_20261125;
const iowaKey = process.env.BYRVOX_REVIEW_KEY_20261125_IOWA;

function importedId(edition, slug) {
  return 'edition-' + createHash('sha256').update(JSON.stringify([edition, slug])).digest('hex');
}

async function createNewsroom(t, editionBindings, outboundService) {
  const server = resolve(root, 'dist/server');
  const config = JSON.parse(await readFile(resolve(server, 'wrangler.json'), 'utf8'));
  // Vinext imports some chunks dynamically. Workerd needs the complete module list, entry point first.
  const chunks = (await readdir(server, { recursive: true })).filter((file) =>
    file !== config.main && /\.m?js$/.test(file));
  const mf = new Miniflare({
    host: '127.0.0.1',
    cf: false,
    modules: [config.main, ...chunks].map((file) => ({ type: 'ESModule', path: resolve(server, file) })),
    modulesRoot: server,
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags,
    d1Databases: ['DB'],
    r2Buckets: ['BUCKET'],
    ...(outboundService ? {outboundService} : {}),
    bindings: { ADMIN_EMAILS: editor, ...editionBindings },
  });
  t.after(() => mf.dispose());
  const db = await mf.getD1Database('DB');
  const migrations = resolve(root, 'drizzle');
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    const source = await readFile(resolve(migrations, file), 'utf8');
    const statements = source.split('--> statement-breakpoint').map((sql) => sql.trim()).filter(Boolean);
    await db.batch(statements.map((sql) => db.prepare(sql)));
  }

  const sessions = new Map();
  async function editorHeaders(email, userId = 'test-' + email) {
    if (!email) return {};
    const key = JSON.stringify([userId, email]);
    if (!sessions.has(key)) {
      const token = randomBytes(32).toString('hex');
      const digest = createHash('sha256').update(token).digest('hex');
      const insert = db.prepare(
        "INSERT INTO editor_sessions(digest,proof_hash,user_id,email,expires_at) VALUES (?,'',?,?,?)"
      ).bind(digest, userId, email, Math.floor(Date.now() / 1000) + 3600).run();
      sessions.set(key, insert.then(() => ({cookie: '__Host-byrvox-editor=' + token})));
    }
    return sessions.get(key);
  }
  async function request(path, email, data) {
    const headers = new Headers(await editorHeaders(email));
    const options = { headers };
    if (data) {
      headers.set('origin', origin);
      headers.set('content-type', 'application/json');
      Object.assign(options, { method: 'POST', body: JSON.stringify(data) });
    }
    return mf.dispatchFetch(origin + path, options);
  }
  async function json(path, { email, data, expected = 200 } = {}) {
    const response = await request(path, email, data);
    const body = await response.text();
    assert.equal(response.status, expected, path + ' ' + body.slice(0, 400));
    return JSON.parse(body);
  }
  return { mf, db, request, json, editorHeaders };
}

test('les adresses publiques suivent le domaine et le portail conserve ses sessions sur Noventra', async (t) => {
  const { mf } = await createNewsroom(t);
  const legacy = origin;
  const today = publicOrigin;
  for (const [base, canonical] of [[today,today], [legacy,legacy], ['https://byrvox.test',legacy]]) {
    const read = async path => {
      const response = await mf.dispatchFetch(base + path);
      assert.equal(response.status, 200, path);
      return response.text();
    };
    const href = (await read('/')).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(new URL(href).href, canonical + '/');
    const path = '/article/notre-methode';
    const article = await read(path);
    assert.ok(article.includes('rel="canonical" href="' + canonical + path + '"'));
    assert.ok(article.includes('property="og:url" content="' + canonical + path + '"'));
    assert.ok((await read('/rss.xml')).includes('<link>' + canonical + '/</link>'));
    assert.ok((await read('/sitemap.xml')).includes('<loc>' + canonical + path + '</loc>'));
    assert.ok((await read('/robots.txt')).includes('Sitemap: ' + canonical + '/sitemap.xml'));
  }
  const newsroom = await mf.dispatchFetch(today + '/admin', {redirect:'manual'});
  assert.equal(newsroom.status, 307);
  assert.equal(newsroom.headers.get('location'), legacy + '/admin');
});

test('seul le domaine éditeur accepte les sessions et les opérations de rédaction', async t => {
  const {mf, editorHeaders} = await createNewsroom(t);
  const staff = await editorHeaders(editor);
  for (const host of [publicOrigin, 'https://www.byrvox.today', providerOrigin, 'https://byrvox.test']) {
    const headers = {...staff, origin:host, 'content-type':'application/json'};
    const page = await mf.dispatchFetch(host + '/admin', {redirect:'manual', headers});
    assert.equal(page.status, 307, host);
    assert.equal(page.headers.get('location'), origin + '/admin');
    for (const path of ['/api/newsroom', '/api/newsroom/lead', '/api/newsroom/team', '/api/newsroom/readers', '/api/newsroom/ads']) {
      assert.equal((await mf.dispatchFetch(host + path, {headers})).status, 403, host + path);
    }
    for (const [method, path] of [
      ['POST','/api/newsroom'], ['PUT','/api/newsroom/lead'], ['PATCH','/api/newsroom/readers'], ['PUT','/api/newsroom/ads'],
      ['POST','/api/editor-session/logout'],
    ]) {
      const response = await mf.dispatchFetch(host + path, {method,headers,body:'{}',redirect:'manual'});
      assert.equal(response.status, 403, method + ' ' + host + path);
    }
    const start = await mf.dispatchFetch(host + '/api/editor-session/start', {redirect:'manual'});
    assert.equal(start.status, 403);
    assert.equal(start.headers.get('set-cookie'), null);
  }
  assert.equal((await mf.dispatchFetch(origin + '/api/newsroom', {headers:staff})).status,200);
});

test('le Worker distingue les versions publiques et les révisions de la rédaction', async (t) => {
  const { mf, request, json } = await createNewsroom(t, {
    ...(originalKey ? { BYRVOX_REVIEW_KEY_20261125: originalKey } : {}),
    ...(iowaKey ? { BYRVOX_REVIEW_KEY_20261125_IOWA: iowaKey } : {}),
  });
  const edit = (data, expected = 200) => json('/api/newsroom', { email: editor, data, expected });
  const published = () => json('/api/articles');
  async function document(path, contentType, expected = 200) {
    const response = await mf.dispatchFetch(origin + path);
    assert.equal(response.status, expected, path);
    assert.match(response.headers.get('content-type') || '', contentType);
    return response.text();
  }
  const feed = () => document('/rss.xml', /application\/rss\+xml/i);
  const sitemap = () => document('/sitemap.xml', /application\/xml/i);
  const editionPages = () => Promise.all(['/', '/?rubrique=actualites'].map((path) =>
    document(path, /text\/html/i)));

  for (const email of [undefined, 'reader@example.invalid']) {
    await json('/api/newsroom', { email, expected: 403 });
    await json('/api/newsroom', { email, data: initial, expected: 403 });
  }
  const draft = await edit({ ...initial, action: 'save' });
  assert.equal(draft.status, 'draft');
  assert.ok(Number.isInteger(draft.version));
  const { id, slug } = draft;
  const reader = (expected) => document('/article/' + slug, /text\/html/i, expected);
  assert.deepEqual(await published(), []);
  assert.ok(!(await reader(404)).includes(initial.body));
  assert.ok(!(await feed()).includes(slug));
  assert.ok(!(await sitemap()).includes(slug));
  for (const page of await editionPages()) assert.ok(!page.includes(slug));
  await edit({ id, version: draft.version, action: 'publish' }, 422);
  const reviewed = await edit({ ...initial, id, version: draft.version, action: 'review' });
  assert.equal(reviewed.status, 'review');
  assert.deepEqual(await published(), []);
  assert.ok(!(await feed()).includes(slug));
  await edit({ ...initial, id, version: draft.version, action: 'save' }, 409);
  const first = await edit({ id, version: reviewed.version, action: 'publish' });
  assert.equal(first.status, 'published');
  assert.equal(first.isLive, true);
  const [entry] = await published();
  assert.deepEqual(Object.keys(entry).sort(), ['category', 'publishedAt', 'slug', 'summary', 'title', 'updatedAt']);
  assert.equal(entry.slug, slug);
  assert.equal(entry.title, initial.title);
  assert.ok(Number.isFinite(Date.parse(entry.publishedAt)));
  const firstFeed = await feed();
  assert.ok(firstFeed.includes('<title>Conseil &amp; culture &lt;édition locale&gt;</title>'));
  assert.ok(firstFeed.includes('/article/' + slug));
  assert.ok((await sitemap()).includes('/article/' + slug + '</loc>'));
  assert.match(await document('/robots.txt', /text\/plain/i), /^Sitemap: https:\/\/.+\/sitemap\.xml$/m);
  assert.ok((await reader()).includes(initial.body));
  const htmlTitle = 'Conseil &amp; culture &lt;édition locale&gt;';
  for (const page of await editionPages()) {
    assert.ok(page.includes('href="/article/' + slug + '"'));
    assert.ok(page.includes('>' + htmlTitle + '<'));
  }

  const corrected = { ...initial, title: 'Compte rendu corrigé', body: 'Cette édition contient une correction.' };
  const changes = await edit({ ...corrected, id, version: first.version, action: 'save' });
  assert.equal(changes.status, 'draft');
  assert.equal(changes.isLive, true);
  assert.deepEqual(await published(), [entry]);
  assert.equal(await feed(), firstFeed);
  const duringRevision = await reader();
  assert.ok(duringRevision.includes(initial.body));
  assert.ok(!duringRevision.includes(corrected.body));
  for (const page of await editionPages()) {
    assert.ok(page.includes('>' + htmlTitle + '<'));
    assert.ok(!page.includes(corrected.title));
  }
  await edit({ id, version: changes.version, action: 'publish' }, 422);
  const ready = await edit({ ...corrected, id, version: changes.version, action: 'review' });
  assert.deepEqual(await published(), [entry]);
  const second = await edit({ id, version: ready.version, action: 'publish' });
  const [correction] = await published();
  assert.equal(correction.title, corrected.title);
  assert.equal(correction.slug, slug);
  assert.equal(correction.publishedAt, entry.publishedAt);
  assert.ok(Date.parse(correction.updatedAt) > Date.parse(entry.updatedAt));
  assert.ok((await feed()).includes('<title>' + corrected.title + '</title>'));
  assert.ok((await reader()).includes(corrected.body));

  const history = await json('/api/newsroom', { email: editor });
  const revision = history.revisions.find((row) =>
    row.articleId === id && row.action === 'publish' && JSON.parse(row.snapshot).title === initial.title);
  assert.ok(revision, 'La première édition doit être restaurable.');
  const restored = await edit({ id, version: second.version, action: 'restore', revisionId: revision.id });
  assert.equal(restored.status, 'draft');
  assert.equal(restored.title, initial.title);
  assert.equal(restored.body, initial.body);
  assert.deepEqual(await published(), [correction]);

  const beforeRace = await json('/api/newsroom', { email: editor });
  const racingWrites = await Promise.all(['Une', 'Deux'].map((title) =>
    request('/api/newsroom', editor, { ...initial, title, id, version: restored.version, action: 'save' })));
  assert.deepEqual(racingWrites.map((response) => response.status).sort(), [200, 409]);
  const accepted = await racingWrites.find((response) => response.ok).json();
  const afterRace = await json('/api/newsroom', { email: editor });
  assert.equal(afterRace.articles.find((row) => row.id === id).title, accepted.title);
  assert.equal(afterRace.revisions.length, beforeRace.revisions.length + 1);
  assert.deepEqual(await published(), [correction]);

  await t.test('le lot de rédaction respecte les droits, la confidentialité et les corrections', async () => {
    const path = '/api/newsroom/edition';
    for (const email of [undefined, 'reader@example.invalid']) {
      await json(path, { email, data: {}, expected: 403 });
    }
    const expectedTotal = (originalKey ? 15 : 0) + (iowaKey ? 1 : 0);
    if (!expectedTotal) {
      const result = await json(path, { email: editor, data: {}, expected: 503 });
      assert.equal(result.status, 'unavailable');
      assert.deepEqual(await published(), [correction]);
      return;
    }
    const supply = () => json(path, { email: editor, data: {} });
    const results = await Promise.all([supply(), supply()]);
    assert.equal(results.reduce((sum, result) => sum + result.imported, 0), expectedTotal);
    const partial = !originalKey || !iowaKey;
    for (const result of results) {
      assert.equal(result.status, partial ? 'partial' : result.imported ? 'imported' : 'unchanged');
      if (partial) assert.equal(result.unavailable, 1);
    }
    const newsroom = await json('/api/newsroom', { email: editor });
    const issue = newsroom.articles.filter(row => row.id !== id);
    assert.equal(issue.length, expectedTotal);
    assert.equal(new Set(issue.map(row => row.slug)).size, expectedTotal);
    assert.equal(issue.filter(row => row.id === importedId(originalEdition, row.slug)).length, originalKey ? 15 : 0);
    assert.equal(issue.filter(row => row.id === importedId(iowaEdition, row.slug)).length, iowaKey ? 1 : 0);
    const importHistory = newsroom.revisions.filter(row => row.action === 'import-review');
    assert.equal(importHistory.length, expectedTotal);
    assert.equal(new Set(importHistory.map(row => row.articleId)).size, expectedTotal);
    const xml = await feed();
    const map = await sitemap();
    for (const article of issue) {
      assert.equal(article.status, 'review');
      assert.equal(article.publishedAt, null);
      assert.equal(article.authorId, 'byrvox-redaction-assistee');
      assert.ok(JSON.parse(article.sources).length >= 2);
      assert.ok(article.body.trim().length > 0);
      if (article.id === importedId(originalEdition, article.slug)) assert.ok(article.body.split(/\s+/u).length >= 200);
      assert.ok(!xml.includes(article.slug));
      assert.ok(!map.includes(article.slug));
    }
    assert.deepEqual(await published(), [correction]);
    const first = issue[0];
    await document('/article/' + first.slug, /text\/html/i, 404);
    await edit({ id: first.id, version: first.version, action: 'publish' });
    assert.ok((await published()).some(row => row.slug === first.slug));
    assert.equal((await supply()).imported, 0);
    assert.ok((await published()).some(row => row.slug === first.slug));
    assert.ok((await feed()).includes(first.slug));
  });
});

test('un supplément respecte les articles déjà importés et révisés', async (t) => {
  const { db, json } = await createNewsroom(t, iowaKey ? { BYRVOX_REVIEW_KEY_20261125_IOWA: iowaKey } : {});
  const date = '2026-11-25T00:00:00.000Z';
  const marker = (edition) => db.prepare(
    'INSERT INTO runs (id, kind, status, detail, created_at) VALUES (?, ?, ?, ?, ?)',
  ).bind('review-edition:' + edition, 'review-edition', 'ok', edition, date);
  const slug = 'article-de-test-modifie';
  const legacyId = importedId(originalEdition, slug);
  const title = 'Correction déjà enregistrée par un membre de la rédaction';
  await db.batch([
    marker(originalEdition),
    db.prepare(`INSERT INTO articles
      (id, slug, title, category, summary, body, status, created_at, updated_at, author_id, version)
      VALUES (?, ?, ?, 'Culture', 'Résumé de test', 'Texte de test corrigé', 'draft', ?, ?, ?, 3)`)
      .bind(legacyId, slug, title, date, date, editor),
    db.prepare(`INSERT INTO revisions (id, article_id, snapshot, actor, action, created_at)
      VALUES ('legacy-edit', ?, '{}', ?, 'save', ?)`).bind(legacyId, editor, date),
  ]);
  const supply = () => json('/api/newsroom/edition', { email: editor, data: {} });
  const result = await supply();
  assert.equal(result.status, iowaKey ? 'imported' : 'partial');
  assert.equal(result.imported, iowaKey ? 1 : 0);
  if (!iowaKey) assert.equal(result.unavailable, 1);
  const newsroom = await json('/api/newsroom', { email: editor });
  const existing = newsroom.articles.find(article => article.id === legacyId);
  assert.equal(existing.title, title);
  assert.equal(existing.version, 3);
  assert.equal(existing.authorId, editor);
  assert.equal(existing.status, 'draft');
  assert.deepEqual(newsroom.revisions.filter(row => row.articleId === legacyId).map(row => row.id), ['legacy-edit']);
  const additions = newsroom.articles.filter(article => article.id !== legacyId);
  assert.equal(additions.length, iowaKey ? 1 : 0);
  for (const article of additions) {
    assert.equal(article.id, importedId(iowaEdition, article.slug));
    assert.equal(article.status, 'review');
  }
  assert.deepEqual(await json('/api/articles'), []);
  // Installed editions stay installed even when their decryption keys are absent.
  if (!iowaKey) await marker(iowaEdition).run();
  const retry = await supply();
  assert.equal(retry.status, 'unchanged');
  assert.equal(retry.imported, 0);
});

test('la rédaction contrôle les fichiers et la visibilité des photos au fil des publications', async (t) => {
  const { mf, db, request, json, editorHeaders } = await createNewsroom(t, {});
  const uploadPath = origin + '/api/newsroom/photos';
  const png = await readFile(resolve(root, 'public/brand/logo-dark.png'));
  const webp = await readFile(resolve(root, 'public/media/news.webp'));
  // A complete one-pixel grayscale JPEG.
  const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8Af3//2Q==', 'base64');

  async function upload(body, type, email = editor, from = origin) {
    const headers = { ...await editorHeaders(email), 'content-type': type, origin: from };
    return mf.dispatchFetch(uploadPath, { method: 'POST', headers, body });
  }

  const invalidUploads = [
    await upload(png, 'image/png', null),
    await upload(png, 'image/png', 'reader@example.invalid'),
    await upload(png, 'image/png', editor, 'https://other.example.invalid'),
    await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'image/png'),
    await upload(png, 'image/webp'),
  ];
  for (const response of invalidUploads) {
    assert.ok(response.status >= 400 && response.status < 500, 'Refus attendu, statut ' + response.status);
  }
  const oversized = Buffer.alloc(8 * 1024 * 1024 + 1);
  png.copy(oversized);
  assert.equal((await upload(oversized, 'image/png')).status, 413);
  const bucket = await mf.getR2Bucket('BUCKET');
  assert.equal((await bucket.list()).objects.length, 0);

  async function uploadPhoto(bytes, type) {
    const response = await upload(bytes, type);
    assert.equal(response.status, 201, await response.clone().text());
    const { url } = await response.json();
    assert.match(url, /^\/api\/photos\/[\da-f-]+\.(?:jpe?g|webp|png)$/);
    assert.equal((await request(url)).status, 404);
    assert.equal((await request(url, 'reader@example.invalid')).status, 404);
    const preview = await request(url, editor);
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.get('content-type'), type);
    assert.match(preview.headers.get('cache-control') || '', /private|no-store/i);
    assert.ok((await preview.arrayBuffer()).byteLength > 0);
    return url;
  }
  const url = await uploadPhoto(png, 'image/png');
  const replacementUrl = await uploadPhoto(webp, 'image/webp');
  const galleryUrl = await uploadPhoto(jpeg, 'image/jpeg');

  const photo = { url, alt: 'Logo de la rédaction', credit: 'BYRVOX', caption: 'Le logo de BYRVOX.',
    sourceUrl: 'https://source.example.invalid/photo' };
  const replacement = { url: replacementUrl, alt: 'Deuxième illustration', credit: 'Rédaction',
    caption: 'Nouvelle légende.', sourceUrl: 'https://source.example.invalid/suite' };
  const edit = (data) => json('/api/newsroom', { email: editor, data });
  for (const invalidUrl of ['https://other.example.invalid/photo.png', '/api/photos/00000000-0000-4000-8000-000000000000.png']) {
    const response = await request('/api/newsroom', editor, { ...initial, photo: { ...photo, url: invalidUrl } });
    assert.ok(response.status >= 400 && response.status < 500);
  }
  for (const patch of [{ alt: ' ' }, { credit: ' ' }]) {
    const incomplete = await edit({ ...initial, action: 'review', photo: { ...photo, ...patch } });
    const blocked = await request('/api/newsroom', editor, { id: incomplete.id, version: incomplete.version, action: 'publish' });
    assert.equal(blocked.status, 422);
  }
  for (const [images, label] of [
    [{ photo: { ...photo, caption: ' ' } }, 'photo de couverture'],
    [{ gallery: [photo, { ...replacement, caption: '' }] }, 'photo 2 de la galerie'],
  ]) {
    const draft = await edit({ ...initial, action: 'review', ...images });
    const response = await request('/api/newsroom', editor, { id: draft.id, version: draft.version, action: 'publish' });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error, `Ajoute une légende à la ${label} avant de publier.`);
  }
  const invalidSource = await request('/api/newsroom', editor, { ...initial,
    photo: { ...photo, sourceUrl: 'https://user:password@example.invalid/image' } });
  assert.ok(invalidSource.status >= 400 && invalidSource.status < 500);
  const first = await edit({ ...initial, photo });
  assert.deepEqual(first.photo, photo);
  const { id } = first;
  const reviewed = await edit({ ...initial, id, version: first.version, action: 'review' });
  assert.deepEqual(reviewed.photo, photo, 'Un client qui omet la photo conserve celle du brouillon.');
  assert.equal((await request(url)).status, 404);
  const published = await edit({ id, version: reviewed.version, action: 'publish' });
  const publicPhoto = async () => (await json('/api/articles')).find(row => row.slug === first.slug)?.photo;
  assert.deepEqual(await publicPhoto(), photo);
  const readArticle = () => request('/article/' + first.slug).then(response => response.text());
  const html = await readArticle();
  for (const value of [photo.url, photo.alt, photo.caption, photo.credit, photo.sourceUrl]) assert.ok(html.includes(value), value);
  const publicImage = await request(url);
  assert.equal(publicImage.status, 200);
  assert.equal(publicImage.headers.get('content-type'), 'image/png');

  const correction = await edit({ ...initial, id, version: published.version, action: 'review', photo: replacement });
  assert.deepEqual(correction.photo, replacement);
  assert.deepEqual(await publicPhoto(), photo);
  assert.ok(!(await readArticle()).includes(replacement.caption));
  assert.equal((await request(replacementUrl)).status, 404);
  assert.equal((await request(url)).status, 200);
  const republished = await edit({ id, version: correction.version, action: 'publish' });
  assert.deepEqual(republished.photo, replacement);
  assert.deepEqual(await publicPhoto(), replacement);
  assert.ok((await readArticle()).includes(replacement.caption));
  assert.equal((await request(replacementUrl)).status, 200);
  assert.equal((await request(url)).status, 404);

  const history = await json('/api/newsroom', { email: editor });
  const revision = history.revisions.find(record =>
    record.articleId === id && record.action === 'publish' && JSON.parse(record.snapshot).photo?.url === url);
  assert.ok(revision, 'La précédente photo doit être conservée dans les révisions.');
  const restored = await edit({ id, version: republished.version, action: 'restore', revisionId: revision.id });
  assert.deepEqual(restored.photo, photo);
  assert.equal((await request(url)).status, 404);
  assert.equal((await request(url, editor)).status, 200);
  assert.equal((await request(replacementUrl)).status, 200);

  const withoutPhoto = await edit({ ...initial, id, version: restored.version, action: 'review', photo: null, photoHidden: true });
  assert.equal(withoutPhoto.photo, null);
  assert.equal(withoutPhoto.photoHidden, true);
  assert.deepEqual(await publicPhoto(), replacement);
  const liveHidden = () => db.prepare('select photo_hidden from articles where id = ?').bind(id).first('photo_hidden');
  assert.equal(await liveHidden(), 0);
  assert.equal((await request(replacementUrl)).status, 200);
  const cleared = await edit({ id, version: withoutPhoto.version, action: 'publish' });
  assert.equal(cleared.photoHidden, true);
  assert.equal(await liveHidden(), 1);
  assert.equal(await publicPhoto(), undefined);
  assert.equal((await request(replacementUrl)).status, 404);

  const galleryPhoto = { url: galleryUrl, alt: 'Photo du supplément', caption: 'Une légende de galerie.', credit: 'Archives BYRVOX' };
  const gallery = [galleryPhoto, photo];
  const oversizedGallery = await request('/api/newsroom', editor, {
    ...initial, id, version: cleared.version, gallery: Array(5).fill(galleryPhoto),
  });
  assert.ok(oversizedGallery.status >= 400 && oversizedGallery.status < 500);
  const withGallery = await edit({ ...initial, id, version: cleared.version, action: 'save', gallery });
  assert.deepEqual(withGallery.gallery, gallery);
  const readyGallery = await edit({ ...initial, id, version: withGallery.version, action: 'review' });
  assert.deepEqual(readyGallery.gallery, gallery, 'Le client peut enregistrer le texte sans remplacer la galerie.');
  assert.equal((await request(galleryUrl)).status, 404);
  const liveGallery = await edit({ id, version: readyGallery.version, action: 'publish' });
  for (const item of gallery) assert.equal((await request(item.url)).status, 200);
  const galleryHtml = await readArticle();
  assert.ok(galleryHtml.includes(galleryPhoto.caption));
  assert.ok(galleryHtml.includes(galleryPhoto.alt));

  const changedGallery = await edit({ ...initial, id, version: liveGallery.version, action: 'review', gallery: [replacement] });
  assert.equal((await request(replacementUrl)).status, 404);
  assert.equal((await request(galleryUrl)).status, 200);
  const nextGallery = await edit({ id, version: changedGallery.version, action: 'publish' });
  assert.equal((await request(galleryUrl)).status, 404);
  assert.equal((await request(url)).status, 404);
  assert.equal((await request(replacementUrl)).status, 200);

  const updatedHistory = await json('/api/newsroom', { email: editor });
  const galleryRevision = updatedHistory.revisions.find(record => record.articleId === id &&
    record.action === 'publish' && JSON.parse(record.snapshot).gallery?.[0]?.url === galleryUrl);
  assert.ok(galleryRevision);
  const restoredGallery = await edit({ id, version: nextGallery.version, action: 'restore', revisionId: galleryRevision.id });
  assert.deepEqual(restoredGallery.gallery, gallery);
  assert.equal((await request(galleryUrl)).status, 404);
  assert.equal((await request(replacementUrl)).status, 200);

  // Simulate public media stored before the caption requirement.
  const legacyPhoto = { ...photo, caption: '' };
  const legacyGallery = [{ ...replacement, caption: '' }];
  await db.prepare("UPDATE articles SET photo = ?, photo_hidden = 0, gallery = ?, draft = NULL WHERE id = ?")
    .bind(JSON.stringify(legacyPhoto), JSON.stringify(legacyGallery), id).run();
  assert.equal((await request(url)).status, 200);
  const textCorrection = await edit({ ...initial, id, title: 'Texte corrigé', action: 'review' });
  const kept = await edit({ id, version: textCorrection.version, action: 'publish' });
  assert.deepEqual(kept.photo, legacyPhoto);
  assert.deepEqual(kept.gallery, legacyGallery);
  const captioned = await edit({ ...initial, id, photo, gallery: [replacement], action: 'review' });
  await edit({ id, version: captioned.version, action: 'publish' });
  const erased = await edit({ ...initial, id, photo: legacyPhoto, action: 'review' });
  const refused = await request('/api/newsroom', editor, { id, version: erased.version, action: 'publish' });
  assert.equal(refused.status, 422);
  assert.deepEqual(await publicPhoto(), photo);
});

test('la une peut être épinglée puis rendue à la publication automatique', async (t) => {
  const { mf, db, request, json, editorHeaders } = await createNewsroom(t, {});
  const leadPath = '/api/newsroom/lead';
  const setLead = async (articleId, email = editor, requestOrigin = origin) =>
    mf.dispatchFetch(origin + leadPath, { method: 'PUT', headers: {
      origin: requestOrigin, 'content-type': 'application/json',
      ...await editorHeaders(email),
    }, body: JSON.stringify({ articleId }) });
  const edit = (data) => json('/api/newsroom', { email: editor, data });
  assert.equal((await mf.dispatchFetch(origin + '/editeur', {redirect:'manual'})).headers.get('location'), 'https://byrvox.noventra.ca/admin');
  assert.match(await (await request('/admin')).text(), /Se connecter à la rédaction/);
  assert.match(await (await request('/admin', 'lecteur@example.invalid')).text(), /Se connecter à la rédaction/);
  assert.match(await (await request('/admin', editor)).text(), /Tableau de bord/);
  assert.equal((await request(leadPath)).status, 403);
  assert.equal((await setLead(null, 'lecteur@example.invalid')).status, 403);
  assert.equal((await setLead(null, editor, 'https://autre.example')).status, 403);
  assert.deepEqual(await json(leadPath, { email: editor }), { articleId: null, title: null });
  const first = await edit({ ...initial, title: 'Article régional', action: 'review' });
  assert.equal((await setLead(first.id)).status, 422);
  await edit({ id: first.id, version: first.version, action: 'publish' });
  const second = await edit({ ...initial, title: 'Article national', action: 'review' });
  await edit({ id: second.id, version: second.version, action: 'publish' });
  await db.prepare('UPDATE articles SET published_at = ? WHERE id = ?').bind('2024-01-01T00:00:00.000Z', first.id).run();
  const home = async () => (await request('/')).text();
  const isFirst = async (a, b) => {
    const markup = await home();
    const link = slug => 'href="/article/' + slug + '"';
    assert.ok(markup.indexOf(link(a)) >= 0 && markup.indexOf(link(a)) < markup.indexOf(link(b)));
  };
  await isFirst(second.slug, first.slug);
  assert.deepEqual(await (await setLead(first.id)).json(), { articleId: first.id, title: first.title });
  await isFirst(first.slug, second.slug);
  assert.equal((await setLead('inconnu')).status, 422);
  assert.equal((await json(leadPath, { email: editor })).articleId, first.id);
  assert.deepEqual(await (await setLead(null)).json(), { articleId: null, title: null });
  await isFirst(second.slug, first.slug);
});

test('une connexion éditeur revient sur le domaine Noventra et expire après sa révocation', async t => {
  const {mf} = await createNewsroom(t, {});
  const custom = origin;
  const provider = providerOrigin;
  const send = (url, options) => mf.dispatchFetch(url, {redirect:'manual', ...options});
  // The custom domain only accepts its own issued session.
  assert.equal((await send(custom+'/api/newsroom',{headers:{'oai-authenticated-user-id':'editor','oai-authenticated-user-email':editor}})).status,403);
  const start = await send(custom + '/api/editor-session/start');
  assert.equal(start.status,303);
  const proofCookie = start.headers.get('set-cookie').split(';')[0];
  const authorize = start.headers.get('location');
  assert.equal(new URL(authorize).origin,provider);
  assert.equal(new URL((await send(authorize)).headers.get('location')).pathname, '/signin-with-chatgpt');
  const unauth = await send(authorize, {headers:{'oai-authenticated-user-id':'reader', 'oai-authenticated-user-email':'reader@example.invalid'}});
  assert.equal(unauth.status,403);
  const issued = await send(authorize, {headers:{'oai-authenticated-user-id':'editor', 'oai-authenticated-user-email':editor}});
  assert.equal(issued.status,200);
  assert.equal(issued.headers.get('referrer-policy'),'origin');
  const grant = (await issued.text()).match(/name="grant" value="([0-9a-f]{64})"/)[1];
  const finish = (cookie, postOrigin) => send(custom+'/api/editor-session/finish',{method:'POST',headers:{
    origin:postOrigin, cookie,'content-type':'application/x-www-form-urlencoded'},body:'grant='+grant});
  assert.equal((await finish('',provider)).status,403);
  assert.equal((await finish(proofCookie,custom)).status,403);
  const accepted = await finish(proofCookie,provider);
  assert.equal(accepted.status,303);
  assert.equal(accepted.headers.get('location'),custom+'/admin');
  assert.equal((await finish(proofCookie,provider)).status,403);
  const cookie = accepted.headers.get('set-cookie').match(/__Host-byrvox-editor=[a-f0-9]{64}/)[0];
  assert.equal((await send(custom+'/api/newsroom',{headers:{cookie}})).status,200);
  assert.equal((await send(provider+'/api/newsroom',{headers:{cookie}})).status,403);
  assert.match(await (await send(custom+'/admin',{headers:{cookie}})).text(), /Tableau de bord/);
  assert.equal((await send(custom+'/api/editor-session/logout',{method:'POST',headers:{origin:custom, cookie}})).status,303);
  assert.equal((await send(custom+'/api/newsroom',{headers:{cookie}})).status,403);
});

test('les responsables configurent les espaces publicitaires sans écraser une campagne concurrente', async t => {
  const { mf, json, request, editorHeaders } = await createNewsroom(t);
  const endpoint = '/api/newsroom/ads';
  const approver = 'responsable-pub@example.invalid';
  const contributor = 'correspondant@example.invalid';
  for (const [email, role] of [[approver, 'approver'], [contributor, 'contributor']]) {
    await json('/api/newsroom/team', {email: editor, data: {email, role}});
  }
  const update = async (email, placement, from = origin) => mf.dispatchFetch(origin + endpoint, {
    method: 'PUT',
    headers: {...await editorHeaders(email), origin: from, 'content-type': 'application/json'},
    body: JSON.stringify(placement),
  });

  const { placements } = await json(endpoint, {email: editor});
  assert.deepEqual(placements.map(p => p.placement).sort(), [
    'article', 'article-photo', 'home', 'home-lower', 'masthead', 'news', 'news-lower', 'radio',
  ]);
  assert.ok(placements.every(p => p.mode === 'available' && p.version === 0));
  const initialHome = placements.find(p => p.placement === 'home');
  const creative = {...initialHome, mode: 'campaign', name: 'Annonceur test', url: 'https://example.org/campagne'};

  for (const email of [undefined, contributor]) {
    assert.equal((await request(endpoint, email)).status, 403);
    assert.equal((await update(email, creative)).status, 403);
  }
  assert.equal((await update(editor, creative, publicOrigin)).status, 403);
  for (const change of [
    {placement: 'emplacement-absent'}, {url: 'http://example.org'}, {name: ''},
    {image: '//example.org/banner.png', alt: 'Bannière'}, {image: '/brand/banner.png', alt: ''},
  ]) {
    assert.equal((await update(editor, {...creative, ...change})).status, 422);
  }

  const saved = await update(approver, creative);
  assert.equal(saved.status, 200);
  const { placement: first } = await saved.json();
  assert.deepEqual(first, {...creative, version: 1});
  assert.equal((await update(editor, creative)).status, 409);
  const paused = await update(editor, {...first, mode: 'hidden'});
  assert.equal(paused.status, 200);
  assert.equal((await update(approver, {...first, mode: 'available'})).status, 409);
  const current = (await json(endpoint, {email: approver})).placements;
  assert.deepEqual(current.find(p => p.placement === 'home'), {...first, mode: 'hidden', version: 2});
  assert.deepEqual(current.filter(p => p.placement !== 'home'), placements.filter(p => p.placement !== 'home'));
});

test('les responsables téléversent une bannière dont les lecteurs peuvent charger le fichier', async t => {
  const { mf, json, editorHeaders } = await createNewsroom(t);
  const url = origin + '/api/newsroom/ad-images';
  const approver = 'annonces@example.invalid';
  const contributor = 'contribution@example.invalid';
  for (const [email, role] of [[approver, 'approver'], [contributor, 'contributor']]) {
    await json('/api/newsroom/team', {email: editor, data: {email, role}});
  }
  const png = await readFile(resolve(root, 'public/brand/logo-dark.png'));
  const upload = async (email, from = origin, data = png) => mf.dispatchFetch(url, {
    method: 'POST',
    headers: {...await editorHeaders(email), origin: from, 'content-type': 'image/png'},
    body: data,
  });
  assert.equal((await upload(undefined)).status, 403);
  assert.equal((await upload(contributor)).status, 403);
  assert.equal((await upload(approver, publicOrigin)).status, 403);
  assert.equal((await upload(approver, origin, Buffer.from('Ceci est du texte.'))).status, 415);
  const saved = await upload(approver);
  assert.equal(saved.status, 201);
  const result = await saved.json();
  const image = await mf.dispatchFetch(publicOrigin + result.url);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
});

test('la rédaction consulte les comptes et applique immédiatement suspension, bannissement et rétablissement', async t => {
  const {mf, db, request, json, editorHeaders} = await createNewsroom(t);
  const endpoint = '/api/newsroom/readers';
  const userId = 'user_test_clerk';
  const email = 'camille@example.invalid';
  const approver = 'responsable@example.invalid';
  const contributor = 'contributeur@example.invalid';
  for (const [member,role] of [[approver,'approver'],[contributor,'contributor']]) {
    await json('/api/newsroom/team', {email:editor,data:{email:member,role}});
  }
  const at = new Date().toISOString();
  await db.prepare(`INSERT INTO reader_accounts(user_id,email,first_name,last_name,
    created_at,last_seen_at,last_ip,last_location) VALUES (?,?,?,?,?,?,?,?)`)
    .bind(userId,email,'Camille','Tremblay',at,at,'192.0.2.3','Montréal, Québec, CA').run();
  const token = randomBytes(32).toString('hex');
  const digest = createHash('sha256').update(token).digest('hex');
  await db.prepare('INSERT INTO reader_sessions(digest,user_id,expires_at) VALUES (?,?,?)')
    .bind(digest,userId,Math.floor(Date.now()/1000)+3600).run();
  const readerCookie = '__Host-byrvox-reader=' + token;
  const detail = endpoint + '?id=' + userId;
  const change = async (actor, expectedStatus, status, from = origin) =>
    mf.dispatchFetch(origin + endpoint,{method:'PATCH',headers:{
      ...await editorHeaders(actor), origin:from, 'content-type':'application/json',
    },body:JSON.stringify({userId,expectedStatus,status})});
  const visit = path => mf.dispatchFetch(publicOrigin + path, {headers:{cookie:readerCookie,accept:'text/html','sec-fetch-dest':'document'}});
  assert.equal((await request(detail)).status,403);
  assert.equal((await request(detail,contributor)).status,403);
  assert.equal((await mf.dispatchFetch(origin + detail,{headers:{cookie:readerCookie}})).status,403);
  assert.equal((await change(contributor,'active','banned')).status,403);
  assert.equal((await change(editor,'active','banned',publicOrigin)).status,403);

  const directory = await json(endpoint + '?search=Tremblay',{email:editor});
  assert.deepEqual(directory.readers.map(r => [r.userId,r.firstName,r.lastName,r.email,r.status]),
    [[userId,'Camille','Tremblay',email,'active']]);
  assert.equal((await json(endpoint + '?search=Introuvable',{email:approver})).readers.length,0);
  assert.equal((await request(endpoint + '?id=absent',editor)).status,404);
  const profile = await request(detail,approver);
  assert.match(profile.headers.get('cache-control'),/no-store/);
  const {reader} = await profile.json();
  assert.equal(reader.lastIp,'192.0.2.3');
  assert.equal(reader.lastLocation,'Montréal, Québec, CA');

  const article = '/article/notre-methode';
  assert.equal((await visit(article + '?source=lecture-privee')).status,200);
  const findPage = () => db.prepare("SELECT path FROM reader_activity WHERE user_id=? AND action='page' ORDER BY id DESC LIMIT 1")
    .bind(userId).first();
  for (let i=0; i<50 && !await findPage(); i++) await new Promise(done => setTimeout(done,20));
  assert.equal((await findPage())?.path,article);
  const pages = (await json(detail,{email:editor})).activity.filter(event=>event.action==='page');
  assert.equal(pages[0].path,article);
  assert.ok(pages[0].occurredAt);
  for (const status of ['suspended','banned']) {
    assert.equal((await change(approver,'active',status)).status,200);
    assert.equal((await change(editor,'active',status)).status,409);
    assert.equal((await visit(article)).status,403);
    assert.equal((await visit('/api/articles')).status,403);
    assert.equal((await mf.dispatchFetch(publicOrigin + article)).status,200);
    const restricted = (await json(detail,{email:editor})).reader;
    assert.equal(restricted.status,status);
    assert.equal(restricted.moderatedBy,approver);
    assert.ok(restricted.moderatedAt);
    assert.equal((await change(editor,status,'active')).status,200);
    assert.equal((await visit('/api/articles')).status,200);
  }
});

test('la connexion lecteur vérifie la session Clerk et enregistre les accès BYRVOX', async t => {
  const issuer = 'https://clerk.byrvox.today';
  const credential = 'sk_live_fixture';
  const {publicKey,privateKey} = generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk = {...publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'};
  const sub = 'user_0123456789abcdef';
  const sid = 'sess_0123456789abcdef';
  const now = Math.floor(Date.now()/1000);
  const claims = {iss:issuer,sub,sid,azp:publicOrigin,iat:now,exp:now+60,nbf:now-1};
  const token = (overrides = {}) => {
    const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const data = part({alg:'RS256',kid:jwk.kid,typ:'JWT'}) + '.' + part({...claims,...overrides});
    return data + '.' + sign('RSA-SHA256',Buffer.from(data),privateKey).toString('base64url');
  };
  let verification = 'verified';
  const bindings = {
    CLERK_PUBLISHABLE_KEY:'pk_live_' + Buffer.from('clerk.byrvox.today$').toString('base64'),
    CLERK_SECRET_KEY:credential,
  };
  const calls = [];
  const {mf,db,json} = await createNewsroom(t,bindings,async request => {
    calls.push(request.url);
    if (request.url === issuer + '/.well-known/jwks.json') {
      assert.equal(request.headers.get('authorization'),null);
      return Response.json({keys:[jwk]});
    }
    assert.equal(request.headers.get('authorization'),'Bearer ' + credential);
    if (request.url === 'https://api.clerk.com/v1/sessions/' + sid) {
      return Response.json({id:sid,user_id:sub,status:'active',expire_at:(now+3600)*1000});
    }
    if (request.url === 'https://api.clerk.com/v1/users/' + sub) {
      return Response.json({id:sub,first_name:'Sam',last_name:'Roy',primary_email_address_id:'idn_123',
        email_addresses:[{id:'idn_123',email_address:'sam@example.invalid',verification:{status:verification}}]});
    }
    return new Response(null,{status:404});
  });
  const activate = (jwt,from=publicOrigin) => mf.dispatchFetch(publicOrigin + '/api/reader-session/activate',{
    method:'POST',redirect:'manual',
    cf:{colo:'YUL',city:'Montreal',region:'Quebec',country:'CA'},
    headers:{origin:from,authorization:'Bearer '+jwt,'cf-connecting-ip':'192.0.2.21'},
  });
  for (const rejected of [
    await activate(token(),origin), await activate(token({azp:origin})),
    await activate(token({iat:now-3600,nbf:now-3600,exp:now-3500})),
  ]) {
    assert.ok([401,403].includes(rejected.status));
    assert.equal(rejected.headers.get('set-cookie'),null);
  }
  verification = 'unverified';
  const unverified = await activate(token());
  assert.equal(unverified.status,401,await unverified.text() + ' ' + JSON.stringify(calls));
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM reader_accounts').first()).n,0);
  verification = 'verified';
  const signedIn = await activate(token());
  assert.ok(signedIn.ok, signedIn.status + ' ' + await signedIn.text());
  const setCookie = signedIn.headers.get('set-cookie');
  assert.match(setCookie,/; Secure/i);
  assert.match(setCookie,/; HttpOnly/i);
  const cookie = setCookie.match(/__Host-byrvox-reader=[0-9a-f]{64}/)[0];
  const id = 'clerk:' + sub;
  const detail = () => json('/api/newsroom/readers?id=' + encodeURIComponent(id),{email:editor});
  const {reader,activity} = await detail();
  assert.deepEqual([reader.firstName,reader.lastName,reader.email],['Sam','Roy','sam@example.invalid']);
  assert.equal(reader.lastIp,'192.0.2.21');
  assert.equal(reader.lastLocation,'Montreal, Quebec, CA');
  assert.ok(activity.some(event => event.action==='signin'));
  assert.equal((await mf.dispatchFetch(origin + '/api/newsroom',{headers:{cookie}})).status,403);
  const out = await mf.dispatchFetch(publicOrigin + '/api/reader-session/logout',{
    method:'POST',headers:{origin:publicOrigin,cookie},redirect:'manual',
  });
  assert.ok(out.ok || out.status===303);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM reader_sessions').first()).n,0);
  assert.ok((await detail()).activity.some(event=>event.action==='signout'));
});

test('les préférences des lecteurs historiques restent liées au compte de leur fournisseur', async t => {
  const {mf,db,json} = await createNewsroom(t);
  const userId = 'native-history';
  const email = 'historique@example.invalid';
  const prefs = {saved:['notre-methode'],topics:['Canada']};
  await db.prepare('INSERT INTO preferences(user_id,data,updated_at) VALUES (?,?,?)')
    .bind(userId,JSON.stringify(prefs),new Date().toISOString()).run();
  const profile = (host,subject) => mf.dispatchFetch(host + '/api/profile',{headers:{
    'oai-authenticated-user-id':subject,'oai-authenticated-user-email':email,
  }});
  assert.equal((await profile(publicOrigin,userId)).status,401);
  assert.equal((await profile(origin,userId)).status,401);
  assert.equal((await profile(providerOrigin,'autre-compte')).status,401);
  const response = await profile(providerOrigin,userId);
  assert.equal(response.status,200);
  const account = await response.json();
  assert.equal(account.legacy,true);
  assert.deepEqual(account.preferences,prefs);
  const detail = await json('/api/newsroom/readers?id=' + userId,{email:editor});
  assert.equal(detail.reader.email,email);
  assert.equal(detail.reader.userId,userId);
});

test('une édition approuvée est livrée avec sa photo et peut être reprise sans modifier un article existant', async t => {
  const hour = new Date(Date.now()-3600000).toISOString().slice(0,13);
  const date = hour + ':00:00Z';
  const story = {
    eventKey:'actualite-locale-verifiee',title:'L’actualité de la ville confirmée par deux rédactions',
    summary:'La rédaction présente les faits relevés dans les sources consultées pour cette édition.',
    category:'Canada',body:'Des informations vérifiées ont été réunies dans l’édition horaire. '.repeat(7),
    translations:{en:{title:'A meeting in the city',summary:'The local newsroom reports from the meeting.',
      body:'Residents attended the meeting in the town square.',photoAlt:'View of the town square.',
      photoCaption:'The square where the meeting took place.'}},
    verified:true,sources:[{name:'Organisme régional',url:'https://alpha.example/evenement',publishedAt:date},
      {name:'Journal local indépendant',url:'https://beta.example/enquete',publishedAt:date}],
    photo:{download:'media/scene.webp',sourceUrl:'https://photo.example/scene',credit:'Photographe',
      license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',alt:'Une vue du quartier concerné.',
      caption:'Cette photographie montre le quartier où se tient la rencontre.'}
  };
  const all = [story,{...story,eventKey:'autre-evenement-regional',sources:[{...story.sources[0],url:'https://alpha.example/visite'},story.sources[1]]},
    {...story,eventKey:'autre-angle-edition',sources:[{...story.sources[0],url:story.sources[0].url+'?utm_medium=site'},story.sources[1]]},
    {...story,eventKey:'illustration-indisponible',photo:{...story.photo,download:'media/absente.webp'},sources:[{...story.sources[0],url:'https://alpha.example/autre'},story.sources[1]]},
    {...story,eventKey:'evenement-en-attente',sources:[story.sources[0],{...story.sources[0],url:'https://alpha.example/autre'}]},
    {...story,eventKey:'bulletin-officiel-journee-precedente',sources:[{
      ...story.sources[0],publishedAt:new Date(Date.parse(date)-86400000).toISOString()},story.sources[1]]}];
  const base = 'https://raw.githubusercontent.com/bv7k5ht77g-hue/BYRVOX/main/newswire/'+hour+'/';
  const picture = await readFile(resolve(root,'public/media/editorial/thumbs/canada-recettes-fermes-canola-neuf-mois.webp'));
  const seen = [];
  const {db,json,request} = await createNewsroom(t,{}, async req => {
    seen.push(req.url);
    if (req.url === base+'edition.json') return Response.json({hour,articles:all});
    if (req.url === base+'media/scene.webp') return new Response(picture, {headers:{'content-type':'image/webp'}});
    return new Response('Missing',{status:404});
  });
  const post = (rank,expected=200) => json('/api/newswire',{data:{hour,rank},expected});
  await json('/api/newswire',{data:{hour,rank:1,articles:all},expected:400});
  await json('/api/newswire',{data:{hour:'1999-01-01T00',rank:1},expected:400});
  assert.deepEqual(seen,[]);
  assert.equal((await post(1,201)).status,'published');
  const [row] = (await db.prepare('SELECT id,slug,photo,title FROM articles').all()).results;
  const photo = JSON.parse(row.photo);
  assert.equal(photo.licenseUrl,story.photo.licenseUrl);
  assert.deepEqual(new Uint8Array(await (await request(photo.url)).arrayBuffer()),new Uint8Array(picture));
  assert.ok((await (await request('/article/'+row.slug)).text()).includes(story.photo.credit));
  const translatedPage = await (await request('/article/'+row.slug+'?lang=en')).text();
  assert.ok(translatedPage.includes(story.translations.en.title));
  assert.ok(translatedPage.includes(story.translations.en.photoCaption));
  const edit = data => json('/api/newsroom',{email:editor,data});
  const reviewed = await edit({id:row.id,action:'review',version:0,title:'Correction de la rédaction',
    summary:story.summary,category:story.category,body:story.body,sources:story.sources,photo});
  assert.equal((await post(1)).status,'recorded');
  const corrected = await edit({id:row.id,action:'publish',version:reviewed.version});
  assert.equal(corrected.title,'Correction de la rédaction');
  assert.equal(corrected.photo.licenseUrl,story.photo.licenseUrl);
  assert.equal((await post(1)).status,'recorded');
  assert.equal((await post(3)).status,'duplicate');
  assert.equal((await db.prepare('SELECT title FROM articles WHERE id=?').bind(row.id).first()).title,'Correction de la rédaction');
  const concurrent = await Promise.all([1,2].map(()=>request('/api/newswire',null,{hour,rank:2})));
  assert.ok(concurrent.every(r=>r.status===200||r.status===201));
  await post(4,404);
  await post(5,422);
  assert.equal((await post(15)).status,'no_entry');
  assert.equal((await post(6,201)).status,'published');
  const registry = await json('/api/newswire');
  assert.equal(registry.recent.length,3);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM articles').first()).n,3);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM revisions WHERE action='publication-horaire'").first()).n,3);
  assert.ok(seen.every(url=>url.startsWith(base)));
});

test('les éditions thématique et horaire de la même heure ont leurs propres limites et reçus', async t => {
  const hour = new Date(Date.now() - 3600000).toISOString().slice(0, 13);
  const thematic = hour + '-thematique';
  const recentDate = hour + ':00:00Z';
  const contextDate = new Date(Date.parse(recentDate) - 10 * 86400000).toISOString();

  function article(eventKey, publishedAt) {
    return {
      eventKey, verified: true, category: 'Sciences', title: 'Une étude documentée dans plusieurs régions',
      summary: 'Les auteurs de deux enquêtes indépendantes ont rendu leurs observations publiques.',
      body: 'Les équipes ont comparé leurs observations et publié les résultats de leur étude. '.repeat(6),
      sources: ['observatoire', 'journal'].map(name => ({
        name, url: 'https://' + name + '.example/' + eventKey, publishedAt,
      })),
      photo: {
        download: 'media/etude.webp', sourceUrl: 'https://photo.example/etude',
        credit: 'Service photographique', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        alt: 'Le bâtiment où se déroule l’étude.', caption: 'Le bâtiment de recherche au moment de l’étude.',
      },
    };
  }

  const thematicStories = Array.from({length:16}, (_, i) => article('dossier-sciences-' + (i + 1), contextDate));
  const hourlyStories = [article('bulletin-sciences-recent', recentDate),article('bulletin-sciences-ancien', contextDate)];
  const manifests = new Map([[hour, thematicStories], [thematic, thematicStories]]);
  const picture = await readFile(resolve(root, 'public/media/editorial/thumbs/canada-recettes-fermes-canola-neuf-mois.webp'));
  const repo = 'https://raw.githubusercontent.com/bv7k5ht77g-hue/BYRVOX/main/newswire/';
  const {json} = await createNewsroom(t, {}, async req => {
    for (const [edition, articles] of manifests) {
      if (req.url === repo + edition + '/edition.json') return Response.json({hour:edition, articles});
      if (req.url === repo + edition + '/media/etude.webp') return new Response(picture, {headers:{'content-type':'image/webp'}});
    }
    return new Response(null, {status:404});
  });
  const deliver = (edition, rank, expected) => json('/api/newswire', {data:{hour:edition, rank}, expected});

  // The regular endpoint rejects rank 16, and its manifest cannot hide a sixteenth story behind rank 1.
  await deliver(hour, 16, 400);
  await deliver(hour, 1, 422);
  manifests.set(hour, hourlyStories);
  await deliver(hour, 2, 422);
  assert.deepEqual(await deliver(hour, 1, 201), {status:'published', slug:hourlyStories[0].eventKey});

  assert.deepEqual(await deliver(thematic, 16, 201), {status:'published', slug:thematicStories[15].eventKey});
  assert.deepEqual(await deliver(thematic, 1, 201), {status:'published', slug:thematicStories[0].eventKey});
  await deliver(thematic, 17, 400);

  for (const [edition, slug] of [[hour, hourlyStories[0].eventKey], [thematic, thematicStories[0].eventKey]]) {
    assert.deepEqual(await deliver(edition, 1, 200), {status:'recorded', slug});
  }
  const {recent} = await json('/api/newswire');
  assert.deepEqual(new Map(recent.map(({id,slug}) => [id,slug])), new Map([
    ['wire:' + hour + ':1', hourlyStories[0].eventKey],
    ['wire:' + thematic + ':1', thematicStories[0].eventKey],
    ['wire:' + thematic + ':16', thematicStories[15].eventKey],
  ]));
});

test('le lecteur propose des sujets proches puis des découvertes publiées, sans doublon', async t => {
  const { db, request } = await createNewsroom(t, {});
  const now = new Date().toISOString();
  const insert = db.prepare(`INSERT INTO articles
    (id, slug, title, category, summary, body, status, risk, created_at, updated_at, published_at, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'standard', ?, ?, ?, 'test')`);
  const sample = (slug, title, category, status='published') =>
    insert.bind(slug, slug, title, category, title, title, status, now, now, now);
  await sample('le-tunnel', 'La réfection du tunnel de Montréal', 'Transports').run();
  const html = async () => {
    const res = await request('/article/le-tunnel');
    assert.equal(res.status, 200);
    return res.text();
  };
  assert.doesNotMatch(await html(), /id="recommended-list"/);
  await db.batch([
    sample('tunnel-chantier', 'Un nouveau chantier pour le tunnel de Montréal', 'Économie'),
    sample('secteur-aerien', 'Le patron des lignes aériennes quitte son poste', 'Transports'),
    sample('brouillon', 'Un secret sur le tunnel de Montréal', 'Transports', 'draft'),
    sample('festival', 'Un festival primé à Cannes', 'Culture'),
    sample('patinage', 'La patineuse remporte la finale', 'Sports'),
  ]);
  const page = await html();
  assert.ok(page.indexOf('id="recommended-list"') < page.indexOf('data-ad-slot="article"'));
  assert.ok(page.indexOf('id="recommended-list"') < page.indexOf('id="sources"'));
  const list = page.match(/<ol\b[^>]*id="recommended-list"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(list);
  const slugs = [...list.matchAll(/href="\/article\/([^"]+)"/g)].map(match=>match[1]);
  assert.equal(slugs[0], 'tunnel-chantier');
  assert.deepEqual(new Set(slugs.slice(1)),new Set(['secteur-aerien','festival','patinage']));
  assert.equal((list.match(/Sur le même sujet/g)||[]).length,1);
  assert.equal(slugs.length,4);

  await db.prepare('UPDATE articles SET author_id = ? WHERE slug = ?').bind('byrvox-agent-horaire','le-tunnel').run();
  const arabic = await (await request('/article/le-tunnel?lang=ar')).text();
  assert.match(arabic, /lang="ar" dir="rtl"/);
  assert.match(arabic, /إصدار BYRVOX الآلي/);
  assert.match(arabic, /href="\/article\/tunnel-chantier\?lang=ar"/);
  assert.match(arabic, /<h1 lang="fr"/);

  await db.batch([
    sample('paris-rome','Le PSG concède le nul à Rome en Ligue des champions','Sports'),
    sample('paris-qualifie','Le Paris Saint-Germain se qualifie pour la finale','Soccer'),
    sample('autre-match','Villarreal se relance en Ligue des champions','Soccer'),
    sample('canadien-hockey','Le capitaine du Canadien de Montréal mène le pointage dans la LNH','LNH'),
  ]);
  const soccer = await (await request('/article/paris-rome')).text();
  const carousel = soccer.match(/<ol\b[^>]*id="recommended-list"[^>]*>([\s\S]*?)<\/ol>/)?.[1] || '';
  const relatedCards = [...carousel.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
    .filter(match=>match[1].includes('Sur le même sujet')).map(match=>match[1].match(/href="\/article\/([^"]+)"/)?.[1]);
  assert.deepEqual(new Set(relatedCards),new Set(['paris-qualifie','autre-match']));
  assert.ok(carousel.indexOf('Sur le même sujet') < carousel.indexOf('À découvrir'));
});

test('les invitations séparent la contribution, l’approbation et la gestion de l’équipe', async t => {
  const {mf, json, request, editorHeaders} = await createNewsroom(t, {}, () => new Response(null, {status:503}));
  const newsroom = '/api/newsroom';
  const team = '/api/newsroom/team';
  const contributor = 'auteur@example.invalid';
  const other = 'reporter@example.invalid';
  const approver = 'approbateur@example.invalid';
  const providerHeaders = email => ({
    'oai-authenticated-user-id': 'test-' + email,
    'oai-authenticated-user-email': email,
  });
  const write = (email, data) => json(newsroom, {email, data});
  const dashboard = email => json(newsroom, {email});
  const changeTeam = async (actor, method, data, from = origin) =>
    mf.dispatchFetch(origin + team, {method, headers:{
      ...await editorHeaders(actor), origin:from, 'content-type':'application/json',
    }, body:JSON.stringify(data)});
  const success = async response => {
    assert.ok(response.ok, response.status + ' ' + (await response.text()).slice(0,120));
  };
  const refused = response => assert.ok(response.status >= 400 && response.status < 500,
    'Refus attendu, statut ' + response.status);

  const owners = await json(team, {email:editor});
  assert.ok(owners.owners.includes(editor));
  assert.equal((await dashboard(editor)).role, 'owner');
  assert.equal((await request(team, contributor)).status, 403);
  assert.equal((await request(newsroom, contributor)).status, 403);
  assert.equal((await changeTeam(contributor, 'POST', {email:contributor, role:'approver'})).status, 403);
  assert.equal((await changeTeam(editor, 'POST', {email:contributor, role:'approver'}, 'https://foreign.example.invalid')).status, 403);
  refused(await changeTeam(editor, 'POST', {email:contributor, role:'owner'}));
  refused(await changeTeam(editor, 'DELETE', {email:editor}));
  for (const [email, role] of [[contributor,'contributor'],[other,'contributor'],[approver,'approver']]) {
    await success(await changeTeam(editor, 'POST', {email, role}));
  }
  await success(await changeTeam(editor, 'POST', {email:contributor.toUpperCase(),role:'contributor'}));
  const {members} = await json(team, {email:editor});
  assert.equal(members.length,3);
  const invited = members.find(member => member.email === contributor);
  assert.equal(invited.role, 'contributor');
  assert.equal(invited.acceptedAt, null);

  const custom = origin;
  const provider = providerOrigin;
  const start = await mf.dispatchFetch(custom + '/api/editor-session/start', {redirect:'manual'});
  const authorize = start.headers.get('location');
  assert.equal(new URL(authorize).origin, provider);
  const authorized = await mf.dispatchFetch(authorize, {redirect:'manual', headers:providerHeaders(contributor)});
  assert.equal(authorized.status, 200);
  const grant = (await authorized.text()).match(/name="grant" value="([0-9a-f]{64})"/)[1];
  const proofCookie = start.headers.get('set-cookie').split(';')[0];
  const finish = await mf.dispatchFetch(custom + '/api/editor-session/finish', {method:'POST', redirect:'manual',
    headers:{origin:provider,cookie:proofCookie,'content-type':'application/x-www-form-urlencoded'},body:'grant='+grant});
  assert.equal(finish.status,303);
  const sessionCookie = finish.headers.get('set-cookie').match(/__Host-byrvox-editor=[a-f0-9]{64}/)[0];
  const sessionDashboard = () => mf.dispatchFetch(custom + newsroom, {headers:{cookie:sessionCookie}});
  const activeSession = await sessionDashboard();
  assert.equal(activeSession.status, 200);
  assert.equal((await activeSession.json()).role, 'contributor');
  const accepted = (await json(team, {email:editor})).members.find(member => member.email === contributor);
  assert.ok(accepted.acceptedAt);
  const differentAccount = await mf.dispatchFetch(origin + newsroom, {
    headers: await editorHeaders(contributor, 'other-provider-account'),
  });
  assert.equal(differentAccount.status, 403);
  assert.equal((await dashboard(approver)).role, 'approver');
  for (const actor of [contributor, approver]) {
    assert.equal((await request(team, actor)).status,403);
    assert.equal((await changeTeam(actor, 'POST', {email:other, role:'approver'})).status, 403);
    assert.equal((await changeTeam(actor, 'DELETE', {email:other})).status, 403);
  }
  for (const path of ['/api/newsroom/edition','/api/pulse','/api/generate']) {
    assert.equal((await request(path, contributor, {})).status, 403, path);
  }

  const otherDraft = await write(other, {...initial, title:'Sujet réservé au second auteur'});
  const png = await readFile(resolve(root, 'public/brand/logo-dark.png'));
  const uploaded = await mf.dispatchFetch(origin + newsroom + '/photos', {method:'POST',
    headers:{...await editorHeaders(contributor),origin,'content-type':'image/png'},body:png});
  assert.equal(uploaded.status, 201);
  const {url} = await uploaded.json();
  assert.equal((await request(url, contributor)).status, 200);
  assert.equal((await request(url, approver)).status, 200);
  assert.equal((await request(url, other)).status, 404);
  assert.equal((await request(url)).status, 404);
  const photo = {url, alt:'Photo de la rédaction', credit:'Photographe', caption:'Une scène locale.'};
  refused(await request(newsroom, other, {...initial, id:otherDraft.id, version:otherDraft.version, photo}));
  const draft = await write(contributor, {...initial, photo});
  const mine = await dashboard(contributor);
  assert.deepEqual(mine.articles.map(article => article.id), [draft.id]);
  assert.ok(mine.revisions.every(revision => revision.articleId === draft.id));
  const updated = await write(contributor, {...initial, title:'Titre soumis par le collaborateur', photo,
    id:draft.id, version:draft.version});
  refused(await request(newsroom, contributor, {...initial, id:otherDraft.id, version:otherDraft.version}));
  refused(await request(newsroom, other, {...initial, id:draft.id, version:updated.version, action:'review'}));
  const review = await write(contributor, {...initial, photo, id:draft.id, version:updated.version, action:'review'});
  assert.equal(review.status,'review');
  assert.deepEqual((await dashboard(approver)).reviewQueue.map(article => article.id),[draft.id]);
  assert.deepEqual(await json('/api/articles'), []);
  assert.equal((await request(url)).status, 404);
  for (const action of ['publish','return','restore','save']) {
    refused(await request(newsroom, contributor, {...initial, id:draft.id, version:review.version, action}));
  }
  const returned = await write(approver, {id:draft.id, version:review.version, action:'return'});
  assert.equal(returned.status,'draft');
  const again = await write(contributor, {...initial, photo, title:'Version corrigée après relecture',
    id:draft.id, version:returned.version, action:'review'});
  const live = await write(approver, {id:draft.id, version:again.version, action:'publish'});
  assert.equal(live.status,'published');
  assert.deepEqual((await dashboard(approver)).reviewQueue,[]);
  assert.equal((await json('/api/articles'))[0].title, again.title);
  refused(await request(newsroom, contributor, {...initial, id:draft.id, version:live.version, action:'save'}));
  assert.equal((await request(url)).status, 200);

  // Changing and revoking a role must affect the session already issued on the custom domain.
  await success(await changeTeam(editor, 'POST', {email:contributor, role:'approver'}));
  assert.equal((await (await sessionDashboard()).json()).role, 'approver');
  await success(await changeTeam(editor, 'DELETE', {email:contributor}));
  assert.equal((await sessionDashboard()).status, 403);
  assert.equal((await request(newsroom, contributor)).status, 403);
  assert.equal((await request(newsroom, contributor, initial)).status, 403);
  assert.equal((await mf.dispatchFetch(origin + newsroom + '/photos', {method:'POST',
    headers:{...await editorHeaders(contributor),origin,'content-type':'image/png'},body:png})).status,403);
  await success(await changeTeam(editor, 'POST', {email:contributor, role:'contributor'}));
  assert.equal((await sessionDashboard()).status, 403);
});

test('les éditions de novembre distinguent dossier, discipline et simple coïncidence géographique', async t => {
  const {db, request} = await createNewsroom(t,{});
  const at = '2026-11-26T00:00:00Z';
  const bind = db.prepare(`INSERT INTO articles
    (id,slug,title,category,summary,body,status,risk,created_at,updated_at,published_at,author_id)
    VALUES (?,?,?,?,?,?,'published','standard',?,?,?,'test')`);
  const articles = [];
  for (const edition of ['2026-11-26T00','2026-11-26T01-thematique']) {
    const manifest = JSON.parse(await readFile(resolve(root,'newswire',edition,'edition.json'),'utf8'));
    articles.push(...manifest.articles.map(s=>({slug:s.eventKey,title:s.title,summary:s.summary,category:s.category})));
  }
  // The translated archive retains the exact published French headlines and decks.
  const archive = JSON.parse(await readFile(resolve(root,'lib/translations/en.json'),'utf8'));
  const iowa = 'iowa-middletown-departs-temporaires-detonation-controlee';
  const elections = 'cap-vert-presidentielle-neves-abstention';
  const bepicolombo = 'bepicolombo-orbite-mercure-freinage';
  for (const [slug,category] of [[iowa,'États-Unis'],[elections,'International'],[bepicolombo,'Espace']]) {
    const {sourceTitle:title,sourceSummary:summary}=archive[slug];
    articles.push({slug,category,title,summary});
  }
  await db.batch(articles.map(s=>bind.bind(s.slug,s.slug,s.title,s.category,s.summary,s.summary,at,at,at)));
  const related = async slug => {
    const response=await request('/article/'+slug);
    assert.equal(response.status,200);
    const content=await response.text();
    const rail=content.match(/<ol\b[^>]*id="recommended-list"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
    assert.ok(rail,'carrousel de '+slug);
    return new Set([...rail.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].filter(x=>x[1].includes('Sur le même sujet'))
      .map(x=>x[1].match(/href="\/article\/([^"]+)"/)?.[1]));
  };
  const prior='middletown-iowa-premieres-mesures-air-apres-operation';
  const follow='middletown-fin-alerte-habitants-resultats-sols-eau';
  const cuba='cuba-dix-ans-fidel-castro-veillee-universite-2026';
  const psg='paris-roma-malen-penalty-ligue-champions-2026-11-25';
  assert.deepEqual(await related(follow),new Set([iowa,prior]));
  assert.deepEqual(await related(prior),new Set([iowa,follow]));
  assert.deepEqual(await related(cuba),new Set());
  assert.deepEqual(await related('haiti-elections-2027-candidatures-novembre-2026'),new Set([elections]));
  assert.deepEqual(await related('iss-progress-97-cygnus-ravitaillements-novembre'),new Set(['shenzhou-24-premier-astronaute-pakistanais-tiangong']));
  assert.deepEqual(await related('ethiopie-fentale-methane-volcan-satellites'),new Set());
  assert.deepEqual(await related('hera-dimorphos-blocs-orbite-novembre-2026'),new Set([bepicolombo]));
  assert.deepEqual(await related('colorado-cale-makar-retour-contre-canadien-2026-11-25'),new Set(['edmonton-vegas-double-eichel-connelly-2026-11-24']));
  assert.deepEqual(await related('prague-villarreal-buchanan-ligue-champions-2026-11-25'),new Set([psg,'lille-bayern-ligue-des-champions-2026-11-25']));
});

test('les pages publiques rendent les annonces actives et retirent les emplacements masqués', async t => {
  const {mf, db} = await createNewsroom(t);
  const read = async path => {
    const response = await mf.dispatchFetch(publicOrigin + path);
    assert.equal(response.status, 200);
    return response.text();
  };
  const home = await read('/?lang=en');
  assert.match(home, /data-ad-slot="home"/);
  assert.match(home, /Advertising space available/);

  const insert = db.prepare('INSERT INTO ad_placements (placement, mode, name, url, image, alt, version) VALUES (?, ?, ?, ?, ?, ?, 1)');
  await db.batch([
    insert.bind('home', 'hidden', 'Campagne en réserve', '', '', ''),
    insert.bind('radio', 'campaign', 'Annonce radio', 'https://example.org/radio', '', ''),
    insert.bind('article-photo', 'campaign', 'Annonce illustrée', 'https://example.org/article', 'https://example.org/banniere.jpg', 'Bannière de campagne'),
  ]);
  const updatedHome = await read('/');
  assert.doesNotMatch(updatedHome, /data-ad-slot="home"/);
  assert.doesNotMatch(updatedHome, /Campagne en réserve/);
  const radio = await read('/?rubrique=radio');
  const radioAd = radio.match(/<aside[^>]*data-ad-slot="radio"[^>]*>[\s\S]*?<\/aside>/)?.[0];
  assert.ok(radioAd);
  assert.match(radioAd, /Annonce radio/);
  assert.match(radioAd, /href="https:\/\/example.org\/radio"/);
  assert.doesNotMatch(radioAd, /<img/);

  const article = await read('/article/notre-methode');
  const photoAd = article.match(/<aside[^>]*data-ad-slot="article-photo"[^>]*>[\s\S]*?<\/aside>/)?.[0];
  assert.ok(photoAd);
  assert.match(photoAd, /rel="sponsored"/);
  assert.match(photoAd, /alt="Bannière de campagne"/);
  assert.match(photoAd, /src="https:\/\/example.org\/banniere.jpg"/);
  assert.match(article, /data-ad-slot="article"/);
});
