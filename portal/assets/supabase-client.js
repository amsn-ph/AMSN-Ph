// AMSN-PH V2.6.1 portal polish bootstrap.
// This section changes presentation/navigation only. Auth, roles, RLS,
// profile loading and database behavior below remain unchanged.
(function ensurePortalPolish() {
  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .some((link) => (link.getAttribute("href") || "").includes("portal-polish-v2.6.css"));

  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "assets/portal-polish-v2.6.css?v=2.6.1";
    link.dataset.amsnPolish = "portal-v2.6.1";
    document.head.appendChild(link);
  }

  const setupMobilePortalNav = () => {
    const sidebar = document.querySelector(".portal-sidebar");
    const nav = sidebar?.querySelector(".portal-nav");
    const brand = sidebar?.querySelector(".portal-brand");

    if (!sidebar || !nav || !brand || sidebar.dataset.mobileNavReady === "true") return;

    sidebar.dataset.mobileNavReady = "true";
    sidebar.classList.add("has-mobile-toggle");
    nav.id = nav.id || "portal-primary-nav";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "portal-mobile-menu-toggle";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<span>Menu</span><span aria-hidden="true">☰</span>';

    brand.insertAdjacentElement("afterend", toggle);

    const close = () => {
      sidebar.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.querySelector("span:first-child").textContent = "Menu";
    };

    toggle.addEventListener("click", () => {
      const open = sidebar.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector("span:first-child").textContent = open ? "Close" : "Menu";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 1000) close();
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sidebar.classList.contains("nav-open")) {
        close();
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1000) close();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupMobilePortalNav, { once: true });
  } else {
    setupMobilePortalNav();
  }
})();

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

window.amsnClearMessage = function (element) {
  if (!element) return;
  element.textContent = "";
  element.className = "message";
};

window.amsnRequireClient = function () {
  if (!window.amsnSupabase) {
    throw new Error(
      "Supabase is not configured yet. Open portal/assets/supabase-config.js and add your Project URL and publishable key."
    );
  }
  return window.amsnSupabase;
};

window.amsnWithTimeout = function (promise, milliseconds = 8000, label = "Request") {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} took too long. Please check your connection and try again.`));
    }, milliseconds);
  });

  return Promise.race([Promise.resolve(promise), timeout])
    .finally(() => clearTimeout(timeoutId));
};

window.amsnRequireUser = async function () {
  const client = window.amsnRequireClient();

  // Fast path: Supabase already stores the authenticated session locally.
  // RLS still validates every database request server-side.
  const { data: sessionData, error: sessionError } =
    await window.amsnWithTimeout(
      client.auth.getSession(),
      5000,
      "Session check"
    );

  if (!sessionError && sessionData?.session?.user) {
    return sessionData.session.user;
  }

  // Fallback for an unusual/stale local session.
  const { data, error } = await window.amsnWithTimeout(
    client.auth.getUser(),
    7000,
    "Sign-in check"
  );

  if (error || !data?.user) {
    window.location.href = "index.html";
    throw new Error("Not signed in");
  }

  return data.user;
};

window.amsnLoadProfile = async function (userId) {
  const client = window.amsnRequireClient();

  const { data, error } = await window.amsnWithTimeout(
    client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single(),
    8000,
    "Profile"
  );

  if (error) throw error;
  return data;
};

window.amsnLoadOwnRoles = async function (userId) {
  const client = window.amsnRequireClient();

  try {
    const { data, error } = await window.amsnWithTimeout(
      client
        .from("user_roles")
        .select("role, chapter_id")
        .eq("user_id", userId),
      8000,
      "Role check"
    );

    if (error) return [];
    return data || [];
  } catch {
    // Role loading should not block an ordinary member page forever.
    return [];
  }
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

  // Profile and roles are independent: load them at the same time.
  const [profile, roles] = await Promise.all([
    window.amsnLoadProfile(user.id),
    window.amsnLoadOwnRoles(user.id)
  ]);

  const userChip = document.querySelector("[data-user-chip]");
  if (userChip) {
    userChip.textContent =
      profile.preferred_name ||
      profile.full_name ||
      user.email;
  }

  document.querySelectorAll(".officer-link").forEach((officerLink) => {
    if (window.amsnRoleAllowsOfficerHub(roles)) {
      officerLink.classList.add("visible");
    }
  });

  document.querySelectorAll(".admin-link").forEach((adminLink) => {
    if (window.amsnRoleAllowsAdminPanel(roles)) {
      adminLink.classList.add("visible");
    }
  });

  document.querySelectorAll("[data-signout]").forEach((button) => {
    if (button.dataset.signoutReady === "true") return;

    button.dataset.signoutReady = "true";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await window.amsnSupabase.auth.signOut();
      } finally {
        window.location.href = "index.html";
      }
    });
  });

  return { user, profile, roles };
};
