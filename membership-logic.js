// AMSN-PH Membership Classification Logic
// No "Other" option by design.

const AMSN_MEMBERSHIP_MAP = Object.freeze({
  SDA: Object.freeze({
    YL1: "Regular Member",
    YL2: "Regular Member",
    YL3: "Regular Member",
    YL4: "Associate Member",
    YL5: "Associate Member",
    "Graduate/PLE Review": "Associate Member",
    "Licensed Physician": "Honorary Member"
  }),
  "Non-SDA": Object.freeze({
    YL1: "Affiliate Member",
    YL2: "Affiliate Member",
    YL3: "Affiliate Member",
    YL4: "Affiliate Member",
    YL5: "Affiliate Member",
    "Graduate/PLE Review": "Affiliate Member",
    "Licensed Physician": "Affiliate Member"
  })
});

function getAmsnMembershipType(religiousAffiliation, academicStatus) {
  if (!religiousAffiliation || !academicStatus) return "";
  return AMSN_MEMBERSHIP_MAP[religiousAffiliation]?.[academicStatus] || "";
}

function initAmsnMembershipFields() {
  const affiliation = document.getElementById("religious-affiliation");
  const status = document.getElementById("academic-status");
  const display = document.getElementById("membership-type-display");
  const hidden = document.getElementById("membership-type");

  if (!affiliation || !status || !display || !hidden) return;

  const refresh = () => {
    const membershipType = getAmsnMembershipType(
      affiliation.value,
      status.value
    );

    display.value = membershipType;
    hidden.value = membershipType;

    if (membershipType) {
      display.setAttribute("data-classified", "true");
    } else {
      display.removeAttribute("data-classified");
    }
  };

  affiliation.addEventListener("change", refresh);
  status.addEventListener("change", refresh);
  refresh();
}

document.addEventListener("DOMContentLoaded", initAmsnMembershipFields);

/*
When submitting to Supabase, include only the source fields as trusted inputs:

const payload = {
  ...otherFields,
  religious_affiliation: document.getElementById("religious-affiliation").value,
  academic_status: document.getElementById("academic-status").value
};

The database trigger in amsn-membership-migration.sql computes membership_type
again server-side. You may include membership_type for display, but do not trust
the browser value as authoritative.
*/
