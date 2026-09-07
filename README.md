# AMSN-PH Membership Registration Patch

This patch implements the requested classification:

## SDA
- YL1 / First Year -> Regular Member
- YL2 / Second Year -> Regular Member
- YL3 / Third Year -> Regular Member
- YL4 / Clerk -> Associate Member
- YL5 / Post-Graduate Intern -> Associate Member
- Graduate / PLE Review -> Associate Member
- Licensed Physician -> Honorary Member

## Non-SDA
All academic/professional statuses -> Affiliate Member

"Other" is intentionally removed.

## Files

1. `membership-fields.html`
   - Drop-in form fields for affiliation, academic/professional status, and
     read-only automatic membership classification.

2. `membership-logic.js`
   - Frontend classification and display logic.

3. `amsn-membership-migration.sql`
   - Adds database fields, check constraints, classification function, and
     trigger so membership type is recomputed in Supabase and cannot be
     trusted from browser input alone.

## Recommended integration

### Registration form
Insert the HTML block into the current AMSN registration form.

Include the JavaScript file after the existing registration JS:

```html
<script src="membership-logic.js"></script>
```

### Signup payload
Store:
- `religious_affiliation`
- `academic_status`

The SQL trigger calculates `membership_type`.

If the current signup uses Supabase Auth metadata first, include:

```js
options: {
  data: {
    ...existingMetadata,
    religious_affiliation: document.getElementById("religious-affiliation").value,
    academic_status: document.getElementById("academic-status").value
  }
}
```

Then make sure the existing `handle_new_user()` trigger copies those two metadata
fields into the profile/member table.

### Database
Run `amsn-membership-migration.sql` once in Supabase SQL Editor.

IMPORTANT: the migration assumes the AMSN member table is `public.profiles`.
If the live project uses a different table, replace that table name before running.

## UI behavior

Example:
- SDA + YL2 -> Regular Member
- SDA + YL5 -> Associate Member
- SDA + Licensed Physician -> Honorary Member
- Non-SDA + any listed status -> Affiliate Member

The user never manually selects a membership type.
