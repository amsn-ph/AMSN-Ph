const leadership = [
  {
    role: "National President",
    name: "Gherneil Dalanon",
    meta: "AMSN-PH 8th NEB"
  },
  {
    role: "National Secretary",
    name: "Cyd Paulin Rosal",
    meta: "AMSN-PH 8th NEB"
  },
  {
    role: "National Public Relations Officer",
    name: "Glister Diadem A. Dollera",
    meta: "AMSN-PH 8th NEB"
  },
  {
    role: "Adviser",
    name: "Dr. Elvin Tecson",
    meta: "AMSN-PH"
  }
];



if (leadershipTable) {
  leadershipTable.innerHTML = leadership.map(member => `
    <article class="leader-row">
      <span class="leader-role">${member.role}</span>
      <p class="leader-name">${member.name}</p>
      <p class="leader-meta">${member.meta}</p>
    </article>
  `).join("");
}

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const open = primaryNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "Close" : "Menu";
  });

  primaryNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "Menu";
    });
  });
}

document.querySelectorAll("#year").forEach(node => {
  node.textContent = new Date().getFullYear();
});

const filters = document.querySelectorAll(".filter");
const articles = document.querySelectorAll(".article-card[data-category]");

filters.forEach(button => {
  button.addEventListener("click", () => {
    filters.forEach(filter => filter.classList.remove("active"));
    button.classList.add("active");

    const selected = button.dataset.filter;

    articles.forEach(article => {
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
