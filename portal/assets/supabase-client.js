
(function () {
  if (!window.AMSN_SUPABASE_CONFIGURED) {
    window.amsnSupabase = null;
    return;
  }

  window.amsnSupabase = window.supabase.createClient(
    window.AMSN_SUPABASE_URL,
    window.AMSN_SUPABASE_PUBLISHABLE_KEY
  );
})();

window.amsnShowMessage = function (element, text, type = "") {
  if (!element) return;
  element.textContent = text;
  element.className = "message visible" + (type ? " " + type : "");
};

window.amsnRequireClient = function () {
  if (!window.amsnSupabase) {
    throw new Error("Supabase is not configured yet. Open portal/assets/supabase-config.js and add your Project URL and publishable key.");
  }
  return window.amsnSupabase;
};

window.amsnRequireUser = async function () {
  const client = window.amsnRequireClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    window.location.href = "index.html";
    throw new Error("Not signed in");
  }
  return data.user;
};

window.amsnLoadProfile = async function (userId) {
  const client = window.amsnRequireClient();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
};

window.amsnLoadOwnRoles = async function (userId) {
  const client = window.amsnRequireClient();
  const { data, error } = await client
    .from("user_roles")
    .select("role, chapter_id")
    .eq("user_id", userId);
  if (error) return [];
  return data || [];
};

window.amsnRoleAllowsOfficerHub = function (roles) {
  const allowed = ["trustee", "chapter_officer", "neb_officer", "admin"];
  return (roles || []).some((entry) => allowed.includes(entry.role));
};

window.amsnRoleAllowsAdminPanel = function (roles) {
  const allowed = ["verifier", "admin"];
  return (roles || []).some((entry) => allowed.includes(entry.role));
};

window.amsnIsAdmin = function (roles) {
  return (roles || []).some((entry) => entry.role === "admin");
};

window.amsnSetupProtectedPage = async function () {
  const user = await window.amsnRequireUser();
  const profile = await window.amsnLoadProfile(user.id);
  const roles = await window.amsnLoadOwnRoles(user.id);

  const userChip = document.querySelector("[data-user-chip]");
  if (userChip) userChip.textContent = profile.preferred_name || profile.full_name || user.email;

  const officerLink = document.querySelector(".officer-link");
  if (officerLink && window.amsnRoleAllowsOfficerHub(roles)) {
    officerLink.classList.add("visible");
  }

  const adminLink = document.querySelector(".admin-link");
  if (adminLink && window.amsnRoleAllowsAdminPanel(roles)) {
    adminLink.classList.add("visible");
  }

  document.querySelectorAll("[data-signout]").forEach((button) => {
    button.addEventListener("click", async () => {
      await window.amsnSupabase.auth.signOut();
      window.location.href = "index.html";
    });
  });

  return { user, profile, roles };
};
