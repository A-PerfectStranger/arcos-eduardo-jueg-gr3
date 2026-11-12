"""Browser checks for the landing and portable HTML5 package.
Uses the same HTTP server, Playwright and Chromium as the gameplay checks.
"""
import json
import os
from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

BASE = os.environ.get("CIMA_SITE_URL", "http://127.0.0.1:8080/").rstrip("/") + "/"
OUT = Path(os.environ.get("CIMA_TEST_OUTPUT", "work/test-results"))
OUT.mkdir(parents=True, exist_ok=True)
checks = []

def check(name, ok):
    assert ok, name
    checks.append(name)
    print("PASS", name, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
        headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    page = browser.new_page(viewport={"width":1440,"height":1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.route("https://cdn.jsdelivr.net/**", lambda route: route.abort())
    response = page.goto(BASE)
    check("landing responds successfully", response.status == 200)
    page.wait_for_timeout(700)
    check("landing stays at root rather than redirecting", page.url.rstrip("/") == BASE.rstrip("/"))
    check("narrative, learning, credits and legal sections are present",
          all(page.locator("#" + section).is_visible() for section in ["logline","aprender","honor","legal"]))
    check("one clear h1 and a large play target",
          page.locator("h1").count() == 1 and page.locator("#jugar").bounding_box()["height"] >= 64)
    check("classification is explicitly unofficial",
          "No es una clasificación oficial" in page.locator("#legal").inner_text())
    check("community is honest about its pending account",
          "pendientes de creación" in page.locator("#comunidad").inner_text())
    check("hero image loads and play button has clear space",
          page.locator(".hero-art img").evaluate("(img)=>img.complete&&img.naturalWidth>0") and
          page.locator("#jugar").bounding_box()["y"] + page.locator("#jugar").bounding_box()["height"]
          <= page.locator(".mission-strip").bounding_box()["y"])
    for relative in ["landing.css","CREDITS.md","docs/TALLER.md","docs/ITCHIO.md",
                     "mi-primer-juego/assets/readme/bosque.png",
                     "mi-primer-juego/assets/readme/orbita.png"]:
        check("public resource " + relative, page.request.get(urljoin(BASE, relative)).status == 200)
    page.screenshot(path=str(OUT / "landing-desktop.png"), full_page=True)
    page.locator("#legal summary").click()
    check("privacy disclosure opens without leaving the page",
          page.locator("#legal details").get_attribute("open") is not None)
    page.set_viewport_size({"width":390,"height":844})
    page.goto(BASE)
    check("mobile has no horizontal overflow",
          page.evaluate("document.documentElement.scrollWidth<=innerWidth"))
    check("mobile play target remains usable", page.locator("#jugar").bounding_box()["width"] >= 250)
    page.screenshot(path=str(OUT / "landing-mobile.png"), full_page=True)
    page.emulate_media(reduced_motion="reduce")
    check("reduced motion disables smooth scrolling",
          page.evaluate("getComputedStyle(document.documentElement).scrollBehavior==='auto'"))
    page.locator("#jugar").click()
    page.wait_for_selector("canvas")
    check("play link starts the real Phaser game",
          "/mi-primer-juego/" in page.url and page.locator("#primary").is_visible())
    if os.environ.get("CHECK_PACKAGE") == "1":
        page.goto(urljoin(BASE, "dist/itch/"))
        page.wait_for_selector("canvas")
        check("portable package starts with local Phaser fallback",
              page.locator("#primary").is_visible() and page.locator("canvas").count() == 1)
        check("portable package includes license and provenance",
              page.request.get(urljoin(BASE, "dist/itch/CREDITS.md")).status == 200 and
              page.request.get(urljoin(BASE, "dist/itch/assets/vendor/PHASER-LICENSE.md")).status == 200)
    static = browser.new_context(java_script_enabled=False, viewport={"width":390,"height":844})
    offline = static.new_page()
    offline.goto(BASE)
    check("landing works without JavaScript",
          offline.locator("#jugar").is_visible() and offline.locator("#logline").is_visible())
    static.close()
    check("no browser JavaScript errors", not errors)
    browser.close()

(OUT / "landing-results.json").write_text(json.dumps({"checks":checks,"errors":errors},indent=2),encoding="utf-8")
print(f"{len(checks)} landing/package checks passed")
