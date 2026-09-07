// AMSN-PH Membership Logic V2
const AMSN_MEMBERSHIP_MAP = {
  SDA: {
    YL1: "Regular Member",
    YL2: "Regular Member",
    YL3: "Regular Member",
    YL4: "Associate Member",
    YL5: "Associate Member",
    "Graduate/PLE Review": "Associate Member",
    "Licensed Physician": "Honorary Member"
  },
  "Non-SDA": {
    YL1: "Affiliate Member",
    YL2: "Affiliate Member",
    YL3: "Affiliate Member",
    YL4: "Affiliate Member",
    YL5: "Affiliate Member",
    "Graduate/PLE Review": "Affiliate Member",
    "Licensed Physician": "Affiliate Member"
  }
};

function getAmsnMembershipType(affiliation, status) {
  return AMSN_MEMBERSHIP_MAP[affiliation]?.[status] || "";
}

document.addEventListener("DOMContentLoaded", () => {
  const affiliation = document.getElementById("religious-affiliation");
  const status = document.getElementById("academic-status");
  const display = document.getElementById("membership-type-display");
  const hidden = document.getElementById("membership-type");

  if (!affiliation || !status || !display || !hidden) return;

  const updateMembership = () => {
    const value = getAmsnMembershipType(affiliation.value, status.value);
    display.value = value;
    hidden.value = value;
  };

  affiliation.addEventListener("change", updateMembership);
  status.addEventListener("change", updateMembership);
  updateMembership();
});
