# AMSN-PH — Aug 29 Design / Multi-Page Patch

Baseline: GitHub commit `872a327b0565d9f94da215924d01f9278bdf0be1` (Aug 29, 2026).

This patch is intentionally NOT a redesign.

It preserves the Aug 29 public-site design:
- original AMSN-PH circular logo
- original `styles.css`
- original `polish-v2.6.css`
- original AMSN blue `#005480`
- cyan / green / gray logo accents
- Arial / Helvetica typography
- original header, button, hero, section, and footer visual language
- existing `network.html`
- existing `stories.html`
- existing `/portal/`
- existing photos, map, and event assets

## What changes

The long homepage is shortened and the former homepage sections become actual pages:

- `index.html` — short landing page only
- `about.html`
- `membership.html`
- `programs.html`
- `network.html` — EXISTING Aug 29 page, preserved
- `highlights.html`
- `stories.html` — EXISTING Aug 29 page, preserved
- `contact.html` — includes Inquiry Form
- `submit-story.html` — includes Submit Your Story Form
- `/portal/` — unchanged

`script.js` normalizes the navigation on the older Aug 29 Network and Stories pages at runtime, so their old `index.html#...` links now open the new actual pages. It also adds a "Submit Your Story" button to the existing Stories hero without replacing the Stories archive.

## Safest workflow

### 1. Restore the repo to the Aug 29 baseline first

Restore point:

`872a327b0565d9f94da215924d01f9278bdf0be1`

Do this before applying the patch so the original styles, logo, photos, Network page,
Stories archive, and portal are all present.

### 2. Apply the patch

If using Codespaces / local Git:

Copy this package into the repository root, then run:

```bash
python apply_patch.py
```

The script only copies the contents of `site-files/`. It leaves the August assets,
Network page, Stories page, and portal intact.

Then:

```bash
git add .
git commit -m "Separate AMSN-PH public site into pages using Aug 29 design"
git push origin main
```

### 3. Enable the two forms

Run:

`supabase-public-forms.sql`

in Supabase SQL Editor.

The forms reuse the existing public Supabase configuration already in:

`portal/assets/supabase-config.js`

No service-role key is added to the public website.

Anonymous visitors can INSERT a form response, but no anonymous SELECT policy is created.

## Important

Do not upload the previous green static-site V1/V2 packages. Those were a different design.

This patch assumes the original Aug 29 assets remain in the repository and deliberately
references those same assets rather than introducing a new visual identity.


## V2 — 8th NEB homepage image

This version includes the supplied 8th AMSN-PH National Executive Board artwork.

It is copied to:
`assets/8th-neb-national-executive-board.jpg`

The homepage hero now uses that image instead of:
`assets/hero-network-community.jpg`

The original image remains in the repository and is not deleted.
The hero layout is slightly rebalanced so the wide NEB artwork is readable while
preserving the Aug 29 AMSN-PH visual system.
