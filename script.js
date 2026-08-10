// =======================================================
// AMSN-PH Website V1
// Phase 1: Public website
// Edit the data below as the current NEB/chapter information is finalized.
// =======================================================

const leaders = [
  {
    role: "President",
    name: "Name of President",
    school: "Medical School / Chapter",
    photo: ""
  },
  {
    role: "Executive Vice President",
    name: "Name of EVP",
    school: "Medical School / Chapter",
    photo: ""
  },
  {
    role: "Secretary",
    name: "Name of Secretary",
    school: "Medical School / Chapter",
    photo: ""
  },
  {
    role: "Treasurer",
    name: "Name of Treasurer",
    school: "Medical School / Chapter",
    photo: ""
  },
  {
    role: "National Public Relations Officer",
    name: "Glister Diadem A. Dollera",
    school: "Medical School / Chapter",
    photo: ""
  },
  {
    role: "Publications / Media",
    name: "Name of Officer",
    school: "Medical School / Chapter",
    photo: ""
  },
  {
    role: "Programs / Ministries",
    name: "Name of Officer",
    school: "Medical School / Chapter",
    photo: ""
  },
  {
    role: "Other NEB Position",
    name: "Name of Officer",
    school: "Medical School / Chapter",
    photo: ""
  }
];

const leadersGrid = document.getElementById("leaders-grid");

if (leadersGrid) {
  leadersGrid.innerHTML = leaders
    .map((leader) => {
      const photoMarkup = leader.photo
        ? `<img src="${leader.photo}" alt="${leader.name}" loading="lazy" />`
        : `<span>Add photo</span>`;

      return `
        <article class="leader-card reveal">
          <div class="leader-photo">${photoMarkup}</div>
          <div class="leader-body">
            <span class="leader-role">${leader.role}</span>
            <h3 class="leader-name">${leader.name}</h3>
            <p class="leader-school">${leader.school}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

// Mobile navigation
const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector(".primary-nav");

if (navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    });
  });
}

// Reveal animation
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));

  // Leaders are injected after the first NodeList is created.
  document
    .querySelectorAll(".leader-card.reveal")
    .forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
}

// Footer year
const yearNode = document.getElementById("year");
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}
