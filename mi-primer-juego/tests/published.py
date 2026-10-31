"""Verify the public runtime files against the checked-out deployment source.
Uses ordinary HTTPS and SHA-256; no credentials or third-party packages.
"""
import hashlib
import json
import os
from pathlib import Path
import time
from urllib.request import urlopen, Request

BASE = os.environ['CIMA_URL']
ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('CIMA_TEST_OUTPUT', 'work/production-results'))
OUT.mkdir(parents=True, exist_ok=True)
files = ['index.html', 'style.css', 'src/loader.js', 'src/game.js',
         'src/model.js', 'src/sprites.js', 'assets/vendor/phaser.min.js',
         'assets/moon.svg', 'assets/astronaut-concepts.png']
results = []
for name in files:
    expected = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
    # Pages/CDN publication can lag behind a successful deployment for a short time.
    error = None
    for attempt in range(60):
        try:
            req = Request(BASE + name, headers={'Cache-Control': 'no-cache'})
            with urlopen(req, timeout=30) as response:
                status = response.status
                actual = hashlib.sha256(response.read()).hexdigest()
            assert status == 200, (name, status)
            assert actual == expected, f'{name}: stale or different deployment'
            error = None
            break
        except Exception as exc:
            error = exc
            if attempt < 59:
                time.sleep(5)
    if error:
        raise error
    results.append({'file': name, 'status': status, 'sha256': actual})
    print(f'PASS HTTP 200 + SHA-256 {name}', flush=True)
with urlopen(BASE.removesuffix('mi-primer-juego/'), timeout=30) as response:
    root_html = response.read().decode('utf-8')
    assert response.status == 200 and './mi-primer-juego/' in root_html
print('PASS repository root links to the game', flush=True)
(OUT / 'public-files.json').write_text(json.dumps({'base_url': BASE, 'files': results, 'root_links_to_game': True}, indent=2))
