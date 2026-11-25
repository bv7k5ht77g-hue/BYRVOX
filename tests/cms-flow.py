"""Local integration test. Synthetic identity headers are for local dev only."""
import json
import os
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = os.environ.get('BYRVOX_TEST_URL', 'http://127.0.0.1:4173')
HEADERS = {
    'Content-Type': 'application/json', 'Origin': BASE,
    'oai-authenticated-user-id': 'local-test-editor',
    'oai-authenticated-user-email': 'test-editor@example.invalid',
}


def call(path, data=None, auth=True):
    body = None if data is None else json.dumps(data).encode()
    request = urllib.request.Request(BASE + path, data=body, headers=HEADERS if auth else {})
    client = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with client.open(request, timeout=15) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def save(row, action, **changes):
    return call('/api/newsroom', {**row, 'sources': json.loads(row['sources']), 'action': action, **changes})


def public_article(slug):
    status, rows = call('/api/articles', auth=False)
    assert status == 200
    return next(row for row in rows if row['slug'] == slug)


def revisions_for(article_id):
    status, data = call('/api/newsroom')
    assert status == 200
    return [revision for revision in data['revisions'] if revision['articleId'] == article_id]


assert call('/api/newsroom', auth=False)[0] == 403
status, article = call('/api/newsroom', {
    'title': 'Test local — à ne pas publier en production',
    'summary': 'Test du workflow', 'body': 'Données de test locales.', 'category': 'Technologie',
    'sources': [{'name': 'Source de test', 'url': 'https://www.nasa.gov/'}],
})
assert status == 200 and not article['isLive'], (status, article)
article_id = article['id']
assert call('/api/newsroom', {'id': article_id, 'action': 'publish'})[0] == 422
status, submitted = save(article, 'review')
assert status == 200 and submitted['status'] == 'review'
status, published = call('/api/newsroom', {'id': article_id, 'action': 'publish', 'version': submitted['version']})
assert status == 200 and published['status'] == 'published' and published['isLive']
first_public = public_article(article['slug'])
assert set(first_public) == {'slug', 'title', 'category', 'summary', 'publishedAt', 'updatedAt'}
assert first_public['title'] == article['title'] and first_public['publishedAt']

revision = revisions_for(article_id)[0]
status, restored = call('/api/newsroom', {
    'id': article_id, 'action': 'restore', 'revisionId': revision['id'], 'version': published['version'],
})
assert status == 200 and restored['status'] == 'draft' and restored['isLive']
assert public_article(article['slug']) == first_public

before = len(revisions_for(article_id))
with ThreadPoolExecutor(max_workers=2) as pool:
    attempts = list(pool.map(lambda title: save(restored, 'save', title=title), ['Correction A', 'Correction B']))
assert sorted(status for status, _ in attempts) == [200, 409], attempts
winner = next(row for status, row in attempts if status == 200)
assert len(revisions_for(article_id)) == before + 1
assert public_article(article['slug']) == first_public
assert call('/api/newsroom', {'id': article_id, 'action': 'publish'})[0] == 422

status, edited = save(winner, 'review')
assert status == 200 and edited['status'] == 'review' and public_article(article['slug']) == first_public
assert call('/api/newsroom', {'id': article_id, 'action': 'publish', 'version': winner['version']})[0] == 409
status, published = call('/api/newsroom', {'id': article_id, 'action': 'publish', 'version': edited['version']})
assert status == 200 and published['status'] == 'published'
revised = public_article(article['slug'])
assert revised['title'] == winner['title'] and revised['publishedAt'] == first_public['publishedAt']
assert revised['updatedAt'] > first_public['updatedAt']
print('PASS: access, publication gate, public fields, private revisions, concurrent editing and republication')
