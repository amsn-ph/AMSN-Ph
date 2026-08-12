# AMSN-PH Phase 2 — Setup Guide

## What this starter already includes

The public Phase 1 website remains intact. Phase 2 adds a `portal/` directory with:

- Email/password sign-up and sign-in
- New accounts default to **Pending**
- Member profile editing
- Privacy-controlled verified member directory
- Role-aware navigation
- Officer Hub
- NEB/admin membership verification
- Officer announcements
- Database tables ready for events, resources, and tasks
- Supabase Row Level Security starter policies

## Recommended Phase 2 MVP

Do **not** build every officer feature at once.

First test this exact flow:

1. Student creates an account.
2. Student confirms their email.
3. A profile is automatically created as `pending`.
4. Authorized NEB/admin reviews the affiliation.
5. Status becomes `verified`.
6. Verified member can enter the member directory.
7. Admin assigns roles such as `trustee`, `chapter_officer`, or `neb_officer`.
8. Officer Hub appears automatically for those roles.

Once that works with real test accounts, add events/resources/tasks.

---

## 1. Create a Supabase project

Create a dedicated Supabase project for AMSN-PH.

Do not reuse an unrelated project.

From the project **Connect** dialog, obtain:

- Project URL
- Publishable key

Put them in:

`portal/assets/supabase-config.js`

Example:

```js
window.AMSN_SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
window.AMSN_SUPABASE_PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY";
```

The browser should use only the **publishable** key.

**Never place a `service_role` or secret key in GitHub, HTML, or frontend JavaScript.**

---

## 2. Create the database

In Supabase:

**SQL Editor → New query**

Open:

`supabase/phase2-schema.sql`

Copy the complete SQL into the SQL editor and run it.

This creates:

- `profiles`
- `chapters`
- `user_roles`
- `announcements`
- `events`
- `resources`
- `tasks`

It also enables RLS and creates the signup trigger.

---

## 3. Configure Auth URLs

For development on your current GitHub Pages deployment, add an allowed redirect such as:

`https://amsn-ph.github.io/AMSN-Ph/portal/dashboard.html`

When `amsn-ph.org` becomes the production URL, make the production Site URL:

`https://amsn-ph.org`

and add the exact portal redirect URL:

`https://amsn-ph.org/portal/dashboard.html`

Also add any local URL you use for testing.

---

## 4. Create the first admin

First, sign up normally through the portal.

Then go to Supabase SQL Editor and run:

```sql
insert into public.user_roles(user_id, role)
select id, 'admin'
from auth.users
where email = 'YOUR_EMAIL@example.com'
on conflict do nothing;

update public.profiles
set membership_status = 'verified'
where id = (
  select id from auth.users
  where email = 'YOUR_EMAIL@example.com'
);
```

Replace the email with the actual AMSN admin account.

After signing out and back in, the **Officer Hub** should appear.

---

## 5. Test with at least three accounts

Recommended beta:

### Account A — Admin / NEB
- Verified
- Role: `admin`
- Should see Officer Hub
- Can verify members

### Account B — New applicant
- Status: `pending`
- Can edit own profile
- Cannot see member directory

### Account C — Verified member
- Status: `verified`
- Role: `member`
- Can see directory
- Cannot see Officer Hub

Then test a fourth account assigned as `trustee`.

---

## 6. Assign officer roles

After you have an admin, use this RPC in SQL or later add an admin UI.

Example:

```sql
select public.assign_user_role(
  'USER_UUID_HERE',
  'trustee',
  null
);
```

Available roles in this starter:

- `member`
- `trustee`
- `chapter_officer`
- `neb_officer`
- `admin`

Do **not** put roles in editable user metadata as the source of authorization.

---

## 7. Privacy decisions to finalize before wider beta

Before collecting a national membership database, AMSN-PH should formally decide:

- Which profile fields are required vs optional
- Who may verify accounts
- Which officers may access contact details
- How long inactive/rejected accounts are retained
- Whether birth date is actually necessary
- Whether phone numbers should ever appear in the member directory
- How members request correction/deletion
- What happens during officer turnover
- How admin access is transferred
- What information is visible to other members

The starter intentionally does **not** put birth date, phone number, home address, or sensitive personal data in the public member directory.

---

## 8. Suggested next build order

After the MVP works:

### Phase 2A — Member Network
- Chapter field + verified chapter list
- Better directory filters
- Profile photos
- Mentorship matching
- Opportunities board
- Event registration
- Member ID/status page

### Phase 2B — Officer Hub
- Event manager
- Resources/files
- Meeting minutes index
- Task assignments
- Chapter/trustee coverage dashboard
- Turnover archive
- Internal announcements

### Phase 2C — Automation / integrations
Only after the database and permissions are stable:
- email notifications
- calendar integration
- Drive/document links
- member renewal reminders
- officer turnover workflows

---

## Important

This package is a **Phase 2 starter**, not a finished production membership system.

Before a national rollout:
- test all RLS policies with different accounts
- use Supabase security/performance advisors
- verify current AMSN privacy policy and consent language
- confirm the exact officer approval workflow
- back up the database before major schema changes


---

# V2.1 — Admin / Verification Panel

Phase 2.1 separates **organizational officer access** from **system administration**.

## Roles

- `member` — standard member account
- `trustee` — school/campus trustee access
- `chapter_officer` — chapter-level officer access
- `neb_officer` — National Executive Board workspace access
- `verifier` — may verify/reject AMSN membership applications
- `admin` — may verify members and assign system roles

An NEB officer is **not automatically a verifier or administrator**.

## IMPORTANT: Existing Supabase project

If you already ran the original Phase 2 schema, do **not** rerun the full schema.

Instead run:

`supabase/v2.1-admin-verifier-migration.sql`

in Supabase SQL Editor.

## Admin page

The new page is:

`portal/admin.html`

### Verifier can:
- see pending applicants
- verify or reject applications
- add optional verification notes
- read membership verification history

### Administrator can also:
- see verified users
- assign Trustee
- assign Chapter Officer
- assign NEB Officer
- assign Verifier
- assign Administrator

## Audit trail

When a verifier/admin reviews a membership application, AMSN now records:

- previous status
- new status
- review note
- reviewer
- review date/time

The member profile also stores:

- `verified_at`
- `verified_by`
- `verification_notes`

## Recommended first setup

1. Run the V2.1 migration.
2. Make your own user an `admin`.
3. Sign out and sign back in.
4. Open `portal/admin.html`.
5. Create a second test account.
6. Verify that second account from the Admin / Verification Panel.
7. Assign a third test account as `verifier`.
8. Confirm that the verifier can approve members but cannot assign roles.

This should be tested before a wider AMSN rollout.
