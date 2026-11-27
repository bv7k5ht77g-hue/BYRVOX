#!/usr/bin/env python3
"""Deliver an already approved GitHub edition to the BUZZEUR CMS.

No credentials, arbitrary article text or interactive session are sent to the
public writer. The Worker independently reads the fixed authorised repository.
"""
import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ORIGIN = 'https://byrvox.noventra.ca'
REPOSITORY = 'https://raw.githubusercontent.com/bv7k5ht77g-hue/BYRVOX/main/buzzeur-newswire/'
LANGUAGES = ['fr', 'en', 'es', 'it', 'zh', 'ko', 'ru', 'ar', 'sw']


def request_json(url, body=None):
    encoded = None if body is None else json.dumps(body).encode()
    headers = {'Accept': 'application/json', 'User-Agent': 'BUZZEUR-Publisher/1.0'}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, data=encoded, headers=headers)
            with urllib.request.urlopen(req, timeout=35) as response:
                return json.loads(response.read(4_000_001))
        except urllib.error.HTTPError as error:
            detail = error.read(2000).decode('utf-8', 'replace')
            if error.code != 503 or attempt == 2:
                raise RuntimeError(f'HTTP {error.code}: {detail}') from error
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == 2:
                raise RuntimeError(f'Request interrupted: {error}') from error
        time.sleep(3 * (attempt + 1))


def verify_article(article_id):
    entries = []
    for language in LANGUAGES:
        query = urllib.parse.urlencode({'lang': language, 'id': article_id})
        feed = request_json(ORIGIN + '/api/buzzeur/feed?' + query)
        articles = feed.get('articles', [])
        if len(articles) != 1 or articles[0].get('id') != article_id:
            raise RuntimeError(f'Article not publicly available in {language}: {article_id}')
        article = articles[0]
        if len(article.get('body', [])) < 3 or not article.get('sources') or not article.get('imageCredit'):
            raise RuntimeError(f'Incomplete readback in {language}: {article_id}')
        entries.append(article)
    image = entries[0]['image']
    if not image.startswith(ORIGIN + '/api/buzzeur/media/'):
        raise RuntimeError('Unexpected media origin')
    with urllib.request.urlopen(urllib.request.Request(image, headers={'User-Agent': 'BUZZEUR-Publisher/1.0'}), timeout=25) as response:
        if response.status != 200 or not response.headers.get('Content-Type', '').startswith('image/') or not response.read(32):
            raise RuntimeError('The public photograph is unavailable')
    return {'id': article_id, 'title': entries[0]['title'], 'languages': len(entries),
            'url': 'https://buzzeur.byrvox.today/article/?' + urllib.parse.urlencode({'id': article_id, 'lang': 'fr'}),
            'image': image}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('hour')
    parser.add_argument('--report')
    args = parser.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}(?:-initial-[12]|-lancement)?', args.hour):
        raise SystemExit('Invalid UTC edition identifier')
    report = {'hour': args.hour, 'startedAt': datetime.now(timezone.utc).isoformat(), 'results': [], 'errors': []}
    config = request_json(ORIGIN + '/api/buzzeur/config')
    if config.get('agent', {}).get('enabled') is not True:
        report['paused'] = True
    else:
        manifest = request_json(REPOSITORY + args.hour + '/edition.json')
        if manifest.get('hour') != args.hour or not 1 <= len(manifest.get('articles', [])) <= 15:
            raise SystemExit('The approved manifest is missing or invalid')
        for rank in range(len(manifest['articles']), 0, -1):
            try:
                result = request_json(ORIGIN + '/api/buzzeur/newswire', {'hour': args.hour, 'rank': rank})
                status = result.get('status')
                if status == 'paused':
                    report['paused'] = True
                    break
                if status not in ['published', 'duplicate', 'recorded'] or not result.get('id'):
                    raise RuntimeError('Writer did not confirm a delivery: ' + json.dumps(result))
                public = verify_article(result['id'])
                report['results'].append({'rank': rank, 'status': status, **public})
                print(json.dumps({'rank': rank, 'status': status, 'id': result['id'], 'verifiedLanguages': 9}, ensure_ascii=False), flush=True)
            except Exception as error:
                report['errors'].append({'rank': rank, 'error': str(error)})
                print(json.dumps({'rank': rank, 'error': str(error)}, ensure_ascii=False), flush=True)
    report['completedAt'] = datetime.now(timezone.utc).isoformat()
    report['newlyPublished'] = sum(item['status'] == 'published' for item in report['results'])
    report['verifiedPublic'] = len(report['results'])
    if args.report:
        Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key not in ['results']}, ensure_ascii=False))
    if report['errors']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
