
document.addEventListener("DOMContentLoaded", async () => {
  const { roles } = await window.amsnSetupProtectedPage();

  if (!window.amsnRoleAllowsOfficerHub(roles)) {
    window.location.href = "dashboard.html";
    return;
  }

  const client = window.amsnRequireClient();
  const user = await window.amsnRequireUser();

  setupAnnouncementForm();
  setupEventForm();
  setupOpportunityForm();

  await Promise.all([
    loadOfficerEvents(),
    loadMentorshipRequests()
  ]);

  function setupAnnouncementForm() {
    const form = document.getElementById("announcement-form");
    const message = document.getElementById("announcement-message");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = {
        title: form.title.value.trim(),
        body: form.body.value.trim(),
        audience: form.audience.value,
        is_published: form.is_published.checked,
        published_at: form.is_published.checked ? new Date().toISOString() : null,
        created_by: user.id,
      };

      const { error } = await client.from("announcements").insert(payload);
      if (error) {
        window.amsnShowMessage(message, error.message, "error");
        return;
      }

      form.reset();
      window.amsnShowMessage(message, "Announcement saved.", "success");
    });
  }

  function setupEventForm() {
    const form = document.getElementById("event-create-form");
    const message = document.getElementById("event-create-message");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = {
        title: form.title.value.trim(),
        description: form.description.value.trim() || null,
        starts_at: new Date(form.starts_at.value).toISOString(),
        ends_at: form.ends_at.value ? new Date(form.ends_at.value).toISOString() : null,
        location: form.location.value.trim() || null,
        is_online: form.is_online.checked,
        registration_required: true,
        registration_deadline: form.registration_deadline.value
          ? new Date(form.registration_deadline.value).toISOString()
          : null,
        capacity: form.capacity.value ? Number(form.capacity.value) : null,
        status: "published",
        audience: "members",
        created_by: user.id
      };

      const { error } = await client.from("events").insert(payload);

      if (error) {
        window.amsnShowMessage(message, error.message, "error");
        return;
      }

      form.reset();
      window.amsnShowMessage(message, "Event published.", "success");
      await loadOfficerEvents();
    });
  }

  function setupOpportunityForm() {
    const form = document.getElementById("opportunity-create-form");
    const message = document.getElementById("opportunity-create-message");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = {
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        category: form.category.value,
        organization: form.organization.value.trim() || null,
        location: form.location.value.trim() || null,
        application_url: form.application_url.value.trim() || null,
        contact_email: form.contact_email.value.trim() || null,
        deadline: form.deadline.value ? new Date(form.deadline.value).toISOString() : null,
        is_published: true,
        created_by: user.id
      };

      const { error } = await client.from("opportunities").insert(payload);

      if (error) {
        window.amsnShowMessage(message, error.message, "error");
        return;
      }

      form.reset();
      window.amsnShowMessage(message, "Opportunity published.", "success");
    });
  }

  async function loadOfficerEvents() {
    const container = document.getElementById("officer-event-list");

    const { data, error } = await client
      .from("events")
      .select("id,title,starts_at,status,event_registrations(id,status)")
      .order("starts_at", { ascending: false })
      .limit(8);

    if (error) {
      container.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      return;
    }

    container.innerHTML = (data || []).map((event) => {
      const going = (event.event_registrations || []).filter((r) => r.status === "going").length;
      return `
        <div class="mentor-request">
          <strong>${escapeHtml(event.title)}</strong>
          <p>${escapeHtml(formatDateTime(event.starts_at))} • <span class="rsvp-count">${going} RSVP${going === 1 ? "" : "s"}</span></p>
        </div>
      `;
    }).join("") || '<div class="empty-state">No events posted yet.</div>';
  }

  async function loadMentorshipRequests() {
    const container = document.getElementById("officer-mentorship-list");

    const { data, error } = await client
      .from("mentorship_requests")
      .select(`
        id,
        preferred_specialty,
        preferred_region,
        goals,
        notes,
        status,
        matched_mentor_name,
        matched_mentor_contact,
        requester:profiles!mentorship_requests_requester_id_fkey(full_name,school_name,year_level)
      `)
      .in("status", ["pending","matching","matched"])
      .order("created_at", { ascending: true });

    if (error) {
      container.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      return;
    }

    if (!data?.length) {
      container.innerHTML = '<div class="empty-state">No active mentorship requests.</div>';
      return;
    }

    container.innerHTML = data.map((item) => `
      <article class="mentor-request">
        <span class="status-badge ${item.status === "matched" ? "verified" : "pending"}">${escapeHtml(item.status)}</span>
        <h3>${escapeHtml(item.requester?.full_name || "Member")} • ${escapeHtml(item.preferred_specialty || "General mentorship")}</h3>
        <p>${escapeHtml(item.requester?.school_name || "")}${item.requester?.year_level ? " • " + escapeHtml(item.requester.year_level) : ""}</p>
        <p>${escapeHtml(item.goals)}</p>

        <div class="form-grid" style="margin-top:14px">
          <div class="field">
            <label>Mentor name</label>
            <input data-mentor-name="${item.id}" value="${escapeHtml(item.matched_mentor_name || "")}">
          </div>
          <div class="field">
            <label>Mentor contact / note</label>
            <input data-mentor-contact="${item.id}" value="${escapeHtml(item.matched_mentor_contact || "")}">
          </div>
          <div class="field">
            <label>Status</label>
            <select data-mentor-status="${item.id}">
              <option value="pending" ${item.status === "pending" ? "selected" : ""}>Pending</option>
              <option value="matching" ${item.status === "matching" ? "selected" : ""}>Matching</option>
              <option value="matched" ${item.status === "matched" ? "selected" : ""}>Matched</option>
              <option value="closed" ${item.status === "closed" ? "selected" : ""}>Closed</option>
            </select>
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <button class="btn btn-blue btn-sm" data-save-mentor="${item.id}">Save Match</button>
          </div>
        </div>
      </article>
    `).join("");

    container.querySelectorAll("[data-save-mentor]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveMentor;
        const mentorName = container.querySelector(`[data-mentor-name="${id}"]`).value.trim() || null;
        const mentorContact = container.querySelector(`[data-mentor-contact="${id}"]`).value.trim() || null;
        const status = container.querySelector(`[data-mentor-status="${id}"]`).value;

        const { error } = await client
          .from("mentorship_requests")
          .update({
            matched_mentor_name: mentorName,
            matched_mentor_contact: mentorContact,
            status,
            handled_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (error) {
          alert(error.message);
          return;
        }

        await loadMentorshipRequests();
      });
    });
  }
});

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-PH", {
    year:"numeric", month:"short", day:"numeric",
    hour:"numeric", minute:"2-digit"
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
