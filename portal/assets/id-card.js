document.addEventListener("DOMContentLoaded", () => {
  bootDigitalId();
});

async function bootDigitalId() {
  const message = document.getElementById("id-message");
  const card = document.getElementById("digital-member-card");
  const retryButton = document.getElementById("retry-id");

  retryButton?.setAttribute("hidden", "");

  try {
    window.amsnClearMessage(message);

    const { user, profile } = await window.amsnSetupProtectedPage();
    const client = window.amsnRequireClient();

    // Render everything already available from the profile immediately.
    renderBasicProfile(profile);

    if (profile.membership_status !== "verified") {
      card.style.opacity = ".55";
      window.amsnShowMessage(
        message,
        "Your digital AMSN-PH ID becomes available after membership verification.",
        "error"
      );
      return;
    }

    card.style.opacity = "1";

    // Load independent information in parallel.
    const credentialPromise = loadCredential(client, user.id);
    const schoolPromise = loadSchool(client, profile);
    const chapterPromise = loadChapter(client, profile);
    const avatarPromise = loadAvatar(client, profile);

    const [credential, school, chapter] = await Promise.all([
      credentialPromise,
      schoolPromise,
      chapterPromise
    ]);

    renderInstitutionalDetails(profile, school, chapter);

    // Avatar is non-essential; don't hold up the ID/QR for it.
    avatarPromise.catch(() => {});

    if (!credential) {
      throw new Error("AMSN-PH credential could not be loaded.");
    }

    document.getElementById("id-member-number").textContent =
      credential.member_number;

    renderQr(credential.verification_code);
    setupActions(credential.verification_code);

  } catch (error) {
    console.error("Digital ID load error:", error);

    window.amsnShowMessage(
      message,
      error?.message ||
        "The digital ID could not be loaded. Please try again.",
      "error"
    );

    retryButton?.removeAttribute("hidden");
  }
}

function renderBasicProfile(profile) {
  const displayName =
    profile.preferred_name ||
    profile.full_name ||
    "AMSN-PH Member";

  document.getElementById("id-name").textContent = displayName;
  document.getElementById("id-member-number").textContent = "Preparing credential…";

  document.getElementById("id-school").textContent =
    profile.school_name || "Loading…";

  document.getElementById("id-chapter").textContent = "Loading…";

  document.getElementById("id-verified-date").textContent =
    profile.verified_at ? formatDate(profile.verified_at) : "Verified";

  setInitials(displayName);
}

async function loadCredential(client, userId) {
  // Most verified members already have a V2.4 credential.
  let result = await window.amsnWithTimeout(
    client
      .from("member_credentials")
      .select("member_number,verification_code,status,issued_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    7000,
    "Member credential"
  );

  if (result.error) throw result.error;
  if (result.data) return result.data;

  // Only use the issuing RPC when a credential is genuinely missing.
  const { error: ensureError } = await window.amsnWithTimeout(
    client.rpc("ensure_own_member_credential"),
    7000,
    "Credential setup"
  );

  if (ensureError) throw ensureError;

  result = await window.amsnWithTimeout(
    client
      .from("member_credentials")
      .select("member_number,verification_code,status,issued_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .single(),
    7000,
    "Member credential"
  );

  if (result.error) throw result.error;
  return result.data;
}

async function loadSchool(client, profile) {
  if (!profile.medical_school_id) return null;

  const { data, error } = await window.amsnWithTimeout(
    client
      .from("medical_schools")
      .select("name,short_name")
      .eq("id", profile.medical_school_id)
      .maybeSingle(),
    6000,
    "Medical school"
  );

  if (error) return null;
  return data;
}

async function loadChapter(client, profile) {
  if (!profile.chapter_id) return null;

  const { data, error } = await window.amsnWithTimeout(
    client
      .from("chapters")
      .select("code,name")
      .eq("id", profile.chapter_id)
      .maybeSingle(),
    6000,
    "Affiliation"
  );

  if (error) return null;
  return data;
}

async function loadAvatar(client, profile) {
  if (!profile.avatar_path) return;

  const { data, error } = await window.amsnWithTimeout(
    client.storage
      .from("profile-photos")
      .createSignedUrl(profile.avatar_path, 3600),
    6000,
    "Profile photo"
  );

  if (error) return;

  const avatarUrl = data?.signedUrl || data?.signedURL;
  if (!avatarUrl) return;

  const image = document.getElementById("id-photo-img");
  image.src = avatarUrl;
  image.hidden = false;
  document.getElementById("id-photo-initials").hidden = true;
}

function renderInstitutionalDetails(profile, school, chapter) {
  const schoolName =
    school?.short_name ||
    school?.name ||
    profile.school_name ||
    "Medical school not specified";

  const chapterName = chapter?.code
    ? `${chapter.code}${chapter.name ? " — " + chapter.name : ""}`
    : "Not yet affiliated";

  document.getElementById("id-school").textContent = schoolName;
  document.getElementById("id-chapter").textContent = chapterName;
}

function renderQr(code) {
  if (!window.QRCode) {
    throw new Error("QR library did not load. Refresh the page and try again.");
  }

  const verificationUrl = new URL("verify.html", window.location.href);
  verificationUrl.searchParams.set("code", code);

  const qrContainer = document.getElementById("id-qr");
  qrContainer.innerHTML = "";

  new QRCode(qrContainer, {
    text: verificationUrl.href,
    width: 110,
    height: 110,
    colorDark: "#005480",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });

  window.AMSN_CURRENT_VERIFICATION_URL = verificationUrl.href;
}

function setupActions(code) {
  const printButton = document.getElementById("print-id");
  const copyButton = document.getElementById("copy-verification-link");
  const retryButton = document.getElementById("retry-id");

  if (printButton && printButton.dataset.ready !== "true") {
    printButton.dataset.ready = "true";
    printButton.addEventListener("click", () => window.print());
  }

  if (copyButton && copyButton.dataset.ready !== "true") {
    copyButton.dataset.ready = "true";
    copyButton.addEventListener("click", async () => {
      const message = document.getElementById("id-message");
      const url = window.AMSN_CURRENT_VERIFICATION_URL;

      try {
        if (!url) throw new Error("Verification link is not ready yet.");
        await navigator.clipboard.writeText(url);
        window.amsnShowMessage(message, "Verification link copied.", "success");
      } catch (error) {
        window.amsnShowMessage(
          message,
          error.message ||
            "Could not copy the verification link automatically.",
          "error"
        );
      }
    });
  }

  if (retryButton && retryButton.dataset.ready !== "true") {
    retryButton.dataset.ready = "true";
    retryButton.addEventListener("click", () => {
      window.location.reload();
    });
  }
}

function setInitials(name) {
  const initials = String(name || "AM")
    .trim()
    .split(/\s+/)
    .slice(0,2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AM";

  document.getElementById("id-photo-initials").textContent = initials;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
