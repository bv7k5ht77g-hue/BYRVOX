import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseAdSenseSnippet} from '../lib/adsense.mjs';

const client = 'ca-pub-1234567890123456';
const slot = '0123456789';
const script = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}"
  crossorigin="anonymous"></script>`;
const unit = `<!-- En-tête --><ins class="adsbygoogle" style="display:block" data-ad-client="${client}"
  data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;

test('importe le chargeur ou le bloc responsive en ne conservant que les identifiants', () => {
  assert.deepEqual(parseAdSenseSnippet(script), {client,slot:''});
  assert.deepEqual(parseAdSenseSnippet(script + unit), {client,slot});
  assert.deepEqual(parseAdSenseSnippet(unit), {client,slot});
});

test('rejette les extraits incomplets, incohérents ou extérieurs au format pris en charge', () => {
  for (const invalid of ['', script.slice(0,-4), script + unit.replace(client,'ca-pub-9999999999999999'),
    script.replace('.com/', '.com.example/'), script.replace('async ', 'onload="alert(1)" '),
    unit.replace('0123456789','1234'), unit.replace('display:block','display:none'), script + '<iframe></iframe>',
    unit.replace('push({})','push({other:1})'), script + script, unit + unit]) {
    assert.equal(parseAdSenseSnippet(invalid), null);
  }
});
