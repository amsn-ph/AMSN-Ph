#!/usr/bin/env python3
from pathlib import Path
import shutil, sys

repo = Path.cwd()
patch = Path(__file__).resolve().parent
source = patch / "site-files"

required = [
    repo/"index.html",
    repo/"stories.html",
    repo/"portal"/"officer.html",
    repo/"portal"/"assets"/"supabase-config.js",
]
missing = [str(p.relative_to(repo)) for p in required if not p.exists()]
if missing:
    print("STOP: current AMSN-PH site/portal was not detected.")
    for item in missing:
        print(" -", item)
    sys.exit(1)

def insert_once(path, marker, insertion, before=True):
    text = path.read_text(encoding="utf-8")
    if insertion.strip() in text:
        print("Already patched:", path.relative_to(repo))
        return
    if marker not in text:
        raise RuntimeError(f"Patch marker not found in {path}: {marker[:80]}")
    if before:
        text = text.replace(marker, insertion + "\n" + marker, 1)
    else:
        text = text.replace(marker, marker + "\n" + insertion, 1)
    path.write_text(text, encoding="utf-8")
    print("Patched:", path.relative_to(repo))

# Officer Hub.
officer = repo/"portal"/"officer.html"
pub_markup = (patch/"publication-section.html").read_text(encoding="utf-8").strip()
insert_once(officer, '<section class="portal-grid">', pub_markup, True)
insert_once(officer, '<link rel="stylesheet" href="assets/portal.css">', '<link rel="stylesheet" href="assets/publications.css?v=1.0.0">', False)
insert_once(officer, '<script src="assets/officer.js?v=2.3.0"></script>', '<script src="assets/publications.js?v=1.0.0"></script>', True)

# Homepage.
index = repo/"index.html"
insert_once(index, '<link rel="stylesheet" href="multipage.css?v=1.0.0">', '<link rel="stylesheet" href="publications.css?v=1.0.0">', False)

home_section = '''  <section class="publications-home">
    <div class="container">
      <div class="publications-heading-row">
        <div>
          <p class="eyebrow">LATEST FROM AMSN-PH</p>
          <h2>Stories, devotionals, and public updates.</h2>
        </div>
        <a href="stories.html" class="text-link">Browse all publications <span>→</span></a>
      </div>
      <div class="public-post-grid" data-public-post-feed="home">
        <div class="public-post-empty">Loading latest posts…</div>
      </div>
    </div>
  </section>'''
insert_once(index, '  <section class="join-section" id="join">', home_section, True)
insert_once(index, '<script src="script.js?v=3.0.0"></script>', '<script src="portal/assets/supabase-config.js?v=2.5.0"></script>\n<script src="public-posts.js?v=1.0.0"></script>', True)

# Stories page.
stories = repo/"stories.html"
text = stories.read_text(encoding="utf-8")
if 'publications.css?v=1.0.0' not in text:
    text = text.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="styles.css">\n  <link rel="stylesheet" href="publications.css?v=1.0.0">', 1)
    stories.write_text(text, encoding="utf-8")
    print("Patched:", stories.relative_to(repo), "(CSS)")

dynamic = '''  <section class="dynamic-stories-section">
    <div class="container">
      <p class="eyebrow">CURRENT PUBLICATIONS</p>
      <h2>Latest from AMSN-PH officers and the network.</h2>
      <p class="section-intro">Published stories, devotionals, announcements, events, and official updates appear here automatically.</p>
      <div class="public-post-grid" data-public-post-feed="stories">
        <div class="public-post-empty">Loading current publications…</div>
      </div>
    </div>
  </section>'''
insert_once(stories, '  <section class="story-filter-bar">', dynamic, True)

text = stories.read_text(encoding="utf-8")
if 'public-posts.js?v=1.0.0' not in text:
    marker = '<script src="script.js'
    idx = text.rfind(marker)
    if idx < 0:
        raise RuntimeError("Could not find Stories page script marker.")
    text = text[:idx] + '<script src="portal/assets/supabase-config.js?v=2.5.0"></script>\n<script src="public-posts.js?v=1.0.0"></script>\n' + text[idx:]
    stories.write_text(text, encoding="utf-8")
    print("Patched:", stories.relative_to(repo), "(JS)")

# Copy support files.
for src in source.rglob("*"):
    if src.is_file():
        dest = repo/src.relative_to(source)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        print("Updated:", dest.relative_to(repo))

print("\nOfficer Publishing CMS patch applied.")
print("Run supabase-publications-cms.sql in Supabase SQL Editor BEFORE testing.")
