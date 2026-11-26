"""Deliver verified news already approved on the BYRVOX main branch."""
import argparse
import json
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def publish(hour, rank):
    body = json.dumps({'hour': hour, 'rank': rank}).encode()
    for attempt in range(4):
        request = Request('https://byrvox.noventra.ca/api/newswire', data=body,
                          headers={'Content-Type': 'application/json'})
        try:
            with urlopen(request, timeout=45) as result:
                data = json.load(result)
            if data.get('status') not in ('published', 'recorded', 'duplicate'):
                raise RuntimeError('Unexpected delivery status: ' + str(data))
            print(hour, rank, data['status'], data['slug'], flush=True)
            return
        except (HTTPError, URLError, TimeoutError) as err:
            # The public GitHub CDN can briefly cache 404s after a push.
            if attempt == 3 or isinstance(err, HTTPError) and err.code in (400, 422):
                raise
            time.sleep(5 * 2 ** attempt)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('hours', nargs='+')
    errors = []
    for hour in parser.parse_args().hours:
        if not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}', hour):
            raise ValueError('Invalid UTC hour')
        document = json.loads((Path('newswire') / hour / 'edition.json').read_text())
        if document['hour'] != hour or not 1 <= len(document['articles']) <= 15:
            raise ValueError('Invalid edition')
        for rank in range(len(document['articles']), 0, -1):
            try:
                publish(hour, rank)
            except Exception as err:
                errors.append(f'{hour} rank {rank}: {err}')
    if errors:
        raise SystemExit('\n'.join(errors))


if __name__ == '__main__':
    main()
