
(function () {
  const cfg = {
    url: window.AMSN_SUPABASE_URL || "",
    key: window.AMSN_SUPABASE_PUBLISHABLE_KEY || ""
  };
  if (!cfg.url || !cfg.key) return;

  const base = cfg.url.replace(/\/$/, "") + "/rest/v1/public_posts";
  const headers = { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-public-post-feed]").forEach(loadFeed);
    const single = document.querySelector("[data-single-public-post]");
    if (single) loadSinglePost(single);
  });

  async function loadFeed(container) {
    const mode = container.dataset.publicPostFeed || "stories";
    const params = new URLSearchParams({
      select: "id,title,category,region,excerpt,cover_image_url,featured,author_display_name,published_at",
      status: "eq.published",
      order: "featured.desc,published_at.desc",
      limit: mode === "home" ? "3" : "12"
    });

    try {
      const res = await fetch(`${base}?${params}`, { headers });
      if (!res.ok) throw new Error("Could not load publications.");
      const posts = await res.json();

      container.innerHTML = posts.length
        ? posts.map(renderCard).join("")
        : '<div class="public-post-empty">No published posts yet. Check back soon.</div>';
    } catch (error) {
      console.error(error);
      container.innerHTML = '<div class="public-post-empty">Publications are temporarily unavailable.</div>';
    }
  }

  async function loadSinglePost(container) {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return renderMissing(container);

    const params = new URLSearchParams({
      select: "id,title,category,region,excerpt,body,cover_image_url,featured,author_display_name,published_at",
      id: `eq.${id}`,
      status: "eq.published",
      limit: "1"
    });

    try {
      const res = await fetch(`${base}?${params}`, { headers });
      if (!res.ok) throw new Error("Could not load post.");
      const rows = await res.json();
      if (!rows[0]) return renderMissing(container);

      document.title = `${rows[0].title} | AMSN-PH`;
      container.innerHTML = renderSingle(rows[0]);
    } catch (error) {
      console.error(error);
      renderMissing(container);
    }
  }

  function renderCard(post) {
    const cover = post.cover_image_url
      ? `<img class="public-post-cover" src="${escapeHtml(post.cover_image_url)}" alt="" loading="lazy">`
      : `<div class="public-post-placeholder">AMSN-PH • ${escapeHtml(categoryLabel(post.category))}</div>`;

    return `
      <article class="public-post-card">
        ${cover}
        <div class="public-post-copy">
          <div class="public-post-meta">
            <span>${escapeHtml(categoryLabel(post.category))}</span>
            <span>${escapeHtml(post.region || "National")}</span>
            ${post.featured ? "<span>Featured</span>" : ""}
          </div>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          <small>${escapeHtml(formatDate(post.published_at))}${post.author_display_name ? " • " + escapeHtml(post.author_display_name) : ""}</small>
          <a class="text-link" href="story.html?id=${encodeURIComponent(post.id)}">Read post <span>→</span></a>
        </div>
      </article>`;
  }

  function renderSingle(post) {
    const cover = post.cover_image_url
      ? `<img class="single-post-cover" src="${escapeHtml(post.cover_image_url)}" alt="">`
      : "";

    const paragraphs = String(post.body || "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("");

    return `
      <div class="single-post-wrap">
        <article class="single-post-article">
          <p class="kicker">${escapeHtml(categoryLabel(post.category))} • ${escapeHtml(post.region || "National")}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="hero-lead">${escapeHtml(post.excerpt)}</p>
          <div class="single-post-byline">
            <span>${escapeHtml(formatDate(post.published_at))}</span>
            ${post.author_display_name ? `<span>By ${escapeHtml(post.author_display_name)}</span>` : ""}
            ${post.featured ? "<span>Featured by AMSN-PH</span>" : ""}
          </div>
          ${cover}
          <div class="single-post-body">${paragraphs}</div>
        </article>
        <aside class="single-post-aside">
          <div class="single-post-aside-card">
            <p class="eyebrow">AMSN-PH PUBLICATIONS</p>
            <h3>Faith, medicine, service, and stories from the network.</h3>
            <a class="text-link" href="stories.html">Browse all stories <span>→</span></a>
          </div>
        </aside>
      </div>`;
  }

  function renderMissing(container) {
    container.innerHTML = '<div class="public-post-empty">This post is unavailable, unpublished, or the link is incorrect.<div style="margin-top:14px"><a class="text-link" href="stories.html">Back to Stories →</a></div></div>';
  }

  function categoryLabel(v) {
    return ({story:"AMSN Story",devotional:"Devotional",announcement:"Announcement",event:"Event",update:"News / Update"})[v] || "AMSN-PH";
  }

  function formatDate(v) {
    if (!v) return "";
    return new Intl.DateTimeFormat("en-PH",{year:"numeric",month:"long",day:"numeric"}).format(new Date(v));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();
