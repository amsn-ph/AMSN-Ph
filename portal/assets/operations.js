
document.addEventListener("DOMContentLoaded", async () => {
  const { user, profile, roles } = await window.amsnSetupProtectedPage();

  if (!window.amsnRoleAllowsOfficerHub(roles)) {
    window.location.href = "dashboard.html";
    return;
  }

  const client = window.amsnRequireClient();
  const isNationalManager = roles.some((item) =>
    ["neb_officer", "admin"].includes(item.role)
  );

  const ownChapterId =
    roles.find((item) =>
      ["trustee", "chapter_officer"].includes(item.role) && item.chapter_id
    )?.chapter_id ||
    profile.chapter_id ||
    "";

  const globalMessage = document.getElementById("operations-message");

  let officers = [];
  let officerMap = new Map();
  let chapters = [];
  let schools = [];
  let projects = [];
  let tasks = [];
  let resources = [];
  let handovers = [];

  await loadReferenceData();
  setupForms();
  setupFilters();
  applyScopeDefaults();

  await Promise.all([
    loadProjects(),
    loadTasks(),
    loadResources(),
    loadHandovers()
  ]);

  renderCoverage();
  updateStats();

  async function loadReferenceData() {
    const [
      officerResult,
      chapterResult,
      schoolResult
    ] = await Promise.all([
      client.rpc("list_officers_for_operations"),
      client.from("chapters")
        .select("id,code,name,region,is_active")
        .eq("is_active", true)
        .order("code"),
      client.from("medical_schools")
        .select("id,name,short_name,city,province,region,chapter_id,is_active")
        .eq("is_active", true)
        .order("name")
    ]);

    if (officerResult.error) {
      window.amsnShowMessage(globalMessage, officerResult.error.message, "error");
      return;
    }

    officers = officerResult.data || [];
    chapters = chapterResult.data || [];
    schools = schoolResult.data || [];

    // One display record per officer. If one person has several roles,
    // preserve the most relevant labels in a set.
    const grouped = new Map();
    officers.forEach((row) => {
      if (!grouped.has(row.user_id)) {
        grouped.set(row.user_id, {
          ...row,
          roles: new Set()
        });
      }
      grouped.get(row.user_id).roles.add(row.role);
    });

    officerMap = new Map(
      [...grouped.values()].map((row) => [
        row.user_id,
        {
          ...row,
          roleLabel: [...row.roles].map(formatRole).join(", ")
        }
      ])
    );

    populateOfficerSelects();
    populateChapterSelects();
  }

  function populateOfficerSelects() {
    const selects = [
      document.getElementById("project-owner"),
      document.getElementById("task-assignee"),
      document.getElementById("handover-owner"),
      document.getElementById("handover-successor")
    ];

    const options = [...officerMap.values()]
      .sort((a,b) => displayName(a).localeCompare(displayName(b)))
      .map((officer) => {
        const detail = [officer.roleLabel, officer.school_name].filter(Boolean).join(" • ");
        return `<option value="${officer.user_id}">${escapeHtml(displayName(officer))}${detail ? " — " + escapeHtml(detail) : ""}</option>`;
      })
      .join("");

    selects.forEach((select) => {
      if (!select) return;
      const first = select.querySelector("option")?.outerHTML || '<option value="">Unassigned</option>';
      select.innerHTML = first + options;
    });
  }

  function populateChapterSelects() {
    const ids = [
      "project-chapter",
      "task-chapter",
      "resource-chapter",
      "handover-chapter"
    ];

    const options = chapters
      .map((chapter) =>
        `<option value="${chapter.id}">${escapeHtml(chapter.code)} — ${escapeHtml(chapter.name)}</option>`
      )
      .join("");

    ids.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      const first = select.querySelector("option")?.outerHTML || '<option value="">National / Network-wide</option>';
      select.innerHTML = first + options;
    });
  }

  function applyScopeDefaults() {
    if (isNationalManager) return;

    [
      "project-chapter",
      "task-chapter",
      "resource-chapter",
      "handover-chapter"
    ].forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;

      if (ownChapterId) {
        select.value = ownChapterId;
      }

      // Chapter-scoped officers should not accidentally create national records.
      const nationalOption = select.querySelector('option[value=""]');
      if (nationalOption) nationalOption.disabled = true;
    });
  }

  function setupForms() {
    document.getElementById("project-form")?.addEventListener("submit", createProject);
    document.getElementById("task-form")?.addEventListener("submit", createTask);
    document.getElementById("resource-form")?.addEventListener("submit", createResource);
    document.getElementById("handover-form")?.addEventListener("submit", createHandover);
  }

  function setupFilters() {
    document.getElementById("project-search")?.addEventListener("input", renderProjects);
    document.getElementById("project-status-filter")?.addEventListener("change", renderProjects);
    document.getElementById("resource-search")?.addEventListener("input", renderResources);
    document.getElementById("resource-type-filter")?.addEventListener("change", renderResources);
  }

  async function createProject(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("project-message");

    const payload = {
      title: form.title.value.trim(),
      description: form.description.value.trim() || null,
      phase: form.phase.value.trim() || null,
      status: form.status.value,
      priority: form.priority.value,
      start_date: form.start_date.value || null,
      due_date: form.due_date.value || null,
      owner_id: form.owner_id.value || null,
      chapter_id: form.chapter_id.value || null,
      created_by: user.id
    };

    const { error } = await client.from("projects").insert(payload);

    if (error) {
      window.amsnShowMessage(message, error.message, "error");
      return;
    }

    form.reset();
    applyScopeDefaults();
    window.amsnShowMessage(message, "Project added.", "success");
    await loadProjects();
    updateStats();
  }

  async function createTask(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("task-message");

    const payload = {
      title: form.title.value.trim(),
      description: form.description.value.trim() || null,
      status: "todo",
      priority: form.priority.value,
      due_at: form.due_at.value
        ? new Date(form.due_at.value).toISOString()
        : null,
      assignee_id: form.assignee_id.value || null,
      chapter_id: form.chapter_id.value || null,
      project_id: form.project_id.value || null,
      created_by: user.id
    };

    const { error } = await client.from("tasks").insert(payload);

    if (error) {
      window.amsnShowMessage(message, error.message, "error");
      return;
    }

    form.reset();
    applyScopeDefaults();
    window.amsnShowMessage(message, "Task added.", "success");
    await loadTasks();
    updateStats();
  }

  async function createResource(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("resource-message");

    const payload = {
      title: form.title.value.trim(),
      description: form.description.value.trim() || null,
      resource_url: form.resource_url.value.trim(),
      resource_type: form.resource_type.value,
      category: form.resource_type.value,
      audience: form.audience.value,
      chapter_id: form.chapter_id.value || null,
      document_date: form.document_date.value || null,
      term_label: form.term_label.value.trim() || null,
      created_by: user.id,
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from("resources").insert(payload);

    if (error) {
      window.amsnShowMessage(message, error.message, "error");
      return;
    }

    form.reset();
    applyScopeDefaults();
    window.amsnShowMessage(message, "Resource added to the archive.", "success");
    await loadResources();
    updateStats();
  }

  async function createHandover(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("handover-message");

    const payload = {
      title: form.title.value.trim(),
      area: form.area.value.trim(),
      summary: form.summary.value.trim(),
      current_state: form.current_state.value.trim() || null,
      next_steps: form.next_steps.value.trim() || null,
      resource_url: form.resource_url.value.trim() || null,
      term_label: form.term_label.value.trim() || null,
      status: form.status.value,
      owner_id: form.owner_id.value || null,
      successor_id: form.successor_id.value || null,
      chapter_id: form.chapter_id.value || null,
      created_by: user.id
    };

    const { error } = await client.from("handover_records").insert(payload);

    if (error) {
      window.amsnShowMessage(message, error.message, "error");
      return;
    }

    form.reset();
    applyScopeDefaults();
    window.amsnShowMessage(message, "Handover record saved.", "success");
    await loadHandovers();
  }

  async function loadProjects() {
    const { data, error } = await client
      .from("projects")
      .select("id,title,description,phase,status,priority,start_date,due_date,owner_id,chapter_id,created_by,created_at,updated_at,chapter:chapters(code,name)")
      .order("updated_at", { ascending: false });

    if (error) {
      document.getElementById("project-list").innerHTML =
        `<div class="ops-empty">${escapeHtml(error.message)}</div>`;
      return;
    }

    projects = data || [];
    populateProjectSelect();
    renderProjects();
  }

  function populateProjectSelect() {
    const select = document.getElementById("task-project");
    if (!select) return;

    select.innerHTML =
      '<option value="">No linked project</option>' +
      projects
        .filter((project) => !["completed","archived"].includes(project.status))
        .map((project) =>
          `<option value="${project.id}">${escapeHtml(project.title)}</option>`
        ).join("");
  }

  function renderProjects() {
    const container = document.getElementById("project-list");
    const search = document.getElementById("project-search")?.value.trim().toLowerCase() || "";
    const status = document.getElementById("project-status-filter")?.value || "";

    const list = projects.filter((project) => {
      if (status && project.status !== status) return false;

      const owner = officerMap.get(project.owner_id);
      const haystack = [
        project.title,
        project.description,
        project.phase,
        project.status,
        project.chapter?.code,
        project.chapter?.name,
        owner ? displayName(owner) : ""
      ].join(" ").toLowerCase();

      return !search || haystack.includes(search);
    });

    if (!list.length) {
      container.innerHTML = '<div class="ops-empty">No projects match this view.</div>';
      return;
    }

    container.innerHTML = list.map((project) => {
      const owner = officerMap.get(project.owner_id);
      const linkedTasks = tasks.filter((task) => task.project_id === project.id);
      const done = linkedTasks.filter((task) => task.status === "done").length;
      const progress = linkedTasks.length
        ? Math.round((done / linkedTasks.length) * 100)
        : 0;

      return `
        <article class="ops-item">
          <div class="ops-item-head">
            <div>
              <span class="card-label">${escapeHtml(project.chapter?.code || "NETWORK-WIDE")}</span>
              <h3>${escapeHtml(project.title)}</h3>
            </div>
            <span class="ops-badge ${escapeHtml(project.status)}">${escapeHtml(formatStatus(project.status))}</span>
          </div>

          <div class="ops-badges">
            ${project.phase ? `<span class="ops-badge">${escapeHtml(project.phase)}</span>` : ""}
            <span class="ops-badge ${escapeHtml(project.priority)}">${escapeHtml(project.priority)}</span>
            ${linkedTasks.length ? `<span class="ops-badge">${done}/${linkedTasks.length} tasks • ${progress}%</span>` : ""}
          </div>

          ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ""}
          <small>
            Owner: ${escapeHtml(owner ? displayName(owner) : "Unassigned")}
            ${project.due_date ? " • Target: " + escapeHtml(formatDate(project.due_date)) : ""}
          </small>

          <div class="action-row" style="margin-top:10px">
            <select class="btn btn-light btn-sm" data-project-status="${project.id}">
              ${projectStatusOptions(project.status)}
            </select>
          </div>
        </article>
      `;
    }).join("");

    container.querySelectorAll("[data-project-status]").forEach((select) => {
      select.addEventListener("change", async () => {
        const { error } = await client
          .from("projects")
          .update({
            status: select.value,
            updated_at: new Date().toISOString()
          })
          .eq("id", select.dataset.projectStatus);

        if (error) {
          window.amsnShowMessage(globalMessage, error.message, "error");
          return;
        }

        await loadProjects();
        updateStats();
      });
    });
  }

  async function loadTasks() {
    const { data, error } = await client
      .from("tasks")
      .select("id,title,description,status,priority,due_at,assignee_id,chapter_id,project_id,created_by,created_at,updated_at,completed_at,chapter:chapters(code,name)")
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error) {
      document.querySelectorAll("[data-task-column]").forEach((column) => {
        column.innerHTML = `<div class="ops-empty">${escapeHtml(error.message)}</div>`;
      });
      return;
    }

    tasks = data || [];
    renderTasks();
    renderProjects();
  }

  function renderTasks() {
    const statuses = ["todo","in_progress","blocked","done"];

    statuses.forEach((status) => {
      const column = document.querySelector(`[data-task-column="${status}"]`);
      const list = tasks.filter((task) => task.status === status);

      if (!list.length) {
        column.innerHTML = '<div class="ops-empty">No tasks.</div>';
        return;
      }

      column.innerHTML = list.map((task) => {
        const assignee = officerMap.get(task.assignee_id);
        const project = projects.find((project) => project.id === task.project_id);

        return `
          <article class="task-card">
            <strong>${escapeHtml(task.title)}</strong>
            ${project ? `<p>${escapeHtml(project.title)}</p>` : ""}
            <div class="ops-badges">
              <span class="ops-badge ${escapeHtml(task.priority)}">${escapeHtml(task.priority)}</span>
              ${task.chapter?.code ? `<span class="ops-badge">${escapeHtml(task.chapter.code)}</span>` : ""}
            </div>
            <p>${escapeHtml(assignee ? displayName(assignee) : "Unassigned")}</p>
            ${task.due_at ? `<p>Due: ${escapeHtml(formatDateTime(task.due_at))}</p>` : ""}
            <select data-task-status="${task.id}">
              ${taskStatusOptions(task.status)}
            </select>
          </article>
        `;
      }).join("");
    });

    document.querySelectorAll("[data-task-status]").forEach((select) => {
      select.addEventListener("change", async () => {
        const nextStatus = select.value;
        const payload = {
          status: nextStatus,
          completed_at: nextStatus === "done" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        };

        const { error } = await client
          .from("tasks")
          .update(payload)
          .eq("id", select.dataset.taskStatus);

        if (error) {
          window.amsnShowMessage(globalMessage, error.message, "error");
          return;
        }

        await loadTasks();
        updateStats();
      });
    });
  }

  async function loadResources() {
    const { data, error } = await client
      .from("resources")
      .select("id,title,description,resource_url,resource_type,category,audience,chapter_id,document_date,term_label,created_by,created_at,updated_at,chapter:chapters(code,name)")
      .order("document_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      document.getElementById("resource-list").innerHTML =
        `<div class="ops-empty">${escapeHtml(error.message)}</div>`;
      return;
    }

    resources = data || [];
    renderResources();
  }

  function renderResources() {
    const container = document.getElementById("resource-list");
    const search = document.getElementById("resource-search")?.value.trim().toLowerCase() || "";
    const type = document.getElementById("resource-type-filter")?.value || "";

    const list = resources.filter((item) => {
      if (type && item.resource_type !== type) return false;

      const haystack = [
        item.title,
        item.description,
        item.resource_type,
        item.term_label,
        item.chapter?.code,
        item.chapter?.name
      ].join(" ").toLowerCase();

      return !search || haystack.includes(search);
    });

    if (!list.length) {
      container.innerHTML = '<div class="ops-empty">No resources match this view.</div>';
      return;
    }

    container.innerHTML = list.map((item) => `
      <article class="ops-item">
        <div class="ops-item-head">
          <div>
            <span class="card-label">${escapeHtml((item.resource_type || "link").replaceAll("_"," ").toUpperCase())}</span>
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          <span class="ops-badge">${escapeHtml(item.audience)}</span>
        </div>
        <div class="ops-badges">
          ${item.chapter?.code ? `<span class="ops-badge">${escapeHtml(item.chapter.code)}</span>` : `<span class="ops-badge">Network-wide</span>`}
          ${item.term_label ? `<span class="ops-badge">${escapeHtml(item.term_label)}</span>` : ""}
          ${item.document_date ? `<span class="ops-badge">${escapeHtml(formatDate(item.document_date))}</span>` : ""}
        </div>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        <a class="btn btn-light btn-sm resource-link" href="${escapeHtml(item.resource_url)}" target="_blank" rel="noopener">Open File / Link ↗</a>
      </article>
    `).join("");
  }

  async function loadHandovers() {
    const { data, error } = await client
      .from("handover_records")
      .select("id,title,area,summary,current_state,next_steps,resource_url,term_label,status,owner_id,successor_id,chapter_id,created_by,created_at,updated_at,chapter:chapters(code,name)")
      .order("updated_at", { ascending: false });

    if (error) {
      document.getElementById("handover-list").innerHTML =
        `<div class="ops-empty">${escapeHtml(error.message)}</div>`;
      return;
    }

    handovers = data || [];
    renderHandovers();
  }

  function renderHandovers() {
    const container = document.getElementById("handover-list");

    if (!handovers.length) {
      container.innerHTML = '<div class="ops-empty">No turnover/handover records yet.</div>';
      return;
    }

    container.innerHTML = handovers.map((item) => {
      const owner = officerMap.get(item.owner_id);
      const successor = officerMap.get(item.successor_id);

      return `
        <article class="ops-item">
          <div class="ops-item-head">
            <div>
              <span class="card-label">${escapeHtml(item.area)}</span>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <span class="ops-badge ${escapeHtml(item.status)}">${escapeHtml(formatStatus(item.status))}</span>
          </div>

          <div class="ops-badges">
            ${item.chapter?.code ? `<span class="ops-badge">${escapeHtml(item.chapter.code)}</span>` : `<span class="ops-badge">Network-wide</span>`}
            ${item.term_label ? `<span class="ops-badge">${escapeHtml(item.term_label)}</span>` : ""}
          </div>

          <p>${escapeHtml(item.summary)}</p>

          ${item.current_state ? `
            <div class="handover-next">
              <strong>Current state</strong>
              <p>${escapeHtml(item.current_state)}</p>
            </div>` : ""}

          ${item.next_steps ? `
            <div class="handover-next">
              <strong>Next steps</strong>
              <p>${escapeHtml(item.next_steps)}</p>
            </div>` : ""}

          <p>
            <strong>Owner:</strong> ${escapeHtml(owner ? displayName(owner) : "Unassigned")}
            ${successor ? ` • <strong>Successor:</strong> ${escapeHtml(displayName(successor))}` : ""}
          </p>

          <div class="action-row">
            ${item.resource_url ? `<a class="btn btn-light btn-sm" href="${escapeHtml(item.resource_url)}" target="_blank" rel="noopener">Reference File ↗</a>` : ""}
            <select class="btn btn-light btn-sm" data-handover-status="${item.id}">
              ${handoverStatusOptions(item.status)}
            </select>
          </div>
        </article>
      `;
    }).join("");

    container.querySelectorAll("[data-handover-status]").forEach((select) => {
      select.addEventListener("change", async () => {
        const { error } = await client
          .from("handover_records")
          .update({
            status: select.value,
            updated_at: new Date().toISOString()
          })
          .eq("id", select.dataset.handoverStatus);

        if (error) {
          window.amsnShowMessage(globalMessage, error.message, "error");
          return;
        }

        await loadHandovers();
      });
    });
  }

  function renderCoverage() {
    renderSchoolCoverage();
    renderChapterCoverage();
  }

  function renderSchoolCoverage() {
    const container = document.getElementById("school-coverage");

    if (!schools.length) {
      container.innerHTML = '<div class="ops-empty">No registered medical schools.</div>';
      return;
    }

    container.innerHTML = schools.map((school) => {
      const assigned = [...officerMap.values()].filter(
        (officer) => officer.medical_school_id === school.id
      );

      return `
        <article class="coverage-row">
          <span class="ops-badge ${assigned.length ? "covered" : "uncovered"}">${assigned.length ? "Covered" : "No officer assigned"}</span>
          <h3>${escapeHtml(school.short_name || school.name)}</h3>
          <p>${escapeHtml([school.city,school.province,school.region].filter(Boolean).join(" • "))}</p>
          <p>${assigned.length
            ? assigned.map((officer) => `${escapeHtml(displayName(officer))} <small>(${escapeHtml(officer.roleLabel)})</small>`).join("<br>")
            : "No verified trustee/chapter/NEB officer profile from this school yet."}</p>
        </article>
      `;
    }).join("");
  }

  function renderChapterCoverage() {
    const container = document.getElementById("chapter-coverage");

    if (!chapters.length) {
      container.innerHTML = '<div class="ops-empty">No active affiliations.</div>';
      return;
    }

    container.innerHTML = chapters.map((chapter) => {
      const assigned = [...officerMap.values()].filter(
        (officer) => officer.chapter_id === chapter.id
      );

      return `
        <article class="coverage-row">
          <span class="ops-badge ${assigned.length ? "covered" : "uncovered"}">${assigned.length ? "Officer contact present" : "Needs coverage"}</span>
          <h3>${escapeHtml(chapter.code)} — ${escapeHtml(chapter.name)}</h3>
          <p>${escapeHtml(chapter.region || "")}</p>
          <p>${assigned.length
            ? assigned.map((officer) => `${escapeHtml(displayName(officer))} <small>(${escapeHtml(officer.roleLabel)})</small>`).join("<br>")
            : "No verified officer currently linked to this affiliation."}</p>
        </article>
      `;
    }).join("");
  }

  function updateStats() {
    const activeProjects = projects.filter((p) =>
      ["planned","active","on_hold"].includes(p.status)
    ).length;

    const openTasks = tasks.filter((t) => t.status !== "done").length;
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length;

    const coveredSchools = schools.filter((school) =>
      [...officerMap.values()].some((officer) => officer.medical_school_id === school.id)
    ).length;

    document.getElementById("stat-projects").textContent = activeProjects;
    document.getElementById("stat-tasks").textContent = openTasks;
    document.getElementById("stat-blocked").textContent = blockedTasks;
    document.getElementById("stat-resources").textContent = resources.length;
    document.getElementById("stat-coverage").textContent =
      schools.length ? `${coveredSchools}/${schools.length}` : "0";
  }
});

function displayName(officer) {
  return officer?.preferred_name || officer?.full_name || "Officer";
}

function formatRole(role) {
  return String(role || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", {
    year:"numeric",
    month:"short",
    day:"numeric"
  }).format(new Date(value + (String(value).length === 10 ? "T00:00:00" : "")));
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", {
    year:"numeric",
    month:"short",
    day:"numeric",
    hour:"numeric",
    minute:"2-digit"
  }).format(new Date(value));
}

function taskStatusOptions(current) {
  return [
    ["todo","To Do"],
    ["in_progress","In Progress"],
    ["blocked","Blocked"],
    ["done","Done"]
  ].map(([value,label]) =>
    `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`
  ).join("");
}

function projectStatusOptions(current) {
  return [
    ["planned","Planned"],
    ["active","Active"],
    ["on_hold","On Hold"],
    ["completed","Completed"],
    ["archived","Archived"]
  ].map(([value,label]) =>
    `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`
  ).join("");
}

function handoverStatusOptions(current) {
  return [
    ["active","Active Work"],
    ["ready_for_handover","Ready for Handover"],
    ["handed_over","Handed Over"],
    ["archived","Archived"]
  ].map(([value,label]) =>
    `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`
  ).join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
