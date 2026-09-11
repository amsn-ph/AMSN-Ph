# AMSN-PH Project 2026 Devotional Book Form Patch

Official Google Form:
https://forms.gle/wjTczgLwT2KsLwLdA

## What this patch does

- Replaces the current custom `submit-story.html` Supabase form with a branded
  **AMSN-PH Project 2026 Devotional Book** page.
- Keeps the current Aug 29 AMSN-PH design system.
- Adds an embedded Google Form area.
- Adds direct Google Form buttons as fallback.
- Removes the need to submit devotional stories to the website's Supabase table.
- Does not change the Inquiry Form or Member Portal.

## Important note about the embed

The supplied URL is a shortened `forms.gle` link. The page attempts to load it
inside an iframe, but some browsers / Google redirect behavior may prevent a
shortened URL from rendering inside an iframe.

For that reason the patch includes prominent direct buttons to the exact official
Google Form. If you later copy the full Google Forms `.../viewform?embedded=true`
URL from Google Forms > Send > Embed HTML, you can replace the iframe `src` with
that full embed URL for the most reliable inline experience.

## Apply

From the repository root:

```bash
python apply_devotional_patch.py
```

Check:

```bash
git status --short
```

Stage only:

```bash
git add submit-story.html devotional-book.css
```

Then:

```bash
git commit -m "Integrate Project 2026 Devotional Book submission form"
git push origin main
```

## No Supabase SQL needed

This patch uses the official Google Form for devotional-book submissions.
Your existing `public-forms.js` may remain because it is still used by the
public Inquiry Form.
