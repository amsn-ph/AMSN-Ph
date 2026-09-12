# AMSN-PH Officer Publishing CMS Patch

This adds officer-authored public posts to the existing AMSN-PH portal and public website.

## Roles
Contributors: trustee, chapter_officer, neb_officer, admin
Publishers: neb_officer, admin

Workflow: Draft -> Review -> Published -> Archived

## Public behavior
Published posts automatically appear on:
- homepage: latest 3
- Stories page: latest 12
- full article: story.html?id=<post-id>

## Install
1. From repository root:
   python apply_publications_cms_patch.py

2. Run supabase-publications-cms.sql in Supabase SQL Editor.

3. Check:
   git status --short

4. Stage:
   git add index.html stories.html story.html publications.css public-posts.js portal/officer.html portal/assets/publications.js portal/assets/publications.css

5. Commit:
   git commit -m "Add officer public publishing CMS"
   git push origin main

## Permissions
Trustees/chapter officers can save drafts and submit for review.
NEB officers/admins can publish, feature, and archive.

## Security
Public visitors can SELECT only published rows through Supabase RLS.
The browser UI is not the security boundary; RLS is.
