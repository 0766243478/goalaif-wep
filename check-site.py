#!/usr/bin/env python3
"""SIREEN website route and link checker.

Crawls every page of the site, reports HTTP status for each route, and
verifies that every internal link resolves to a real page and every
external link is reachable.

Usage:
    python3 check-site.py                      # check the local dev server
    python3 check-site.py https://www.gaolaif.org

Exit code 0 = no problems found, 1 = at least one broken route or link.
"""
import argparse
import concurrent.futures as cf
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urljoin, urlparse

ROUTES = [
    "/", "/guide", "/sireen/download", "/docs", "/docs/concepts",
    "/docs/cli", "/docs/ai-mode", "/docs/faq", "/docs/limitations",
    "/evaluate", "/contact",
]

ASSETS = [
    "/assets/sireen.css", "/assets/sireen.js",
    "/downloads/sireen-0.1.4.vsix", "/icon.png", "/og-image.png",
    "/robots.txt", "/sitemap.xml",
]

UA = "SIREEN-link-checker/1.0"


def fetch(url, timeout=20):
    """Return (status, final_url) or ('ERR: message', url)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, url
    except Exception as e:  # noqa: BLE001 - report any transport failure
        return f"ERR: {type(e).__name__}", url


def get_body(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as r:
            if r.status >= 400:
                return r.status, ""
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:  # noqa: BLE001
        return 0, ""


LINK_RE = re.compile(r'(?:href|src)="([^"]+)"', re.I)
# <link rel="preconnect"> and rel="dns-prefetch" point at bare origins.
# Requesting the origin root is not meaningful, so those are skipped.
PRECONNECT_RE = re.compile(
    r'<link[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*href="([^"]+)"', re.I)


def main():
    ap = argparse.ArgumentParser(description="SIREEN website route and link checker")
    ap.add_argument("base", nargs="?", default="http://127.0.0.1:8765",
                    help="Base URL to check (default: local dev server)")
    args = ap.parse_args()
    base = args.base.rstrip("/")

    print(f"Checking {base}\n" + "=" * 60)

    problems = []

    print("\n-- Routes --")
    for r in ROUTES:
        st, final = fetch(base + r)
        ok = st == 200 and final.rstrip("/") == (base + r).rstrip("/")
        if r == "/":
            ok = st == 200
        print(f"  {st!s:>6}  {r}" + ("" if ok else f"   -> redirected to {final}"))
        if st != 200:
            problems.append(f"route {r} returned {st}")
        elif not ok:
            problems.append(f"route {r} redirected to {final} (link should point there)")

    print("\n-- Assets --")
    for a in ASSETS:
        st, _ = fetch(base + a)
        print(f"  {st!s:>6}  {a}")
        if st != 200:
            problems.append(f"asset {a} returned {st}")

    # Crawl internal links
    print("\n-- Links found on each page --")
    seen_internal, external = set(), set()
    for r in ROUTES:
        st, body = get_body(base + r)
        if st != 200:
            continue
        preconnect = set(PRECONNECT_RE.findall(body))
        for href in LINK_RE.findall(body):
            if href.startswith(("#", "mailto:", "data:", "tel:")):
                continue
            if href in preconnect:
                continue
            if href.startswith(("http://", "https://", "//")):
                # Absolute links that point at the site being checked are
                # internal links, not external ones.
                host = urlparse(href).netloc
                if host and host == urlparse(base).netloc:
                    seen_internal.add(href.split("#")[0])
                else:
                    external.add(href)
            else:
                seen_internal.add(urljoin(base + r, href).split("#")[0])

    for link in sorted(seen_internal):
        st, _ = fetch(link)
        print(f"  {st!s:>6}  {link.replace(base, '') or '/'}")
        if st != 200:
            problems.append(f"internal link {link} returned {st}")

    print("\n-- External links --")
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(lambda u: (u, fetch(u, 15)[0]), sorted(external)))
    for link, st in results:
        print(f"  {st!s:>6}  {link}")
        # 403/429 usually means the target blocks automated requests, not broken.
        if isinstance(st, str) or (isinstance(st, int) and st >= 400 and st not in (403, 429)):
            problems.append(f"external link {link} returned {st}")

    print("\n" + "=" * 60)
    if problems:
        print(f"FAILED — {len(problems)} problem(s):")
        for p in problems:
            print("  -", p)
        return 1
    print("PASSED — every route, asset, and link returned HTTP 200.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
