// Run after npm run build: node --test tests/worker-cms.mjs
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
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

test('le Worker distingue les versions publiques et les révisions de la rédaction', async (t) => {
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
    bindings: { ADMIN_EMAILS: editor },
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
});
