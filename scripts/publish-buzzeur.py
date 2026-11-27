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
from concurrent.futures import ThreadPoolExecutor, as_completed
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


def public_url(article_id, language='fr'):
    return 'https://buzzeur.byrvox.today/article/?' + urllib.parse.urlencode(
        {'id': article_id, 'lang': language})


def verify_language(language, article_ids):
    """Read the latest 200 once; older duplicate deliveries use an ID lookup."""
    query = urllib.parse.urlencode({'lang': language, 'limit': 200})
    feed = request_json(ORIGIN + '/api/buzzeur/feed?' + query)
    if not isinstance(feed, dict) or not isinstance(feed.get('articles'), list):
        raise RuntimeError(f'Invalid public feed in {language}')
    by_id = {}
    for article in feed['articles']:
        if isinstance(article, dict) and isinstance(article.get('id'), str):
            by_id.setdefault(article['id'], []).append(article)
    entries, errors, targeted = {}, {}, []
    for article_id in article_ids:
        try:
            matches = by_id.get(article_id, [])
            if not matches:
                targeted.append(article_id)
                query = urllib.parse.urlencode({'lang': language, 'id': article_id})
                older = request_json(ORIGIN + '/api/buzzeur/feed?' + query)
                matches = older.get('articles', []) if isinstance(older, dict) else []
            if (not isinstance(matches, list) or len(matches) != 1
                    or not isinstance(matches[0], dict)
                    or matches[0].get('id') != article_id):
                raise RuntimeError(f'Article not publicly available in {language}: {article_id}')
            article = matches[0]
            body = article.get('body')
            if (not isinstance(body, list) or len(body) < 3
                    or any(not isinstance(paragraph, str) or not paragraph.strip() for paragraph in body)
                    or not article.get('sources') or not article.get('imageCredit')
                    or not article.get('title') or not isinstance(article.get('image'), str)):
                raise RuntimeError(f'Incomplete readback in {language}: {article_id}')
            entries[article_id] = article
        except Exception as error:
            errors[article_id] = str(error)
    return entries, errors, targeted


def verify_image(image):
    if not image.startswith(ORIGIN + '/api/buzzeur/media/'):
        raise RuntimeError('Unexpected media origin')
    with urllib.request.urlopen(urllib.request.Request(image, headers={'User-Agent': 'BUZZEUR-Publisher/1.0'}), timeout=25) as response:
        if response.status != 200 or not response.headers.get('Content-Type', '').startswith('image/') or not response.read(32):
            raise RuntimeError('The public photograph is unavailable')


def verify_deliveries(deliveries):
    """Verify all confirmed deliveries, with at most four concurrent reads."""
    article_ids = list(dict.fromkeys(item['id'] for item in deliveries))
    entries, language_errors, targeted = {}, {}, {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(verify_language, language, article_ids): language
                   for language in LANGUAGES}
        for future in as_completed(futures):
            language = futures[future]
            try:
                entries[language], language_errors[language], targeted[language] = future.result()
            except Exception as error:
                entries[language] = {}
                language_errors[language] = {article_id: str(error) for article_id in article_ids}
                targeted[language] = []

    # Different ranks may refer to the same article or photograph. Check every
    # distinct public image only once, including images seen in other languages.
    images = {article['image'] for by_id in entries.values() for article in by_id.values()}
    image_errors = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(verify_image, image): image for image in images}
        for future in as_completed(futures):
            image = futures[future]
            try:
                future.result()
                image_errors[image] = None
            except Exception as error:
                image_errors[image] = str(error)

    errors = []
    for delivery in deliveries:
        article_id = delivery['id']
        checks, problems, available = {}, [], []
        for language in LANGUAGES:
            article = entries[language].get(article_id)
            check = {'verified': article is not None, 'url': public_url(article_id, language),
                     'readback': 'id' if article_id in targeted[language] else 'feed'}
            if article is not None:
                available.append(article)
            else:
                problem = language_errors[language].get(article_id, 'Missing public readback')
                check['error'] = problem
                problems.append({'language': language, 'error': problem})
            checks[language] = check
        article_images = {article['image'] for article in available}
        if available:
            delivery['title'] = available[0]['title']
            delivery['image'] = available[0]['image']
            if len(article_images) != 1:
                problems.append({'error': 'Public photograph differs between languages'})
            for image in sorted(article_images):
                if image_errors[image] is not None:
                    problems.append({'image': image, 'error': image_errors[image]})
        else:
            problems.append({'error': 'No public article available to verify its photograph'})
        delivery.update(languages=len(available), languageChecks=checks,
                        imageVerified=bool(article_images) and len(article_images) == 1
                        and all(image_errors[image] is None for image in article_images),
                        verified=not problems, verificationErrors=problems)
        if problems:
            errors.append({'rank': delivery['rank'], 'id': article_id,
                           'phase': 'verification',
                           'error': '; '.join(
                               (problem['language'] + ': ' if 'language' in problem else '')
                               + problem['error'] for problem in problems),
                           'details': problems})
        print(json.dumps({'rank': delivery['rank'], 'status': delivery['status'],
                          'id': article_id, 'phase': 'verification',
                          'verifiedLanguages': len(available), 'verified': delivery['verified'],
                          'imageVerified': delivery['imageVerified'], 'errors': problems},
                         ensure_ascii=False), flush=True)
    return errors


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
                    report['pausedAtRank'] = rank
                    print(json.dumps({'rank': rank, 'status': status, 'phase': 'delivery'}), flush=True)
                    break
                if status not in ['published', 'duplicate', 'recorded'] or not isinstance(result.get('id'), str) or not result['id']:
                    raise RuntimeError('Writer did not confirm a delivery: ' + json.dumps(result))
                report['results'].append({'rank': rank, 'status': status, 'id': result['id'],
                                          'url': public_url(result['id']), 'verified': False})
                print(json.dumps({'rank': rank, 'status': status, 'id': result['id'],
                                  'phase': 'delivery', 'verification': 'pending'},
                                 ensure_ascii=False), flush=True)
            except Exception as error:
                report['errors'].append({'rank': rank, 'phase': 'delivery', 'error': str(error)})
                print(json.dumps({'rank': rank, 'phase': 'delivery', 'error': str(error)}, ensure_ascii=False), flush=True)
        if report['results']:
            report['errors'].extend(verify_deliveries(report['results']))
    report['completedAt'] = datetime.now(timezone.utc).isoformat()
    report['newlyPublished'] = sum(item['status'] == 'published' for item in report['results'])
    report['recorded'] = sum(item['status'] == 'recorded' for item in report['results'])
    report['duplicates'] = sum(item['status'] == 'duplicate' for item in report['results'])
    report['verifiedPublic'] = sum(item['verified'] for item in report['results'])
    if args.report:
        Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key not in ['results']}, ensure_ascii=False))
    if report['errors']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
