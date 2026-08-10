# AMSN-PH Website V1

Public-facing Phase 1 website for the Adventist Medical Students Network – Philippines.

## Files

- `index.html` — website content and page structure
- `styles.css` — complete responsive styling
- `script.js` — mobile navigation, animations, and editable NEB data

## Quick Start

1. Download and unzip the project.
2. Open `index.html` in your browser.
3. Edit the content in `index.html`.
4. Edit the National Executive Board list in `script.js`.
5. Upload the three files to a GitHub repository.
6. Enable GitHub Pages for the repository.
7. Later, connect `amsn-ph.org` as the custom domain.

## Before Public Launch

Replace or verify:

- Official AMSN-PH logo / brand colors
- Approved Mission and Vision
- Complete and verified organizational history
- Current National Executive Board
- Current chapters
- Official social media links
- Official `connect@amsn-ph.org` email
- Current programs and ministries
- Privacy notice / data privacy page before introducing member accounts

## Phase 2 Ideas

The current code is intentionally static and lightweight.

For Phase 2, consider adding:

- Authentication / sign-up
- Verified member profiles
- Searchable member directory
- Chapter dashboards
- Officer / NEB Hub
- Tasks and goals
- Calendar
- File / Drive links
- Role-based permissions
- Admin dashboard

A backend such as Supabase can be added without replacing the public Phase 1 design.

## Brand Colors

All colors are controlled through CSS variables at the top of `styles.css`.

```css
--deep: #173a34;
--deep-2: #0f2d28;
--accent: #caa66a;
```

You can replace these with AMSN-PH's approved brand colors later.
