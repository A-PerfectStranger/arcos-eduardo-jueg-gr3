"""Build the public HTML5 distribution, with index.html at the ZIP root."""
import json
import os
from pathlib import Path
import shutil
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "mi-primer-juego"
DEST = ROOT / "dist" / "itch"
ARCHIVE = ROOT / "work" / "hasta-la-luna-html5.zip"
runtime = [
    "index.html", "style.css", "src/loader.js", "src/game.js",
    "src/model.js", "src/sprites.js", "src/environment.js",
    "assets/moon.svg", "assets/retro-cover.png", "assets/retro-sprites.png",
    "assets/vendor/phaser.min.js", "assets/vendor/PHASER-LICENSE.md",
]
for relative in runtime:
    if not (GAME / relative).is_file():
        raise FileNotFoundError(relative)
if DEST.exists():
    shutil.rmtree(DEST)
DEST.mkdir(parents=True)
for relative in runtime:
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(GAME / relative, target)
credits = (ROOT / "CREDITS.md").read_text(encoding="utf-8")
(DEST / "CREDITS.md").write_text(credits.replace("mi-primer-juego/", ""), encoding="utf-8")
(DEST / "build.json").write_text(json.dumps({
    "game": "Hasta la Luna",
    "source_commit": os.environ.get("SOURCE_SHA", os.environ.get("GITHUB_SHA", "local")),
    "entrypoint": "index.html",
}, indent=2) + "\n", encoding="utf-8")
ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(ARCHIVE, "w", ZIP_DEFLATED) as archive:
    for path in sorted(DEST.rglob("*")):
        if path.is_file():
            archive.write(path, path.relative_to(DEST))
with ZipFile(ARCHIVE) as archive:
    names = archive.namelist()
    assert "index.html" in names and "assets/vendor/PHASER-LICENSE.md" in names
    assert not any(name.startswith((".git/", ".github/", "tests/")) for name in names)
print(f"HTML5 package: {ARCHIVE.relative_to(ROOT)} ({len(names)} public files)")
