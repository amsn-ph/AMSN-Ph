#!/usr/bin/env python3
from pathlib import Path
import shutil, sys

repo = Path.cwd()
patch = Path(__file__).resolve().parent / "site-files"
required = [repo/"styles.css", repo/"multipage.css", repo/"script.js", repo/"network.html", repo/"assets"]
missing = [str(x.relative_to(repo)) for x in required if not x.exists()]
if missing:
    print("STOP: current AMSN-PH multi-page site not detected.")
    print("\n".join(" - "+x for x in missing))
    sys.exit(1)

for source in patch.rglob("*"):
    if source.is_file():
        target = repo / source.relative_to(patch)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        print("Updated:", target.relative_to(repo))
print("\n3-region patch applied: Luzon, Visayas, Mindanao.")
