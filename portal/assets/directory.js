
document.addEventListener("DOMContentLoaded", async () => {
  const { profile } = await window.amsnSetupProtectedPage();
  const gate = document.getElementById("directory-gate");
  const grid = document.getElementById("directory-grid");
  const search = document.getElementById("directory-search");
  const regionFilter = document.getElementById("directory-region");
  const chapterFilter = document.getElementById("directory-chapter");
  const schoolFilter = document.getElementById("directory-school");

  if (profile.membership_status !== "verified") {
    gate.innerHTML = `
      <div class="empty-state">
        The member directory becomes available after your AMSN membership is verified.
      </div>`;
    [search,regionFilter,chapterFilter,schoolFilter].forEach((el) => el.disabled = true);
    return;
  }

  const client = window.amsnRequireClient();

  const [{ data, error }, { data: chapters }, { data: schools }] = await Promise.all([
    client
      .from("profiles")
      .select(`
        id,
        full_name,
        preferred_name,
        school_name,
        medical_school_id,
        chapter_id,
        year_level,
        city,
        region,
        bio,
        interests,
        mentorship_interest,
        collaboration_interest,
        avatar_path,
        medical_school:medical_schools(name,short_name),
        chapter:chapters(code,name)
      `)
      .eq("membership_status", "verified")
      .eq("directory_visible", true)
      .order("full_name"),
    client.from("chapters").select("id,code,name").eq("is_active", true).order("code"),
    client.from("medical_schools").select("id,name,short_name").eq("is_active", true).order("name")
  ]);

  if (error) {
    gate.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }

  const members = data || [];
  await attachAvatarUrls(members);

  chapterFilter.innerHTML =
    '<option value="">All affiliations</option>' +
    (chapters || []).map((c) => `<option value="${c.id}">${escapeHtml(c.code)}</option>`).join("");

  schoolFilter.innerHTML =
    '<option value="">All schools</option>' +
    (schools || []).map((s) => `<option value="${s.id}">${escapeHtml(s.short_name || s.name)}</option>`).join("");

  render();

  [search,regionFilter,chapterFilter,schoolFilter].forEach((control) => {
    control.addEventListener(control.tagName === "INPUT" ? "input" : "change", render);
  });

  async function attachAvatarUrls(list) {
    await Promise.all(list.map(async (member) => {
      if (!member.avatar_path) return;
      const { data } = await client.storage
        .from("profile-photos")
        .createSignedUrl(member.avatar_path, 3600);
      member.avatar_url = data?.signedUrl || data?.signedURL || "";
    }));
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const region = regionFilter.value;
    const chapter = chapterFilter.value;
    const school = schoolFilter.value;

    const list = members.filter((member) => {
      if (region && member.region !== region) return false;
      if (chapter && member.chapter_id !== chapter) return false;
      if (school && member.medical_school_id !== school) return false;

      const haystack = [
        member.full_name,
        member.preferred_name,
        member.medical_school?.name,
        member.medical_school?.short_name,
        member.school_name,
        member.year_level,
        member.city,
        member.region,
        member.chapter?.code,
        member.chapter?.name,
        ...(member.interests || [])
      ].join(" ").toLowerCase();

      return !q || haystack.includes(q);
    });

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No members match your filters.</div>';
      return;
    }

    grid.innerHTML = list.map((member) => {
      const tags = [];
      if (member.mentorship_interest) tags.push("Mentorship");
      if (member.collaboration_interest) tags.push("Collaboration");
      (member.interests || []).slice(0,4).forEach((tag) => tags.push(tag));

      const displayName = member.preferred_name || member.full_name;
      const initials = initialsFor(displayName);
      const schoolName = member.medical_school?.short_name ||
        member.medical_school?.name ||
        member.school_name ||
        "Medical school not listed";
      const chapterCode = member.chapter?.code || "";

      return `
        <article class="member-card">
          <div class="member-card-header">
            <div class="directory-avatar">
              ${member.avatar_url
                ? `<img src="${escapeHtml(member.avatar_url)}" alt="${escapeHtml(displayName)} profile photo">`
                : `<span>${escapeHtml(initials)}</span>`}
            </div>
            <div>
              <h3>${escapeHtml(displayName)}</h3>
              <p>${escapeHtml(schoolName)}</p>
            </div>
          </div>
          <p>
            ${escapeHtml(member.year_level || "")}
            ${member.region ? " • " + escapeHtml(member.region) : ""}
            ${chapterCode ? " • " + escapeHtml(chapterCode) : ""}
          </p>
          ${member.bio ? `<p>${escapeHtml(member.bio)}</p>` : ""}
          <div class="member-tags">
            ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </article>`;
    }).join("");
  }
});

function initialsFor(name) {
  return String(name || "AM")
    .trim().split(/\s+/).slice(0,2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AM";
}
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
