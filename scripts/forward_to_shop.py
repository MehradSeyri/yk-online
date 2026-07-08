import json
import urllib.request
import urllib.error

WEBHOOK_URL = "https://juvrcmktjcpsofgnuuhe.supabase.co/functions/v1/payment-webhook"
INTERNAL_SECRET = "04c4c9d95e1cf129770d19d193d7ef1239d1d51c09f9406f50bfd2d15235e19c"

with open('forward_payload.json','rb') as f:
    data = f.read()

req = urllib.request.Request(WEBHOOK_URL, data=data, method='POST')
req.add_header('Content-Type','application/json')
req.add_header('x-internal-secret', INTERNAL_SECRET)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        print('STATUS', resp.status)
        print(resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('STATUS', e.code)
    try:
        print(e.read().decode('utf-8'))
    except:
        print('NO BODY')
except Exception as e:
    print('ERROR', str(e))
