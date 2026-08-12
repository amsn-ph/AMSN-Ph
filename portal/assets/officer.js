
document.addEventListener("DOMContentLoaded", async () => {
  const { roles } = await window.amsnSetupProtectedPage();
  if (!window.amsnRoleAllowsOfficerHub(roles)) {
    window.location.href = "dashboard.html";
    return;
  }

  const isAdmin = roles.some((r) => r.role === "admin");
  const canReview = roles.some((r) => ["admin","neb_officer"].includes(r.role));
  const reviewSection = document.getElementById("membership-review-card");
  if (!canReview) reviewSection.hidden = true;

  const client = window.amsnRequireClient();

  if (canReview) {
    await loadPending();
  }

  const form = document.getElementById("announcement-form");
  const message = document.getElementById("announcement-message");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const user = await window.amsnRequireUser();
      const payload = {
        title: form.title.value.trim(),
        body: form.body.value.trim(),
        audience: form.audience.value,
        is_published: form.is_published.checked,
        published_at: form.is_published.checked ? new Date().toISOString() : null,
        created_by: user.id,
      };

      const { error } = await client.from("announcements").insert(payload);
      if (error) throw error;

      form.reset();
      window.amsnShowMessage(message, "Announcement saved.", "success");
    } catch (error) {
      window.amsnShowMessage(message, error.message, "error");
    }
  });

  async function loadPending() {
    const body = document.getElementById("pending-members-body");
    const { data, error } = await client
      .from("profiles")
      .select("id,full_name,school_name,year_level,region,created_at,membership_status")
      .eq("membership_status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      body.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    if (!data?.length) {
      body.innerHTML = `<tr><td colspan="6">No pending applications.</td></tr>`;
      return;
    }

    body.innerHTML = data.map((profile) => `
      <tr>
        <td><strong>${escapeHtml(profile.full_name)}</strong></td>
        <td>${escapeHtml(profile.school_name || "—")}</td>
        <td>${escapeHtml(profile.year_level || "—")}</td>
        <td>${escapeHtml(profile.region || "—")}</td>
        <td>${new Date(profile.created_at).toLocaleDateString("en-PH")}</td>
        <td>
          <div class="action-row">
            <button class="btn btn-blue btn-sm" data-review="${profile.id}" data-status="verified">Verify</button>
            <button class="btn btn-danger btn-sm" data-review="${profile.id}" data-status="rejected">Reject</button>
          </div>
        </td>
      </tr>
    `).join("");

    body.querySelectorAll("[data-review]").forEach((button) => {
      button.addEventListener("click", async () => {
        button.disabled = true;
        const { error } = await client.rpc("review_membership", {
          target_user: button.dataset.review,
          new_status: button.dataset.status,
        });
        if (error) {
          alert(error.message);
          button.disabled = false;
          return;
        }
        await loadPending();
      });
    });
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
