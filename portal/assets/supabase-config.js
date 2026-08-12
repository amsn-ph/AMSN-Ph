
// AMSN-PH Phase 2 — Supabase configuration
// Use the Project URL and PUBLISHABLE key from Supabase.
// Never place a service_role / secret key in browser code.

window.AMSN_SUPABASE_URL = "https://gmbxtesrznqsuomfphai.supabase.co";
window.AMSN_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xsIG0rEmJYzlAPAsfXdq7g_7mirmHOm";

window.AMSN_SUPABASE_CONFIGURED =
  !window.AMSN_SUPABASE_URL.includes("YOUR_") &&
  !window.AMSN_SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
