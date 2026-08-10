const leaders = [
  {
    role: "President",
    name: "Name of President",
    school: "Medical School / Chapter"
  },
  {
    role: "Executive Vice President",
    name: "Name of EVP",
    school: "Medical School / Chapter"
  },
  {
    role: "Secretary",
    name: "Name of Secretary",
    school: "Medical School / Chapter"
  },
  {
    role: "Treasurer",
    name: "Name of Treasurer",
    school: "Medical School / Chapter"
  },
  {
    role: "National Public Relations Officer",
    name: "Glister Diadem A. Dollera",
    school: "Medical School / Chapter"
  },
  {
    role: "Publications / Media",
    name: "Name of Officer",
    school: "Medical School / Chapter"
  }
];

const leadersList = document.getElementById("leaders-list");

if (leadersList) {
  leadersList.innerHTML = leaders.map((leader) => `
    <article class="leader-row">
      <span class="leader-role">${leader.role}</span>
      <p class="leader-name">${leader.name}</p>
      <p class="leader-school">${leader.school}</p>
    </article>
  `).join("");
}

const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const open = siteNav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = open ? "Close" : "Menu";
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "Menu";
    });
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
