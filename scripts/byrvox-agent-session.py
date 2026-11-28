#!/usr/bin/env python3
"""Private agent session: the bearer secret never leaves this running process.

Commit the printed digest document using the authorised GitHub connector, then
send newline-delimited commands on stdin. No credentials are saved to a file.
"""
import argparse
import datetime as dt
import hashlib
import json
import re
import secrets
import sys
import urllib.error
import urllib.request

ORIGINS = ('https://byrvox.today', 'https://byrvox.noventra.ca', 'https://byrvox.h2y4xnnm6g.chatgpt.site')

def emit(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--hour', required=True)
    parser.add_argument('--origin', choices=ORIGINS, default=ORIGINS[0])
    parser.add_argument('--media', choices=('byrvox','buzzeur'), default='byrvox')
    args = parser.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}', args.hour):
        parser.error('An edition hour YYYY-MM-DDTHH is required.')
    issued = dt.datetime.now(dt.timezone.utc)
    expiry = issued + dt.timedelta(hours=2)
    secret = secrets.token_hex(32)
    proof = {'hour':args.hour, 'sha256':hashlib.sha256(secret.encode()).hexdigest(),
             'issuedAt':issued.isoformat(), 'expiresAt':expiry.isoformat()}
    directory = 'buzzeur-newswire' if args.media == 'buzzeur' else 'newswire'
    emit({'event':'access-proof', 'path':directory+'/agent-access/'+args.hour+'/'+proof['sha256']+'.json', 'document':proof})
    for line in sys.stdin:
        try:
            command = json.loads(line)
            action = command.get('action')
            if action == 'close':
                emit({'event':'closed'})
                return
            if dt.datetime.now(dt.timezone.utc) >= expiry:
                emit({'ok':False,'error':'Session expirée. Ouvre une nouvelle session approuvée.'})
                return
            if action not in ('config','report'):
                emit({'ok':False,'error':'Commande attendue : config, report ou close.'})
                continue
            payload = None
            if action == 'report':
                data = command.get('data')
                if not isinstance(data,dict):
                    raise ValueError('Compte rendu JSON requis.')
                payload = json.dumps({**data,'hour':args.hour},ensure_ascii=False).encode()
                if len(payload) > 40000:
                    raise ValueError('Compte rendu trop volumineux.')
            headers = {'User-Agent':args.media.upper()+'-Agent/1.0','Authorization':'Bearer '+secret,
                       'X-'+args.media.upper()+'-Edition':args.hour,'Content-Type':'application/json'}
            request = urllib.request.Request(args.origin+'/api/agent/'+args.media,data=payload,headers=headers,
                                             method='POST' if payload is not None else 'GET')
            try:
                with urllib.request.urlopen(request,timeout=35) as response:
                    body = json.loads(response.read(65536))
                    emit({'ok':True,'status':response.status,'action':action,'data':body})
            except urllib.error.HTTPError as error:
                try: body=json.loads(error.read(4096))
                except (ValueError,UnicodeError): body={'error':'Réponse HTTP non JSON.'}
                emit({'ok':False,'status':error.code,'action':action,'data':body})
            except urllib.error.URLError as error:
                emit({'ok':False,'action':action,'error':'Accès réseau indisponible : '+str(error.reason)})
        except (ValueError,TypeError,UnicodeError) as error:
            emit({'ok':False,'error':str(error)})

if __name__ == '__main__':
    main()
