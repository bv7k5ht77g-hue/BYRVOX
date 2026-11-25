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
