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
  // Add the remaining current National Executive Board members here.
];

const leadershipTable = document.getElementById("leadership-table");

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
