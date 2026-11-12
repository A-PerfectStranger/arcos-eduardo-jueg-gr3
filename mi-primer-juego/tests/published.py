"""Verify the published landing and runtime match this exact source commit."""
import hashlib
import json
import os
from pathlib import Path
import time
from urllib.request import urlopen, Request

BASE = os.environ["CIMA_URL"]
ROOT = Path(__file__).resolve().parents[1]
SITE = BASE.removesuffix("mi-primer-juego/")
OUT = Path(os.environ.get("CIMA_TEST_OUTPUT", "work/production-results"))
OUT.mkdir(parents=True, exist_ok=True)
game_files = [
    "index.html", "style.css", "src/loader.js", "src/game.js",
    "src/model.js", "src/environment.js", "src/sprites.js",
    "assets/vendor/phaser.min.js", "assets/vendor/PHASER-LICENSE.md",
    "assets/moon.svg", "assets/retro-cover.png", "assets/retro-sprites.png",
    "assets/readme/bosque.png", "assets/readme/orbita.png",
]
targets = [(name, ROOT / name, BASE + name) for name in game_files]
targets += [("landing/" + name, ROOT.parent / name, SITE + name)
            for name in ["index.html", "landing.css", "CREDITS.md", "docs/TALLER.md", "docs/ITCHIO.md"]]
results = []
for name, source, url in targets:
    expected = hashlib.sha256(source.read_bytes()).hexdigest()
    error = None
    for attempt in range(60):
        try:
            req = Request(url, headers={"Cache-Control": "no-cache"})
            with urlopen(req, timeout=30) as response:
                status = response.status
                actual = hashlib.sha256(response.read()).hexdigest()
            assert status == 200, (name, status)
            assert actual == expected, f"{name}: stale or different deployment"
            error = None
            break
        except Exception as exc:
            error = exc
            if attempt < 59:
                time.sleep(5)
    if error:
        raise error
    results.append({"file": name, "status": status, "sha256": actual})
    print(f"PASS HTTP 200 + SHA-256 {name}", flush=True)
with urlopen(SITE, timeout=30) as response:
    root_html = response.read().decode("utf-8")
    assert response.status == 200 and './mi-primer-juego/' in root_html
    assert 'http-equiv="refresh"' not in root_html
print("PASS landing remains at root and links to the game", flush=True)
(OUT / "public-files.json").write_text(json.dumps({
    "base_url": BASE, "landing_url": SITE, "files": results,
    "root_links_to_game": True}, indent=2), encoding="utf-8")
