#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

repo = Path.cwd()
required = [
    repo / "styles.css",
    repo / "polish-v2.6.css",
    repo / "assets" / "amsn-logo.jpg",
    repo / "assets" / "hero-network-community.jpg",
    repo / "network.html",
    repo / "stories.html",
    repo / "portal" / "assets" / "supabase-config.js",
]
missing = [str(p.relative_to(repo)) for p in required if not p.exists()]

if missing:
    print("STOP: this patch expects the Aug 29 AMSN-PH codebase/assets.")
    print("Missing:")
    for item in missing:
        print(" -", item)
    sys.exit(1)

patch_dir = Path(__file__).resolve().parent / "site-files"

for source in patch_dir.rglob("*"):
    if source.is_file():
        target = repo / source.relative_to(patch_dir)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        print("Updated:", target.relative_to(repo))

print()
print("Patch applied.")
print("Existing Aug 29 network.html, stories.html, portal/, styles.css, polish-v2.6.css,")
print("and all logo/photo assets were preserved.")
print("Next: run supabase-public-forms.sql in Supabase if you want the two public forms live.")
