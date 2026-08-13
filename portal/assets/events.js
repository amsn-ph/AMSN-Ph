
document.addEventListener("DOMContentLoaded", async () => {
  const { user, profile } = await window.amsnSetupProtectedPage();
  const client = window.amsnRequireClient();
  const grid = document.getElementById("events-grid");
  const search = document.getElementById("event-search");
  const filter = document.getElementById("event-filter");
  const message = document.getElementById("event-message");

  if (profile.membership_status !== "verified") {
    grid.innerHTML = '<div class="empty-state">Events become available after your AMSN membership is verified.</div>';
    search.disabled = true;
    filter.disabled = true;
    return;
  }

  let events = [];
  let registrations = new Map();

  await refresh();

  search.addEventListener("input", render);
  filter.addEventListener("change", render);

  async function refresh() {
    const [{ data: eventData, error: eventError }, { data: registrationData }] =
      await Promise.all([
        client
          .from("events")
          .select("id,title,description,starts_at,ends_at,location,is_online,meeting_link,registration_required,registration_deadline,capacity,status,chapter_id,chapter:chapters(code,name)")
          .order("starts_at", { ascending: true }),
        client
          .from("event_registrations")
          .select("id,event_id,status,registered_at")
          .eq("user_id", user.id)
      ]);

    if (eventError) {
      grid.innerHTML = `<div class="empty-state">${escapeHtml(eventError.message)}</div>`;
      return;
    }

    events = eventData || [];
    registrations = new Map((registrationData || []).map((item) => [item.event_id, item]));
    render();
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const mode = filter.value;
    const now = Date.now();

    let visible = events.filter((event) => {
      const haystack = [
        event.title,
        event.description,
        event.location,
        event.chapter?.code,
        event.chapter?.name
      ].join(" ").toLowerCase();

      if (q && !haystack.includes(q)) return false;

      const isUpcoming = new Date(event.starts_at).getTime() >= now;
      const reg = registrations.get(event.id);

      if (mode === "upcoming" && !isUpcoming) return false;
      if (mode === "registered" && (!reg || reg.status === "cancelled")) return false;

      return true;
    });

    if (!visible.length) {
      grid.innerHTML = '<div class="empty-state">No events match this view.</div>';
      return;
    }

    grid.innerHTML = visible.map((event) => {
      const reg = registrations.get(event.id);
      const deadlinePassed = event.registration_deadline &&
        new Date(event.registration_deadline).getTime() < Date.now();

      const canRegister = event.registration_required &&
        !deadlinePassed &&
        (!reg || reg.status === "cancelled");

      const isGoing = reg && reg.status === "going";

      return `
        <article class="engagement-card">
          <span class="card-label">${escapeHtml(event.chapter?.code || "AMSN-PH EVENT")}</span>
          <h3>${escapeHtml(event.title)}</h3>
          <div class="meta-row">
            <span>${escapeHtml(formatDateTime(event.starts_at))}</span>
            <span>${escapeHtml(event.is_online ? "Online" : (event.location || "Venue TBA"))}</span>
            ${event.capacity ? `<span>Capacity: ${event.capacity}</span>` : ""}
          </div>
          <p>${escapeHtml(event.description || "")}</p>
          ${event.registration_deadline ? `<p class="opportunity-deadline">RSVP deadline: ${escapeHtml(formatDateTime(event.registration_deadline))}</p>` : ""}
          <div class="action-row">
            ${isGoing
              ? `<span class="event-status going">RSVP confirmed</span>
                 <button class="btn btn-light btn-sm" data-cancel-rsvp="${event.id}">Cancel RSVP</button>`
              : canRegister
                ? `<button class="btn btn-blue btn-sm" data-rsvp="${event.id}">RSVP / Join</button>`
                : event.registration_required
                  ? `<span class="event-status">${deadlinePassed ? "RSVP closed" : "Registration unavailable"}</span>`
                  : `<span class="event-status">No RSVP required</span>`}
          </div>
        </article>
      `;
    }).join("");

    grid.querySelectorAll("[data-rsvp]").forEach((button) => {
      button.addEventListener("click", () => register(button.dataset.rsvp));
    });

    grid.querySelectorAll("[data-cancel-rsvp]").forEach((button) => {
      button.addEventListener("click", () => cancel(button.dataset.cancelRsvp));
    });
  }

  async function register(eventId) {
    const existing = registrations.get(eventId);
    let result;

    if (existing) {
      result = await client
        .from("event_registrations")
        .update({ status: "going", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      result = await client
        .from("event_registrations")
        .insert({ event_id: eventId, user_id: user.id, status: "going" });
    }

    if (result.error) {
      window.amsnShowMessage(message, result.error.message, "error");
      return;
    }

    window.amsnShowMessage(message, "Your RSVP is confirmed.", "success");
    await refresh();
  }

  async function cancel(eventId) {
    const existing = registrations.get(eventId);
    if (!existing) return;

    const { error } = await client
      .from("event_registrations")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      window.amsnShowMessage(message, error.message, "error");
      return;
    }

    window.amsnShowMessage(message, "Your RSVP was cancelled.", "success");
    await refresh();
  }
});

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit"
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
