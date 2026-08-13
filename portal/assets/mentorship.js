
document.addEventListener("DOMContentLoaded", async () => {
  const { user, profile } = await window.amsnSetupProtectedPage();
  const client = window.amsnRequireClient();
  const form = document.getElementById("mentorship-form");
  const list = document.getElementById("mentorship-list");
  const message = document.getElementById("mentorship-message");

  if (profile.membership_status !== "verified") {
    form.querySelectorAll("input,select,textarea,button").forEach((el) => el.disabled = true);
    list.innerHTML = '<div class="empty-state">Mentorship requests become available after your membership is verified.</div>';
    return;
  }

  await loadRequests();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      requester_id: user.id,
      preferred_specialty: form.preferred_specialty.value.trim() || null,
      preferred_region: form.preferred_region.value || "Any",
      goals: form.goals.value.trim(),
      notes: form.notes.value.trim() || null,
      status: "pending"
    };

    const { error } = await client.from("mentorship_requests").insert(payload);

    if (error) {
      window.amsnShowMessage(message, error.message, "error");
      return;
    }

    form.reset();
    form.preferred_region.value = "Any";
    window.amsnShowMessage(message, "Your mentorship request was submitted.", "success");
    await loadRequests();
  });

  async function loadRequests() {
    const { data, error } = await client
      .from("mentorship_requests")
      .select("id,preferred_specialty,preferred_region,goals,notes,status,matched_mentor_name,matched_mentor_contact,created_at,updated_at")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      return;
    }

    if (!data?.length) {
      list.innerHTML = '<div class="empty-state">You have not submitted a mentorship request yet.</div>';
      return;
    }

    list.innerHTML = data.map((item) => `
      <article class="mentor-request">
        <span class="status-badge ${item.status === "matched" ? "verified" : item.status === "cancelled" ? "rejected" : "pending"}">${escapeHtml(item.status)}</span>
        <h3>${escapeHtml(item.preferred_specialty || "General mentorship")}</h3>
        <p>${escapeHtml(item.goals)}</p>
        <small>Submitted ${escapeHtml(formatDate(item.created_at))} • Preferred region: ${escapeHtml(item.preferred_region || "Any")}</small>
        ${item.matched_mentor_name ? `<p><strong>Matched mentor:</strong> ${escapeHtml(item.matched_mentor_name)}</p>` : ""}
        ${item.matched_mentor_contact ? `<p><strong>Contact:</strong> ${escapeHtml(item.matched_mentor_contact)}</p>` : ""}
        ${["pending","matching"].includes(item.status)
          ? `<div class="action-row" style="margin-top:12px">
               <button class="btn btn-light btn-sm" data-cancel-request="${item.id}">Cancel Request</button>
             </div>`
          : ""}
      </article>
    `).join("");

    list.querySelectorAll("[data-cancel-request]").forEach((button) => {
      button.addEventListener("click", async () => {
        const { error } = await client
          .from("mentorship_requests")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", button.dataset.cancelRequest)
          .eq("requester_id", user.id);

        if (error) {
          window.amsnShowMessage(message, error.message, "error");
          return;
        }
        await loadRequests();
      });
    });
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
