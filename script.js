const leaders = [
  { role: "President", name: "Name of President", school: "Medical School / Chapter" },
  { role: "Executive Vice President", name: "Name of Executive Vice President", school: "Medical School / Chapter" },
  { role: "Secretary", name: "Name of Secretary", school: "Medical School / Chapter" },
  { role: "Treasurer", name: "Name of Treasurer", school: "Medical School / Chapter" },
  { role: "National Public Relations Officer", name: "Glister Diadem A. Dollera", school: "Medical School / Chapter" },
  { role: "Publications / Media", name: "Name of Officer", school: "Medical School / Chapter" }
];

const leaderList = document.getElementById("leader-list");
if (leaderList) {
  leaderList.innerHTML = leaders.map((leader) => `
    <article class="leader-row">
      <span class="leader-role">${leader.role}</span>
      <p class="leader-name">${leader.name}</p>
      <p class="leader-school">${leader.school}</p>
    </article>
  `).join("");
}

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "Close" : "Menu";
  });

  mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "Menu";
  }));
}

document.querySelectorAll("#year").forEach(el => el.textContent = new Date().getFullYear());

const categoryButtons = document.querySelectorAll(".category");
const articleCards = document.querySelectorAll(".article-card[data-category]");

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;
    articleCards.forEach(card => {
      const category = card.dataset.category;
      card.classList.toggle("hidden", filter !== "all" && category !== filter && category !== "all");
    });
  });
});
