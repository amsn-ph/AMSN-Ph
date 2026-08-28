#!/usr/bin/env python3
"""
AMSN-PH V2.6.1 HTML cache-bust/direct-CSS patcher.

Run this ONCE from the repository root after copying the V2.6.1 files.
It only changes frontend <link>/<script> references. It does not edit
Supabase config, auth.js, SQL, RLS, or backend data.
"""
from pathlib import Path
import re

ROOT = Path.cwd()

PUBLIC = [ROOT / "index.html", ROOT / "network.html", ROOT / "stories.html"]
PORTAL_DIR = ROOT / "portal"

def patch_public(path: Path):
    if not path.exists():
        return

    s = path.read_text(encoding="utf-8")

    # Cache-bust the base stylesheet regardless of its previous query string.
    s = re.sub(
        r'href="styles\.css(?:\?v=[^"]*)?"',
        'href="styles.css?v=2.6.1"',
        s
    )

    # Load polish in <head> to avoid a flash of pre-polish styling.
    polish = '<link rel="stylesheet" href="polish-v2.6.css?v=2.6.1">'
    if "polish-v2.6.css" not in s:
        match = re.search(r'(<link rel="stylesheet" href="styles\.css\?v=2\.6\.1">)', s)
        if match:
            s = s[:match.end()] + "\n  " + polish + s[match.end():]

    # Ensure the new JS is fetched instead of an old cached copy.
    s = re.sub(
        r'src="script\.js(?:\?v=[^"]*)?"',
        'src="script.js?v=2.6.1"',
        s
    )

    path.write_text(s, encoding="utf-8")
    print("Patched", path)

def patch_portal(path: Path):
    s = path.read_text(encoding="utf-8")

    s = re.sub(
        r'href="assets/portal\.css(?:\?v=[^"]*)?"',
        'href="assets/portal.css?v=2.6.1"',
        s
    )

    polish = '<link rel="stylesheet" href="assets/portal-polish-v2.6.css?v=2.6.1">'
    if "portal-polish-v2.6.css" not in s:
        match = re.search(r'(<link rel="stylesheet" href="assets/portal\.css\?v=2\.6\.1">)', s)
        if match:
            s = s[:match.end()] + "\n  " + polish + s[match.end():]

    # Only version the shared Supabase client; auth.js and page-specific JS stay untouched.
    s = re.sub(
        r'src="assets/supabase-client\.js(?:\?v=[^"]*)?"',
        'src="assets/supabase-client.js?v=2.6.1"',
        s
    )

    path.write_text(s, encoding="utf-8")
    print("Patched", path)

for page in PUBLIC:
    patch_public(page)

if PORTAL_DIR.exists():
    for page in sorted(PORTAL_DIR.glob("*.html")):
        patch_portal(page)

print("\nV2.6.1 HTML references updated.")
print("No SQL, auth.js, Supabase config, or backend files were changed.")
