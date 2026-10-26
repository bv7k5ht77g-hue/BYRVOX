import test from 'node:test';import assert from 'node:assert/strict';import{publicationError,canAutoPublish,slugify}from'../lib/editorial.mjs';
const article={title:'Un article',summary:'Résumé',body:'Texte',status:'review',sources:[{name:'NASA',url:'https://www.nasa.gov/'}]};
test('rejects missing source',()=>assert.match(publicationError({...article,sources:[]}),/source/));
test('rejects unsafe source protocols',()=>assert.match(publicationError({...article,sources:[{name:'X',url:'javascript:alert(1)'}]}),/HTTPS/));
test('requires review before publication',()=>assert.match(publicationError({...article,status:'draft'}),/vérification/));
test('accepts complete reviewed article',()=>assert.equal(publicationError(article),null));
test('malformed stored source JSON fails closed',()=>assert.match(publicationError({...article,sources:'bad-json'}),/invalides/));
test('automatic publication remains disabled',()=>assert.equal(canAutoPublish({...article,risk:'sensitive'}),false));
test('slugs normalize accents and punctuation',()=>assert.equal(slugify('Économie : l’avenir ?'),'economie-l-avenir'));
