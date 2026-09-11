#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

repo = Path.cwd()
patch = Path(__file__).resolve().parent / "site-files"

required = [
    repo / "styles.css",
    repo / "multipage.css",
    repo / "script.js",
    repo / "submit-story.html",
]
missing = [str(p.relative_to(repo)) for p in required if not p.exists()]

if missing:
    print("STOP: current AMSN-PH multi-page site was not detected.")
    print("Missing:")
    for item in missing:
        print(" -", item)
    sys.exit(1)

for source in patch.rglob("*"):
    if source.is_file():
        target = repo / source.relative_to(patch)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        print("Updated:", target.relative_to(repo))

print()
print("Devotional Book submission patch applied.")
print("Official form: https://forms.gle/wjTczgLwT2KsLwLdA")
print("No Supabase story-submission changes are required.")
