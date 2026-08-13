
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
    document.getElementById("school-registry-section")?.classList.add("visible");
    document.getElementById("chapter-registry-section")?.classList.add("visible");
  }

  await Promise.all([
    loadCounts(),
    loadPending(),
    loadAudit(),
    isAdmin ? loadRoleUsers() : Promise.resolve(),
    isAdmin ? loadChapterRegistry() : Promise.resolve(),
    isAdmin ? loadSchoolRegistry() : Promise.resolve(),
  ]);

  if (isAdmin) setupRegistryForms();

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

  function setupRegistryForms() {
    const schoolForm = document.getElementById("school-registry-form");
    const chapterForm = document.getElementById("chapter-registry-form");

    schoolForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const msg = document.getElementById("school-registry-message");
      const payload = {
        name: schoolForm.elements["name"].value.trim(),
        short_name: schoolForm.elements["short_name"].value.trim() || null,
        region: schoolForm.elements["region"].value || null,
        city: schoolForm.elements["city"].value.trim() || null,
        province: schoolForm.elements["province"].value.trim() || null,
        chapter_id: schoolForm.elements["chapter_id"].value || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client.from("medical_schools").insert(payload);
      if (error) { window.amsnShowMessage(msg, error.message, "error"); return; }
      schoolForm.reset(); window.amsnShowMessage(msg, "Medical school added.", "success"); await loadSchoolRegistry();
    });

    chapterForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const msg = document.getElementById("chapter-registry-message");
      const payload = { code: chapterForm.elements["code"].value.trim().toUpperCase(), name: chapterForm.elements["name"].value.trim(), region: chapterForm.elements["region"].value || null, city: chapterForm.elements["city"].value.trim() || null, is_active: true };
      const { error } = await client.from("chapters").insert(payload);
      if (error) { window.amsnShowMessage(msg, error.message, "error"); return; }
      chapterForm.reset(); window.amsnShowMessage(msg, "Affiliation added.", "success"); await Promise.all([loadChapterRegistry(), loadSchoolRegistry()]);
    });
  }

  async function loadChapterRegistry() {
    const list = document.getElementById("chapter-registry-list");
    const schoolChapter = document.getElementById("school-default-chapter");
    const { data, error } = await client.from("chapters").select("id,code,name,region,city,is_active").order("code");
    if (error) { if(list) list.innerHTML=`<li><small>${escapeHtml(error.message)}</small></li>`; return; }
    const active=(data||[]).filter(x=>x.is_active);
    if(schoolChapter) schoolChapter.innerHTML='<option value="">No default affiliation</option>'+active.map(x=>`<option value="${x.id}">${escapeHtml(x.code)} — ${escapeHtml(x.name)}</option>`).join("");
    if(list) list.innerHTML=active.length?active.map(x=>`<li><strong>${escapeHtml(x.code)} — ${escapeHtml(x.name)}</strong><small>${escapeHtml([x.region,x.city].filter(Boolean).join(" • ")||"No location specified")}</small></li>`).join(""):'<li><small>No active affiliations.</small></li>';
  }

  async function loadSchoolRegistry() {
    const list=document.getElementById("school-registry-list");
    const { data, error } = await client.from("medical_schools").select("id,name,short_name,city,province,region,is_active,chapter:chapters(code)").order("name");
    if(error){if(list)list.innerHTML=`<li><small>${escapeHtml(error.message)}</small></li>`;return;}
    const active=(data||[]).filter(x=>x.is_active);
    if(list){list.innerHTML=active.length?active.map(x=>`<li><strong>${escapeHtml(x.short_name||x.name)}</strong><small>${escapeHtml([x.city,x.province,x.region].filter(Boolean).join(" • "))}${x.chapter?.code?" • "+escapeHtml(x.chapter.code):""}</small><div class="action-row" style="margin-top:8px"><button class="btn btn-light btn-sm" data-deactivate-school="${x.id}">Deactivate</button></div></li>`).join(""):'<li><small>No active medical schools.</small></li>';
      list.querySelectorAll("[data-deactivate-school]").forEach(button=>button.addEventListener("click",async()=>{if(!confirm("Remove this school from the active signup/profile dropdown? Existing member records will be preserved."))return;const {error}=await client.from("medical_schools").update({is_active:false,updated_at:new Date().toISOString()}).eq("id",button.dataset.deactivateSchool);if(error){window.amsnShowMessage(message,error.message,"error");return;}await loadSchoolRegistry();}));
    }
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
