
document.addEventListener("DOMContentLoaded", async () => {
  const { profile } = await window.amsnSetupProtectedPage();
  const gate = document.getElementById("directory-gate");
  const grid = document.getElementById("directory-grid");
  const search = document.getElementById("directory-search");

  if (profile.membership_status !== "verified") {
    gate.innerHTML = `
      <div class="empty-state">
        The member directory becomes available after your AMSN membership is verified.
      </div>`;
    search.disabled = true;
    return;
  }

  const client = window.amsnRequireClient();
  const { data, error } = await client
    .from("profiles")
    .select("id,full_name,preferred_name,school_name,year_level,city,region,bio,interests,mentorship_interest,collaboration_interest")
    .eq("membership_status", "verified")
    .eq("directory_visible", true)
    .order("full_name");

  if (error) {
    gate.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }

  let members = data || [];
  render(members);

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    const filtered = members.filter((member) => {
      const haystack = [
        member.full_name, member.preferred_name, member.school_name,
        member.year_level, member.city, member.region,
        ...(member.interests || [])
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
    render(filtered);
  });

  function render(list) {
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No members match your search.</div>';
      return;
    }

    grid.innerHTML = list.map((member) => {
      const tags = [];
      if (member.mentorship_interest) tags.push("Mentorship");
      if (member.collaboration_interest) tags.push("Collaboration");
      (member.interests || []).slice(0,4).forEach((tag) => tags.push(tag));

      return `
        <article class="member-card">
          <h3>${escapeHtml(member.preferred_name || member.full_name)}</h3>
          <p>${escapeHtml(member.school_name || "Medical school not listed")}</p>
          <p>${escapeHtml(member.year_level || "")}${member.region ? " • " + escapeHtml(member.region) : ""}</p>
          ${member.bio ? `<p>${escapeHtml(member.bio)}</p>` : ""}
          <div class="member-tags">
            ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </article>`;
    }).join("");
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
