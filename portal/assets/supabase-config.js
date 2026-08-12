
// AMSN-PH Phase 2 — Supabase configuration
// Use the Project URL and PUBLISHABLE key from Supabase.
// Never place a service_role / secret key in browser code.

window.AMSN_SUPABASE_URL = "YOUR_SUPABASE_URL";
window.AMSN_SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

window.AMSN_SUPABASE_CONFIGURED =
  !window.AMSN_SUPABASE_URL.includes("YOUR_") &&
  !window.AMSN_SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
