"""Deliver approved hourly editions from the BYRVOX main branch."""
import argparse
import json
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ENDPOINTS = (
    'https://byrvox.noventra.ca/api/newswire',
    'https://byrvox.h2y4xnnm6g.chatgpt.site/api/newswire',
)
HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'BYRVOX-Publisher/1.0 (+https://byrvox.noventra.ca)',
}


def call(endpoint, payload=None):
    headers = dict(HEADERS)
    body = None
    if payload is not None:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(payload).encode()
    request = Request(endpoint, data=body, headers=headers)
    with urlopen(request, timeout=25) as response:
        return json.load(response)


def receipts(hour):
    for endpoint in ENDPOINTS:
        try:
            recent = call(endpoint)['recent']
            return {(r['id'], r['slug']) for r in recent if r['id'].startswith('wire:' + hour + ':')}
        except (HTTPError, URLError, TimeoutError, ValueError, KeyError) as err:
            print('Receipt lookup failed:', endpoint, err, flush=True)
    return set()


def publish(hour, rank):
    payload = {'hour': hour, 'rank': rank}
    for attempt in range(3):
        for endpoint in ENDPOINTS:
            try:
                data = call(endpoint, payload)
                if data.get('status') not in ('published', 'recorded', 'duplicate'):
                    raise RuntimeError('Unexpected delivery status: ' + str(data))
                print(hour, rank, data['status'], data['slug'], flush=True)
                return
            except HTTPError as err:
                if err.code in (400, 422):
                    raise
                last_error = err
            except (URLError, TimeoutError, ValueError) as err:
                last_error = err
            print('Delivery request failed:', endpoint, rank, last_error, flush=True)
        if attempt < 2:
            time.sleep(5 * 2 ** attempt)
    raise last_error


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('hours', nargs='+')
    parser.add_argument('--redeliver', action='store_true', help='verify each delivery directly, including existing receipts')
    args = parser.parse_args()
    errors = []
    for hour in args.hours:
        if not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}(?:-thematique)?', hour):
            raise ValueError('Invalid UTC hour')
        document = json.loads((Path('newswire') / hour / 'edition.json').read_text())
        limit = 16 if hour.endswith('-thematique') else 15
        if document['hour'] != hour or not 1 <= len(document['articles']) <= limit:
            raise ValueError('Invalid edition')
        recorded = set() if args.redeliver else receipts(hour)
        for rank in range(len(document['articles']), 0, -1):
            slug = document['articles'][rank - 1]['eventKey']
            if ('wire:' + hour + ':' + str(rank), slug) in recorded:
                print(hour, rank, 'already recorded', slug, flush=True)
                continue
            try:
                publish(hour, rank)
            except Exception as err:
                errors.append(f'{hour} rank {rank}: {err}')
    if errors:
        raise SystemExit('\n'.join(errors))


if __name__ == '__main__':
    main()
