"""Validate the submitted collection against Postman's official v2.1 schema."""
import json
import urllib.request
import urllib.error
from pathlib import Path
from jsonschema import Draft4Validator

url = 'https://schema.getpostman.com/collection/json/v2.1.0/draft-04/collection.json'
try:
    with urllib.request.urlopen(url, timeout=30) as response:
        schema = json.load(response)
except urllib.error.URLError as error:
    print(f'BLOCKED: official Postman schema could not be retrieved ({error.reason})')
    raise SystemExit(2)
collection = json.loads(Path('docs/postman/marketplace.postman_collection.json').read_text(encoding='utf-8'))
Draft4Validator.check_schema(schema)
Draft4Validator(schema).validate(collection)
print('PASS: official Postman Collection v2.1 JSON schema')
