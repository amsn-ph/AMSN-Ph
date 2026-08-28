// AMSN-PH V2.6 visual polish loader.
// This does not modify authentication or backend behavior.
(function loadPublicPolish() {
  if (document.querySelector('link[data-amsn-polish="public-v2.6"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "polish-v2.6.css";
  link.dataset.amsnPolish = "public-v2.6";
  document.head.appendChild(link);
})();

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const open = primaryNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "Close" : "Menu";
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "Menu";
    });
  });
}

document.querySelectorAll("#year").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Keep the homepage editorial section numbers sequential.
// The map is intentionally unnumbered.
if (document.body && /(?:^|\/)index\.html$|\/$/.test(window.location.pathname)) {
  document.querySelectorAll(".section-index").forEach((sectionIndex, index) => {
    const number = sectionIndex.querySelector("span");
    if (number) number.textContent = String(index + 1).padStart(2, "0");
  });
}

// Image-loading hints: keep above-the-fold identity imagery eager;
// defer non-critical imagery where possible.
document.querySelectorAll("img").forEach((image) => {
  image.decoding = "async";

  const isPriority =
    image.classList.contains("brand-logo") ||
    image.classList.contains("auth-logo") ||
    image.closest(".hero-image-frame");

  if (isPriority) {
    image.loading = "eager";
    if (image.closest(".hero-image-frame")) {
      image.fetchPriority = "high";
    }
  } else if (!image.hasAttribute("loading")) {
    image.loading = "lazy";
  }
});

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

// 8th NEB event gallery
const gallerySlides = Array.from(document.querySelectorAll(".gallery-slide"));
const galleryThumbs = Array.from(document.querySelectorAll(".gallery-thumb"));
const galleryPrev = document.getElementById("prev-slide");
const galleryNext = document.getElementById("next-slide");
let galleryIndex = 0;

function showGallerySlide(index) {
  if (!gallerySlides.length) return;

  galleryIndex = (index + gallerySlides.length) % gallerySlides.length;

  gallerySlides.forEach((slide, i) => {
    slide.classList.toggle("active", i === galleryIndex);
  });

  galleryThumbs.forEach((thumb, i) => {
    thumb.classList.toggle("active", i === galleryIndex);
  });

  if (window.innerWidth <= 720 && galleryThumbs[galleryIndex]) {
    galleryThumbs[galleryIndex].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }
}

galleryThumbs.forEach((thumb) => {
  thumb.addEventListener("click", () => {
    showGallerySlide(Number(thumb.dataset.go));
  });
});

galleryPrev?.addEventListener("click", () => showGallerySlide(galleryIndex - 1));
galleryNext?.addEventListener("click", () => showGallerySlide(galleryIndex + 1));
