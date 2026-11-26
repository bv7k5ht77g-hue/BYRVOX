import assert from 'node:assert/strict';
import test from 'node:test';
import { adScriptDocument, parseAdFrame, parseAdScript, validAdFrameUrl, validAdScriptUrl } from '../lib/ad-frame.mjs';

test('un cadre publicitaire conserve seulement la source externe et le titre', () => {
  assert.deepEqual(parseAdFrame('<iframe width="300" height="250" frameborder="0" src="https://ads.example.com/frame?size=wide&amp;lang=fr" title="Annonces &amp; partenaires" allow="camera" sandbox="allow-same-origin"></iframe>'), {
    url: 'https://ads.example.com/frame?size=wide&lang=fr', name: 'Annonces & partenaires',
  });
  assert.deepEqual(parseAdFrame("<iframe src='https://ads.example.com/banner'></iframe>"), {
    url:'https://ads.example.com/banner', name:'ads.example.com',
  });
});

test('les formats non pris en charge et les origines privées ou éditoriales sont refusés', () => {
  assert.equal(validAdFrameUrl('https://corpo.noventra.ca/campagnes/noventra'), true);
  assert.equal(validAdFrameUrl('https://media.other.chatgpt.site/campaign'), true);
  for (const source of ['http://ads.example.org/banner', 'https://user@ads.example.org/banner', '/banner', 'https://localhost/banner',
    'https://127.0.0.1/banner', 'https://[::1]/banner', 'https://2130706433/banner','https://portal.byrvox.today/banner',
    'https://byrvox.noventra.ca./admin', 'https://byrvox.h2y4xnnm6g.chatgpt.site/account', 'https://192.168.4.7/banner', 'https://intranet.local/banner']) {
    assert.equal(validAdFrameUrl(source), false);
  }
  for (const markup of ['<script></script>', '<iframe src="https://ads.example.org" srcdoc="x"></iframe>',
    '<iframe src="https://ads.example.org" onload="x"></iframe>', '<iframe src="https://ads.example.org" src="https://second.example.org"></iframe>',
    '<iframe src="https://ads.example.org"><form></form></iframe>', '<iframe src="https://ads.example.org"></iframe><script></script>']) {
    assert.equal(parseAdFrame(markup), null);
  }
});

test('un script publicitaire classique conserve seulement sa source et le nom de la régie', () => {
  assert.deepEqual(parseAdScript('<script async defer type="text/javascript" crossorigin="anonymous" src="https://ads.example.org/spot.js?slot=7&amp;lang=fr"> </script>'), {
    url: 'https://ads.example.org/spot.js?slot=7&lang=fr', name: 'ads.example.org',
  });
  assert.equal(validAdScriptUrl('https://corpo.noventra.ca/campagne'), true);
  for (const url of ['https://byrvox.today/api', 'https://127.0.0.1/spot', 'https://pagead2.googlesyndication.com./pagead/js/adsbygoogle.js']) {
    assert.equal(validAdScriptUrl(url), false);
    assert.equal(adScriptDocument(url), undefined);
  }
  for (const tag of ['<script src="https://ads.example.org/spot.js">initialize()</script>',
    '<script src="https://ads.example.org/spot.js" onload="initialize()"></script>',
    '<script type="module" src="https://ads.example.org/spot.js"></script>',
    '<script crossorigin="use-credentials" src="https://ads.example.org/spot.js"></script>',
    '<script src="https://ads.example.org/one" src="https://ads.example.org/two"></script>',
    '<script src="https://ads.example.org/one"></script><script src="https://ads.example.org/two"></script>']) {
    assert.equal(parseAdScript(tag), null);
  }
});

test('le document isolé contient une balise construite avec une URL échappée', () => {
  const doc = adScriptDocument('https://ads.example.org/spot.js?caption="ok"&lang=fr');
  assert.ok(doc.includes('<script src="https://ads.example.org/spot.js?caption=%22ok%22&amp;lang=fr" referrerpolicy="no-referrer"></script>'));
  assert.equal(doc.match(/<script\b/g)?.length, 1);
  assert.ok(doc.includes('<meta name="referrer" content="no-referrer">'));
});
