# AMSN-PH Static Multi-Page Website — V1

This package restructures the public website into a simple, true multi-page site.

## Branding rule
Use **AMSN-PH** everywhere.

The package intentionally avoids mixed forms such as:
- AMSN-Ph
- AMSN PH
- AMSN-ph

Long-form organization name:
**Adventist Medical Students Network – Philippines**

## Site structure

- `/` — minimal landing page
- `/about` — mission, vision, values, membership overview
- `/leadership` — separate officer page
- `/chapters` — separate chapters/member organizations page
- `/programs` — programs, events, ministries
- `/stories` — published/community stories
- `/submit-story` — public story submission form
- `/contact` — public inquiry form
- `/portal/` — existing Member Portal

Navigation links point to separate pages. They are NOT anchor links to sections on the homepage.

## Homepage philosophy

The landing page contains only:
1. Hero
2. Three short pillars
3. Two simple calls-to-action

Detailed content belongs on the separate pages.

## Forms

Two public forms are included:
- Inquiry form
- Submit Your Story form

### To connect them to Supabase

1. Run `supabase-public-forms.sql` in Supabase SQL Editor.
2. Copy:
   `assets/js/config.example.js`
   to:
   `assets/js/config.js`
3. Put ONLY your public Supabase values in `config.js`:

```js
window.AMSN_FORM_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY"
};
```

Never place a service-role key in frontend code.

The included RLS policies:
- allow anonymous INSERT only
- do not allow anonymous SELECT
- do not allow anonymous UPDATE/DELETE

This means public users can submit but cannot read other submissions.

## Before going live

Update:
- current leadership names and photos
- current chapter list
- social/contact details if desired
- actual stories after editorial approval

The previous AMSN-PH chapter names are included only as starter content and should be reviewed before deployment.

## Deployment

This is a no-build static website.

For Vercel:
- upload/deploy the folder
- `vercel.json` enables clean URLs

The existing `/portal/` should remain separate and continue handling authentication/member functions.
