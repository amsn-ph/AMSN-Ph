
document.addEventListener("DOMContentLoaded", async () => {
  const setup = await window.amsnSetupProtectedPage();
  const { profile, roles } = setup;

  document.getElementById("welcome-name").textContent =
    profile.preferred_name || profile.full_name || "Member";

  const status = document.getElementById("membership-status");
  status.textContent = profile.membership_status || "pending";
  status.classList.add(profile.membership_status || "pending");

  document.getElementById("school-name").textContent = profile.school_name || "Not yet added";
  document.getElementById("year-level").textContent = profile.year_level || "—";
  document.getElementById("region-name").textContent = profile.region || "—";

  const roleNames = (roles || []).map((r) => r.role.replaceAll("_", " "));
  document.getElementById("role-list").textContent = roleNames.length ? roleNames.join(", ") : "Member";

  const client = window.amsnRequireClient();

  const announcementsEl = document.getElementById("announcement-list");
  const eventsEl = document.getElementById("event-list");

  const { data: announcements } = await client
    .from("announcements")
    .select("id,title,body,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(4);

  if (announcements?.length) {
    announcementsEl.innerHTML = announcements.map((item) => `
      <li>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${formatDate(item.published_at)}</small>
        <div>${escapeHtml(item.body || "")}</div>
      </li>
    `).join("");
  } else {
    announcementsEl.innerHTML = '<li><small>No announcements available yet.</small></li>';
  }

  const { data: events } = await client
    .from("events")
    .select("id,title,starts_at,location,is_online")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(4);

  if (events?.length) {
    eventsEl.innerHTML = events.map((item) => `
      <li>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${formatDateTime(item.starts_at)} • ${escapeHtml(item.is_online ? "Online" : (item.location || "TBA"))}</small>
      </li>
    `).join("");
  } else {
    eventsEl.innerHTML = '<li><small>No upcoming events posted yet.</small></li>';
  }

  const directoryButton = document.getElementById("directory-button");
  if (profile.membership_status !== "verified") {
    directoryButton.classList.add("disabled");
    directoryButton.setAttribute("aria-disabled", "true");
    directoryButton.href = "#";
    directoryButton.textContent = "Directory unlocks after verification";
  }
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", { year:"numeric", month:"short", day:"numeric" }).format(new Date(value));
}
function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", { year:"numeric", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }).format(new Date(value));
}
