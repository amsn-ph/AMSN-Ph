
document.addEventListener("DOMContentLoaded", async () => {
  const { roles } = await window.amsnSetupProtectedPage();

  if (!window.amsnRoleAllowsAdminPanel(roles)) {
    window.location.href = "dashboard.html";
    return;
  }

  const client = window.amsnRequireClient();
  const isAdmin = window.amsnIsAdmin(roles);
  const message = document.getElementById("admin-message");

  if (isAdmin) {
    document.getElementById("role-management-section").classList.add("visible");
  }

  await Promise.all([
    loadCounts(),
    loadPending(),
    loadAudit(),
    isAdmin ? loadRoleUsers() : Promise.resolve(),
  ]);

  async function loadCounts() {
    const statuses = ["pending", "verified", "rejected"];

    for (const status of statuses) {
      const { count, error } = await client
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("membership_status", status);

      const el = document.getElementById(`count-${status}`);
      el.textContent = error ? "—" : String(count ?? 0);
    }
  }

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
        <td>
          <strong>${escapeHtml(profile.full_name || "Unnamed applicant")}</strong>
        </td>
        <td>
          ${escapeHtml(profile.school_name || "—")}
          <br><small>${escapeHtml(profile.year_level || "—")}</small>
        </td>
        <td>${escapeHtml(profile.region || "—")}</td>
        <td>${formatDate(profile.created_at)}</td>
        <td>
          <textarea class="review-note" data-note="${profile.id}" placeholder="Optional note for the audit record"></textarea>
        </td>
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
        const target = button.dataset.review;
        const status = button.dataset.status;
        const noteField = body.querySelector(`[data-note="${target}"]`);
        const note = noteField?.value?.trim() || null;

        const actionLabel = status === "verified" ? "verify" : "reject";
        if (!confirm(`Are you sure you want to ${actionLabel} this membership application?`)) return;

        button.disabled = true;

        const { error } = await client.rpc("review_membership", {
          target_user: target,
          new_status: status,
          review_note: note,
        });

        if (error) {
          window.amsnShowMessage(message, error.message, "error");
          button.disabled = false;
          return;
        }

        window.amsnShowMessage(
          message,
          status === "verified" ? "Member verified successfully." : "Application marked as rejected.",
          "success"
        );

        await Promise.all([loadCounts(), loadPending(), loadAudit()]);
      });
    });
  }

  async function loadAudit() {
    const list = document.getElementById("audit-list");

    const { data, error } = await client
      .from("membership_reviews")
      .select(`
        id,
        previous_status,
        new_status,
        notes,
        reviewed_at,
        member:profiles!membership_reviews_user_id_fkey(full_name,school_name),
        reviewer:profiles!membership_reviews_reviewed_by_fkey(full_name)
      `)
      .order("reviewed_at", { ascending: false })
      .limit(20);

    if (error) {
      list.innerHTML = `<li><small>${escapeHtml(error.message)}</small></li>`;
      return;
    }

    if (!data?.length) {
      list.innerHTML = `<li><small>No membership review actions recorded yet.</small></li>`;
      return;
    }

    list.innerHTML = data.map((item) => `
      <li>
        <strong>
          ${escapeHtml(item.member?.full_name || "Member")}:
          ${escapeHtml(item.previous_status || "—")} → ${escapeHtml(item.new_status)}
        </strong>
        <small>
          ${formatDateTime(item.reviewed_at)}
          ${item.reviewer?.full_name ? " • " + escapeHtml(item.reviewer.full_name) : ""}
          ${item.member?.school_name ? " • " + escapeHtml(item.member.school_name) : ""}
        </small>
        ${item.notes ? `<div>${escapeHtml(item.notes)}</div>` : ""}
      </li>
    `).join("");
  }

  async function loadRoleUsers() {
    const body = document.getElementById("role-users-body");

    const { data: members, error } = await client
      .from("profiles")
      .select("id,full_name,school_name,membership_status")
      .eq("membership_status", "verified")
      .order("full_name");

    if (error) {
      body.innerHTML = `<tr><td colspan="4">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    const { data: roleRows, error: roleError } = await client
      .from("user_roles")
      .select("user_id,role");

    if (roleError) {
      body.innerHTML = `<tr><td colspan="4">${escapeHtml(roleError.message)}</td></tr>`;
      return;
    }

    const rolesByUser = {};
    for (const row of roleRows || []) {
      rolesByUser[row.user_id] ??= [];
      rolesByUser[row.user_id].push(row.role);
    }

    body.innerHTML = (members || []).map((member) => {
      const current = rolesByUser[member.id] || ["member"];
      return `
        <tr>
          <td><strong>${escapeHtml(member.full_name || "Unnamed member")}</strong></td>
          <td>${escapeHtml(member.school_name || "—")}</td>
          <td>${current.map((role) => `<span class="role-pill">${escapeHtml(role.replaceAll("_"," "))}</span>`).join("")}</td>
          <td>
            <div class="action-row">
              <select data-role-select="${member.id}">
                <option value="">Select role…</option>
                <option value="trustee">Trustee</option>
                <option value="chapter_officer">Chapter Officer</option>
                <option value="neb_officer">NEB Officer</option>
                <option value="verifier">Verifier</option>
                <option value="admin">Administrator</option>
              </select>
              <button class="btn btn-light btn-sm" data-add-role="${member.id}">Add</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    body.querySelectorAll("[data-add-role]").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = button.dataset.addRole;
        const select = body.querySelector(`[data-role-select="${userId}"]`);
        const newRole = select.value;

        if (!newRole) return;

        if (newRole === "admin") {
          const ok = confirm("Administrator access can manage system roles and verification. Assign this role?");
          if (!ok) return;
        }

        button.disabled = true;

        const { error } = await client.rpc("assign_user_role", {
          target_user: userId,
          new_role: newRole,
          target_chapter: null,
        });

        if (error) {
          window.amsnShowMessage(message, error.message, "error");
          button.disabled = false;
          return;
        }

        window.amsnShowMessage(message, "Role assigned.", "success");
        await loadRoleUsers();
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

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
