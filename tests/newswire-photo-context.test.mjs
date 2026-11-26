import assert from 'node:assert/strict';
import { test } from 'node:test';
import { articleError } from '../lib/newswire/edition.ts';
import { validBlueskyPost } from '../lib/editorial.mjs';

const hour = '2026-11-26T22';
const now = Date.parse('2026-11-26T22:00:00Z');
const story = {
  title: 'Rayan Cherki égalise avec Manchester City',
  summary: 'Manchester City et Naples repartent avec un point.',
  body: 'Rayan Cherki marque en fin de rencontre.',
  sources: ['uefa.com', 'exemple.fr'].map(host => ({url:'https://' + host, publishedAt:'2026-11-26'})),
  photo: {download:'media/cherki.webp', subject:'Rayan Cherki', context:'Manchester City', capturedOn:'2026-11-24',
    alt:'Rayan Cherki, en maillot de Manchester City, contrôle le ballon.', caption:'Cherki lors du match contre Naples.'},
};
const validate = (patch, edition=hour) => articleError({...story, photo:{...story.photo, ...patch}}, edition, now);

test('le sujet et son contexte doivent correspondre à la fois au texte et à la description de la photo', () => {
  assert.equal(validate({}), null);
  assert.match(validate({alt:'Rayan Cherki joue en équipe de France.'}), /contexte/);
  assert.match(validate({context:'équipe de France', alt:'Rayan Cherki avec l’équipe de France.'}), /contexte/);
  assert.match(validate({context:undefined}), /contexte/);
  assert.equal(validate({context:undefined,capturedOn:undefined}, '2026-11-26T21'), null);
});

test('la date originale respecte la précision de la source et le calendrier', () => {
  for (const capturedOn of ['2024', '2026-11', '2024-02-29', '2026-11-26']) {
    assert.equal(validate({capturedOn}), null);
  }
  for (const capturedOn of ['2025-02-29','2026-04-31','2026-00','2026-13','2026-11-27','2026-12','2027']) {
    assert.match(validate({capturedOn}), /impossible ou future/);
  }
  assert.match(validate({capturedOn:'novembre 2026'}), /photo.capturedOn/);
  assert.match(validate({capturedOn:undefined}), /photo.capturedOn/);
});

test('une illustration de référence non datée le signale dans la légende', () => {
  const reference = {...story, category:'Santé', title:'Les autorités publient leur bilan de la rougeole',
    summary:'Un nouveau bilan de la rougeole est disponible.', body:'La rougeole fait l’objet d’une surveillance.',
    photo:{...story.photo,subject:'rougeole',context:'rougeole',capturedOn:null,
      alt:'Particule du virus de la rougeole au microscope.',caption:'Micrographie du virus de la rougeole.'}};
  assert.match(articleError(reference, hour, now), /non datée/);
  reference.photo.caption = 'Micrographie non datée du virus de la rougeole.';
  assert.equal(articleError(reference, hour, now), null);
});

test('le champ de publication accepte uniquement un permalien Bluesky stable', () => {
  const post = 'https://bsky.app/profile/did:plc:zi55hvfbtohpdx7y35viqqma/post/3n33hzavdwk2e';
  assert.ok(validBlueskyPost(post));
  for (const address of [post + '?source=web', post + '#cover', post + '/embed', post.replace('bsky.app','autre.example'),
    post.replace('https:', 'http:'),post.replace('did:plc:', 'other:'), post.replace('/profile/', '/profile/../')]) {
    assert.equal(validBlueskyPost(address), false);
  }
});
