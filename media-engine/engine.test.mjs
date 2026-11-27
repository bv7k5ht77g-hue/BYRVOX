import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makePlan, selectPlans, scan, render } from './engine.mjs';
const article = { slug:'test-editorial',title:'Un titre de test',summary:'Une information de test. Un contexte de test.',publishedAt:new Date().toISOString(),status:'published',photo:{url:'/api/photos/test.jpg',credit:'Test',license:'CC BY'} };
test('stable key, brand isolation, correction tracking and no external publishing',()=>{
  const p=makePlan('byrvox',article);
  assert.equal(p.id,makePlan('byrvox',article).id);
  assert.notEqual(p.id,makePlan('buzzeur',article).id);
  assert.notEqual(p.id,makePlan('byrvox',{...article,summary:'Texte corrigé.'}).id);
  assert.equal(p.status,'review_required');
  assert.equal(p.distribution.length,5);
  assert.ok(p.distribution.every(x=>x.status==='not_connected'));
  assert.equal(p.visualPolicy,'text_only_until_audiovisual_rights_confirmed');
  assert.throws(()=>makePlan('byrvox',{...article,status:'draft'}));
});
test('reject stale, future, duplicate and draft records',()=>{
  const now=Date.now();
  const result=selectPlans('byrvox',[article,article,{...article,slug:'old',publishedAt:new Date(now-25*3600000).toISOString()},{...article,slug:'future',publishedAt:new Date(now+3600000).toISOString()},{...article,slug:'draft',status:'draft'}],{now});
  assert.equal(result.length,1);
});
test('scanner writes once and blocks unknown Buzzeur feed',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'media-test-'));
  try {
    const fetcher=async url=>{assert.equal(url.href,'https://byrvox.today/api/articles');return new Response(JSON.stringify([article]));};
    assert.equal((await scan('byrvox',dir,{fetcher})).created,1);
    assert.equal((await scan('byrvox',dir,{fetcher})).created,0);
    assert.equal((await readdir(dir)).length,1);
    await assert.rejects(scan('buzzeur',dir,{fetcher}),/confirmer/);
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('render refuses missing editorial approval',async()=>{
  await assert.rejects(render(makePlan('byrvox',article),'unused.mp4'),/Validation/);
});
test('integration: creates real MP4 with local tools', {skip:process.env.MEDIA_RENDER_TEST!=='1'}, async()=>{
  const dir=await mkdtemp(join(tmpdir(),'media-render-'));
  try {
    const p=makePlan('byrvox',{...article,title:'Test vidéo',summary:'Un exemple.'});
    const out=join(dir,'sample.mp4');
    assert.equal((await render(p,out,{approved:true})).status,'rendered_local');
    assert.ok((await stat(out)).size>1000);
  } finally {await rm(dir,{recursive:true,force:true});}
});
