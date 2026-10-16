#!/usr/bin/env python3
"""SIREEN Website — Local Development Server

Runs a static HTTP server that mimics Vercel's cleanUrls and trailingSlash
behaviour. Open http://localhost:8765/ in your browser.

Usage:
    python start-local-server.py
    python start-local-server.py --port 8080
"""
import argparse, json, os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 8765

def load_rewrites():
    vj = os.path.join(ROOT, "vercel.json")
    if os.path.isfile(vj):
        cfg = json.load(open(vj))
        return {r["source"]: r["destination"] for r in cfg.get("rewrites", [])}
    return {}

REWRITES = load_rewrites()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        # Minimal logging
        if args[1] != '200':
            super().log_message(fmt, *args)
        else:
            pass

    def do_GET(self):
        p = urlparse(self.path).path
        p = unquote(p)

        # trailingSlash: false
        if p != "/" and p.endswith("/"):
            self.send_response(308)
            self.send_header("Location", p.rstrip("/"))
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        fs = os.path.join(ROOT, p.lstrip("/"))
        cands = [fs, fs + ".html", os.path.join(fs, "index.html")]
        target = next((c for c in cands if os.path.isfile(c)), None)
        if target is None and p in REWRITES:
            target = os.path.join(ROOT, REWRITES[p].lstrip("/"))

        if target is None:
            self.send_error(404)
            return

        # cleanUrls: redirect direct .html requests to clean URL
        if p.endswith(".html") and os.path.isfile(fs):
            clean = p[:-5] if p != "/index.html" else "/"
            self.send_response(308)
            self.send_header("Location", clean)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        self.path = "/" + os.path.relpath(target, ROOT).replace(os.sep, "/")
        return super().do_GET()


def main():
    parser = argparse.ArgumentParser(description="SIREEN local dev server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port (default: 8765)")
    args = parser.parse_args()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"SIREEN local server running at http://127.0.0.1:{args.port}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)


if __name__ == "__main__":
    main()
