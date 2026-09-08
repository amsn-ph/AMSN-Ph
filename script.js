// AMSN-PH public UI/UX — Aug 29 design preserved + multi-page navigation patch.
(function ensurePublicPolish() {
  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .some((link) => (link.getAttribute("href") || "").includes("polish-v2.6.css"));

  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "polish-v2.6.css?v=2.6.1";
    link.dataset.amsnPolish = "public-v2.6.1";
    document.head.appendChild(link);
  }
})();

// Canonical public navigation. Same August visual classes, separate actual pages.
(function normalizePublicNavigation() {
  const nav = document.querySelector(".primary-nav");
  if (!nav) return;

  const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const items = [
    ["about.html", "About"],
    ["membership.html", "Membership"],
    ["programs.html", "Programs"],
    ["network.html", "Network"],
    ["highlights.html", "Highlights"],
    ["stories.html", "Stories"],
    ["contact.html", "Contact"]
  ];

  nav.innerHTML = [
    ...items.map(([href, label]) => {
      const active = current === href ? ' aria-current="page"' : "";
      return `<a href="${href}"${active}>${label}</a>`;
    }),
    '<a href="portal/" class="portal-nav-link">Member Portal</a>',
    '<a href="portal/?action=join" class="nav-action">Join AMSN-PH</a>'
  ].join("");

  const replacements = new Map([
    ["#about", "about.html"],
    ["index.html#about", "about.html"],
    ["#membership", "membership.html"],
    ["index.html#membership", "membership.html"],
    ["#programs", "programs.html"],
    ["index.html#programs", "programs.html"],
    ["#highlights", "highlights.html"],
    ["index.html#highlights", "highlights.html"],
    ["#contact", "contact.html"],
    ["index.html#contact", "contact.html"],
    ["#join", "portal/?action=join"],
    ["index.html#join", "portal/?action=join"],
    ["index.html#leadership", "about.html"]
  ]);

  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (replacements.has(href)) link.setAttribute("href", replacements.get(href));
  });

  // Existing Aug 29 Stories page gets a Submit Your Story CTA without changing its design.
  if (current === "stories.html" && !document.querySelector(".story-submit-cta")) {
    const hero = document.querySelector(".stories-hero .container");
    if (hero) {
      const row = document.createElement("div");
      row.className = "hero-actions story-submit-cta";
      row.innerHTML =
        '<a href="submit-story.html" class="btn btn-blue">Submit Your Story</a>' +
        '<a href="contact.html" class="text-link">Contact AMSN-PH <span>→</span></a>';
      hero.appendChild(row);
    }
  }
})();

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

function closePublicMenu() {
  if (!menuToggle || !primaryNav) return;
  primaryNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "Menu";
}

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const open = primaryNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "Close" : "Menu";
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closePublicMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePublicMenu();
      menuToggle?.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 800 || !primaryNav.classList.contains("open")) return;
    if (primaryNav.contains(event.target) || menuToggle.contains(event.target)) return;
    closePublicMenu();
  });
}

document.querySelectorAll("#year").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Progressive image-loading hints.
document.querySelectorAll("img").forEach((image) => {
  image.decoding = "async";
  const isPriority =
    image.classList.contains("brand-logo") ||
    image.classList.contains("auth-logo") ||
    image.closest(".hero-image-frame");

  if (isPriority) {
    image.loading = "eager";
    if (image.closest(".hero-image-frame")) image.fetchPriority = "high";
  } else if (!image.hasAttribute("loading")) {
    image.loading = "lazy";
  }
});

// Existing Stories page filtering.
const filters = document.querySelectorAll(".filter");
const articles = document.querySelectorAll(".article-card[data-category]");

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((filter) => filter.classList.remove("active"));
    button.classList.add("active");
    const selected = button.dataset.filter;

    articles.forEach((article) => {
      const category = article.dataset.category;
      const visible =
        selected === "all" ||
        category === selected ||
        category === "all";
      article.classList.toggle("hidden", !visible);
    });
  });
});

// Existing 8th NEB event gallery behavior.
const gallerySlides = Array.from(document.querySelectorAll(".gallery-slide"));
const galleryThumbs = Array.from(document.querySelectorAll(".gallery-thumb"));
const galleryPrev = document.getElementById("prev-slide");
const galleryNext = document.getElementById("next-slide");
let galleryIndex = 0;

function showGallerySlide(index) {
  if (!gallerySlides.length) return;
  galleryIndex = (index + gallerySlides.length) % gallerySlides.length;
  gallerySlides.forEach((slide, i) => slide.classList.toggle("active", i === galleryIndex));
  galleryThumbs.forEach((thumb, i) => thumb.classList.toggle("active", i === galleryIndex));

  if (window.innerWidth <= 720 && galleryThumbs[galleryIndex]) {
    galleryThumbs[galleryIndex].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }
}

galleryThumbs.forEach((thumb) => {
  thumb.addEventListener("click", () => showGallerySlide(Number(thumb.dataset.go)));
});

galleryPrev?.addEventListener("click", () => showGallerySlide(galleryIndex - 1));
galleryNext?.addEventListener("click", () => showGallerySlide(galleryIndex + 1));
