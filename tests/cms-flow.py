"""Local integration test. Synthetic identity headers are for local dev only."""
import json, urllib.request, urllib.error, os
BASE=os.environ.get('BYRVOX_TEST_URL','http://127.0.0.1:4173')
HEAD={'Content-Type':'application/json','Origin':BASE,'oai-authenticated-user-id':'local-test-editor','oai-authenticated-user-email':'test-editor@example.invalid'}
client=urllib.request.build_opener(urllib.request.ProxyHandler({}))
def call(path,data=None,auth=True):
 req=urllib.request.Request(BASE+path,data=json.dumps(data).encode() if data is not None else None,headers=HEAD if auth else {})
 try:
  with client.open(req,timeout=15) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
assert call('/api/newsroom',auth=False)[0]==403
status,a=call('/api/newsroom',{'title':'Test local — à ne pas publier en production','summary':'Test du workflow','body':'Données de test locales.','category':'Technologie','sources':[{'name':'Source de test','url':'https://www.nasa.gov/'}]})
assert status==200,(status,a)
assert call('/api/newsroom',{'id':a['id'],'action':'publish'})[0]==422
status,a=call('/api/newsroom',{**a,'sources':json.loads(a['sources']),'action':'review'})
assert status==200 and a['status']=='review'
status,a=call('/api/newsroom',{'id':a['id'],'action':'publish'})
assert status==200 and a['status']=='published'
assert any(x['id']==a['id'] for x in call('/api/articles',auth=False)[1])
admin=call('/api/newsroom')[1]
revision=next(r for r in admin['revisions'] if r['articleId']==a['id'])
status,restored=call('/api/newsroom',{'id':a['id'],'action':'restore','revisionId':revision['id']})
assert status==200 and restored['status']=='draft'
assert not any(x['id']==a['id'] for x in call('/api/articles',auth=False)[1])
print('PASS: unauthorized access, draft save, publication gate, review, publish, public readback, revision restore, unpublish')
