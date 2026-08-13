
document.addEventListener("DOMContentLoaded", async () => {
  const { profile } = await window.amsnSetupProtectedPage();
  const client = window.amsnRequireClient();
  const grid = document.getElementById("opportunities-grid");
  const search = document.getElementById("opp-search");
  const category = document.getElementById("opp-category");

  if (profile.membership_status !== "verified") {
    grid.innerHTML = '<div class="empty-state">Opportunities become available after your membership is verified.</div>';
    search.disabled = true;
    category.disabled = true;
    return;
  }

  const { data, error } = await client
    .from("opportunities")
    .select("id,title,description,category,organization,location,application_url,contact_email,deadline,chapter:chapters(code,name)")
    .eq("is_published", true)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (error) {
    grid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }

  const opportunities = data || [];
  render();

  search.addEventListener("input", render);
  category.addEventListener("change", render);

  function render() {
    const q = search.value.trim().toLowerCase();
    const selectedCategory = category.value;

    const visible = opportunities.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      const haystack = [
        item.title, item.description, item.organization,
        item.location, item.chapter?.code, item.chapter?.name
      ].join(" ").toLowerCase();

      return !q || haystack.includes(q);
    });

    if (!visible.length) {
      grid.innerHTML = '<div class="empty-state">No opportunities match your filters.</div>';
      return;
    }

    grid.innerHTML = visible.map((item) => `
      <article class="engagement-card">
        <span class="card-label">${escapeHtml(item.category.toUpperCase())}${item.chapter?.code ? " • " + escapeHtml(item.chapter.code) : ""}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="meta-row">
          ${item.organization ? `<span>${escapeHtml(item.organization)}</span>` : ""}
          ${item.location ? `<span>${escapeHtml(item.location)}</span>` : ""}
        </div>
        <p>${escapeHtml(item.description)}</p>
        ${item.deadline ? `<p class="opportunity-deadline">Deadline: ${escapeHtml(formatDate(item.deadline))}</p>` : ""}
        <div class="action-row">
          ${item.application_url ? `<a class="btn btn-blue btn-sm" href="${escapeHtml(item.application_url)}" target="_blank" rel="noopener">Open Opportunity ↗</a>` : ""}
          ${item.contact_email ? `<a class="btn btn-light btn-sm" href="mailto:${encodeURIComponent(item.contact_email)}">Contact</a>` : ""}
        </div>
      </article>
    `).join("");
  }
});

function formatDate(value) {
  return new Intl.DateTimeFormat("en-PH", {
    year:"numeric", month:"short", day:"numeric"
  }).format(new Date(value));
}
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
