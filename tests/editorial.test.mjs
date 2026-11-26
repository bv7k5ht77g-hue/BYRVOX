import test from 'node:test';import assert from 'node:assert/strict';import{publicationError,canAutoPublish,slugify}from'../lib/editorial.mjs';
const article={title:'Un article',summary:'Résumé',body:'Texte',status:'review',sources:[{name:'NASA',url:'https://www.nasa.gov/'}]};
test('rejects missing source',()=>assert.match(publicationError({...article,sources:[]}),/source/));
test('rejects unsafe source protocols',()=>assert.match(publicationError({...article,sources:[{name:'X',url:'javascript:alert(1)'}]}),/HTTPS/));
test('requires review before publication',()=>assert.match(publicationError({...article,status:'draft'}),/vérification/));
test('accepts complete reviewed article',()=>assert.equal(publicationError(article),null));
test('malformed stored source JSON fails closed',()=>assert.match(publicationError({...article,sources:'bad-json'}),/invalides/));
test('manual drafts require editorial review',()=>assert.equal(canAutoPublish({...article,risk:'sensitive'}),false));
test('slugs normalize accents and punctuation',()=>assert.equal(slugify('Économie : l’avenir ?'),'economie-l-avenir'));

test('rejects relative, abbreviated and malformed HTTPS addresses', () => {
  for (const url of ['/article', '//example.org/article', 'https:example.org', 'https:/path', 'https:///path', 'https://', 'https://bad host/']) {
    assert.match(publicationError({ ...article, sources: [{ name: 'Source', url }] }), /HTTPS/, url);
  }
});

test('rejects a username or password in a source URL', () => {
  for (const url of ['https://editor@example.org/report', 'https://:secret@example.org/report']) {
    assert.match(publicationError({ ...article, sources: [{ name: 'Source', url }] }), /identifiants/);
  }
});

test('requires a text name and URL on every stored source', () => {
  for (const source of [null, 'source', {}, { name: '   ', url: 'https://example.org/' },
    { name: 42, url: 'https://example.org/' }, { name: 'Source', url: ['https://example.org/'] }]) {
    const sources = JSON.stringify([...article.sources, source]);
    assert.match(publicationError({ ...article, sources }), /source/);
  }
});

test('accepts a named absolute HTTPS link stored in a revision', () => {
  const sources = JSON.stringify([{ name: ' Archives ', url: 'HTTPS://archives.example.org:8443/rapport?id=42#sources' }]);
  assert.equal(publicationError({ ...article, sources }), null);
});
