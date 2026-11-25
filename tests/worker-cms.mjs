// Run after npm run build: node --test tests/worker-cms.mjs
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Miniflare } = createRequire(require.resolve('wrangler/package.json'))('miniflare');
const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://byrvox.test';
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

async function createNewsroom(t, editionBindings) {
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

  function request(path, email, data) {
    const headers = new Headers();
    if (email) {
      headers.set('oai-authenticated-user-id', 'test-' + email);
      headers.set('oai-authenticated-user-email', email);
    }
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
  return { mf, db, request, json };
}

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
  const { mf, db, request, json } = await createNewsroom(t, {});
  const uploadPath = origin + '/api/newsroom/photos';
  const png = await readFile(resolve(root, 'public/brand/logo-dark.png'));
  const webp = await readFile(resolve(root, 'public/media/news.webp'));
  // A complete one-pixel grayscale JPEG.
  const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8Af3//2Q==', 'base64');

  function upload(body, type, email = editor, from = origin) {
    const headers = new Headers({ 'content-type': type, origin: from });
    if (email) {
      headers.set('oai-authenticated-user-id', 'test-' + email);
      headers.set('oai-authenticated-user-email', email);
    }
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
});

test('la une peut être épinglée puis rendue à la publication automatique', async (t) => {
  const { mf, db, request, json } = await createNewsroom(t, {});
  const leadPath = '/api/newsroom/lead';
  const setLead = (articleId, email = editor, requestOrigin = origin) =>
    mf.dispatchFetch(origin + leadPath, { method: 'PUT', headers: {
      origin: requestOrigin, 'content-type': 'application/json',
      'oai-authenticated-user-id': 'test-' + email, 'oai-authenticated-user-email': email,
    }, body: JSON.stringify({ articleId }) });
  const edit = (data) => json('/api/newsroom', { email: editor, data });
  for (const path of ['/admin', '/editeur']) {
    const login = await mf.dispatchFetch(origin + path, { redirect: 'manual' });
    const target = login.headers.get('location');
    assert.ok(target, 'Le portail anonyme doit renvoyer vers la rédaction sécurisée.');
    if (path === '/editeur') {
      assert.equal(target, 'https://byrvox.h2y4xnnm6g.chatgpt.site/admin');
    } else {
      assert.equal(new URL(target, origin).searchParams.get('return_to'), '/admin');
    }
    assert.match(await (await request(path, 'lecteur@example.invalid')).text(), /Accès réservé/);
    assert.equal((await request(path, editor)).status, 200);
  }
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
