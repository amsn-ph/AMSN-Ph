
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("publication-form");
  if (!form) return;

  const { user, profile, roles } = await window.amsnSetupProtectedPage();
  if (!window.amsnRoleAllowsOfficerHub(roles)) return;

  const client = window.amsnRequireClient();
  const canPublish = (roles || []).some(({ role }) =>
    ["neb_officer", "admin"].includes(role)
  );

  const message = document.getElementById("publication-message");
  const note = document.getElementById("publication-permission-note");
  const myList = document.getElementById("my-publication-list");
  const reviewList = document.getElementById("publication-review-list");

  document.querySelectorAll(".publication-publisher-only").forEach((el) => {
    el.hidden = !canPublish;
  });

  if (note) {
    note.innerHTML = canPublish
      ? '<span class="status-badge verified">Publisher access</span><small>You can review, publish, feature, and archive public posts.</small>'
      : '<span class="status-badge pending">Contributor access</span><small>You can save drafts and submit posts for editorial review.</small>';
  }

  document.querySelectorAll("[data-publication-action]").forEach((button) => {
    button.addEventListener("click", () => savePost(button.dataset.publicationAction));
  });

  document.querySelector("[data-publication-reset]")?.addEventListener("click", () => resetForm(true));
  document.querySelector("[data-refresh-publications]")?.addEventListener("click", refreshLists);

  await refreshLists();

  async function savePost(requestedStatus) {
    if (!form.reportValidity()) return;
    if (requestedStatus === "published" && !canPublish) {
      window.amsnShowMessage(message, "You do not have publishing permission.", "error");
      return;
    }

    const buttons = form.querySelectorAll("button");
    buttons.forEach((b) => b.disabled = true);
    window.amsnClearMessage(message);

    try {
      let coverUrl = form.cover_image_url.value.trim() || null;
      const file = form.cover_file.files?.[0];

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Cover image must be 5 MB or smaller.");
        }

        const safeName = file.name.toLowerCase()
          .replace(/[^a-z0-9._-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const path = `${user.id}/${Date.now()}-${safeName || "cover.jpg"}`;

        const { error: uploadError } = await client.storage
          .from("public-post-images")
          .upload(path, file, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = client.storage
          .from("public-post-images")
          .getPublicUrl(path);

        coverUrl = publicUrlData?.publicUrl || coverUrl;
      }

      const payload = {
        title: form.title.value.trim(),
        category: form.category.value,
        region: form.region.value,
        excerpt: form.excerpt.value.trim(),
        body: form.body.value.trim(),
        cover_image_url: coverUrl,
        status: requestedStatus,
        featured: canPublish ? form.featured.checked : false,
        published_by: requestedStatus === "published" ? user.id : null,
        published_at: requestedStatus === "published" ? new Date().toISOString() : null
      };

      const id = form.post_id.value;

      let result;
      if (id) {
        result = await client
          .from("public_posts")
          .update(payload)
          .eq("id", id)
          .select("id")
          .single();
      } else {
        payload.author_id = user.id;
        payload.author_display_name =
          profile.preferred_name ||
          profile.full_name ||
          user.email?.split("@")[0] ||
          "AMSN-PH Officer";

        result = await client
          .from("public_posts")
          .insert(payload)
          .select("id")
          .single();
      }

      if (result.error) throw result.error;

      const successText = {
        draft: "Draft saved.",
        review: "Post submitted for editorial review.",
        published: "Post published to the public website."
      }[requestedStatus] || "Post saved.";

      resetForm(false);
      window.amsnShowMessage(message, successText, "success");
      await refreshLists();
    } catch (error) {
      console.error(error);
      window.amsnShowMessage(message, error.message || "Could not save the post.", "error");
    } finally {
      buttons.forEach((b) => b.disabled = false);
    }
  }

  async function refreshLists() {
    await loadMyPosts();
    if (canPublish) await loadReviewQueue();
  }

  async function loadMyPosts() {
    const { data, error } = await client
      .from("public_posts")
      .select("id,title,category,region,status,featured,published_at,updated_at,excerpt,body,cover_image_url")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(40);

    if (error) {
      myList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      return;
    }

    myList.innerHTML = renderList(data || [], false) ||
      '<div class="empty-state">No posts yet. Create your first public post above.</div>';
    wireListButtons(myList, data || []);
  }

  async function loadReviewQueue() {
    const { data, error } = await client
      .from("public_posts")
      .select("id,title,category,region,status,featured,published_at,updated_at,excerpt,body,cover_image_url,author_display_name")
      .in("status", ["review", "published"])
      .order("updated_at", { ascending: false })
      .limit(60);

    if (error) {
      reviewList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      return;
    }

    reviewList.innerHTML = renderList(data || [], true) ||
      '<div class="empty-state">No posts waiting for review.</div>';
    wireListButtons(reviewList, data || []);
  }

  function renderList(items, editorial) {
    return items.map((item) => `
      <article class="publication-list-item">
        <div class="publication-list-main">
          <div class="publication-meta-row">
            <span class="status-badge ${item.status === "published" ? "verified" : "pending"}">${escapeHtml(item.status)}</span>
            <span>${escapeHtml(categoryLabel(item.category))}</span>
            <span>${escapeHtml(item.region)}</span>
            ${item.featured ? "<span>★ Featured</span>" : ""}
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          ${editorial && item.author_display_name ? `<p class="publication-byline">By ${escapeHtml(item.author_display_name)}</p>` : ""}
          <p>${escapeHtml(item.excerpt)}</p>
          <small>Updated ${escapeHtml(formatDateTime(item.updated_at))}</small>
        </div>
        <div class="publication-list-actions">
          <button class="btn btn-outline btn-sm" type="button" data-edit-post="${item.id}">Edit</button>
          ${canPublish && item.status !== "published" ? `<button class="btn btn-blue btn-sm" type="button" data-publish-post="${item.id}">Publish</button>` : ""}
          ${canPublish && item.status === "published" ? `<button class="btn btn-outline btn-sm" type="button" data-archive-post="${item.id}">Archive</button>` : ""}
          ${item.status === "published" ? `<a class="btn btn-outline btn-sm" href="../story.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">View</a>` : ""}
        </div>
      </article>
    `).join("");
  }

  function wireListButtons(container, items) {
    const byId = new Map(items.map((item) => [String(item.id), item]));

    container.querySelectorAll("[data-edit-post]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = byId.get(button.dataset.editPost);
        if (!item) return;
        fillForm(item);
        document.getElementById("publication-manager")?.scrollIntoView({ behavior: "smooth" });
      });
    });

    container.querySelectorAll("[data-publish-post]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!canPublish) return;
        button.disabled = true;

        const { error } = await client
          .from("public_posts")
          .update({
            status: "published",
            published_by: user.id,
            published_at: new Date().toISOString()
          })
          .eq("id", button.dataset.publishPost);

        if (error) alert(error.message);
        await refreshLists();
      });
    });

    container.querySelectorAll("[data-archive-post]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!canPublish) return;
        if (!confirm("Archive this public post? It will disappear from the public website.")) return;

        button.disabled = true;
        const { error } = await client
          .from("public_posts")
          .update({ status: "archived" })
          .eq("id", button.dataset.archivePost);

        if (error) alert(error.message);
        await refreshLists();
      });
    });
  }

  function fillForm(item) {
    form.post_id.value = item.id;
    form.title.value = item.title || "";
    form.category.value = item.category || "story";
    form.region.value = item.region || "National";
    form.excerpt.value = item.excerpt || "";
    form.body.value = item.body || "";
    form.cover_image_url.value = item.cover_image_url || "";
    form.cover_file.value = "";
    if (form.featured) form.featured.checked = !!item.featured;
    window.amsnShowMessage(message, `Editing: ${item.title}`, "success");
  }

  function resetForm(clearMessage = true) {
    form.reset();
    form.post_id.value = "";
    if (clearMessage) window.amsnClearMessage(message);
  }

  function categoryLabel(value) {
    return {
      story: "AMSN Story",
      devotional: "Devotional",
      announcement: "Announcement",
      event: "Event",
      update: "News / Update"
    }[value] || value;
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

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
