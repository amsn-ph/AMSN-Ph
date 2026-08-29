document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("reset-loading");
  const errorPanel = document.getElementById("reset-link-error");
  const form = document.getElementById("reset-password-form");
  const intro = document.getElementById("reset-intro");
  const passwordInput = document.getElementById("new-password");
  const confirmInput = document.getElementById("confirm-new-password");
  const strength = document.getElementById("password-strength");
  const message = document.getElementById("reset-message");
  const submitButton = document.getElementById("update-password-button");

  let client;
  let recoveryReady = false;
  let settled = false;

  try {
    client = window.amsnRequireClient();
  } catch {
    showInvalidLink("The portal authentication service is not available.");
    return;
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const urlError =
    url.searchParams.get("error_description") ||
    hashParams.get("error_description") ||
    url.searchParams.get("error") ||
    hashParams.get("error");

  if (urlError) {
    showInvalidLink(decodeURIComponent(urlError.replace(/\+/g, " ")));
    return;
  }

  const { data: listenerData } = client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) {
      recoveryReady = true;
      showResetForm(session.user.email || "");
    }
  });

  try {
    const { data, error } = await client.auth.getSession();
    if (!error && data?.session?.user) {
      recoveryReady = true;
      showResetForm(data.session.user.email || "");
    }
  } catch {}

  setTimeout(() => {
    if (!recoveryReady && !settled) showInvalidLink();
  }, 4500);

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.togglePassword);
      if (!target) return;
      const reveal = target.type === "password";
      target.type = reveal ? "text" : "password";
      button.textContent = reveal ? "Hide" : "Show";
    });
  });

  passwordInput.addEventListener("input", updateStrength);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!recoveryReady) return showInvalidLink();

    const password = passwordInput.value;
    const confirm = confirmInput.value;
    window.amsnClearMessage(message);

    if (password.length < 8) {
      return window.amsnShowMessage(message, "Your new password must contain at least 8 characters.", "error");
    }

    if (password !== confirm) {
      return window.amsnShowMessage(message, "The passwords do not match.", "error");
    }

    submitButton.disabled = true;
    submitButton.textContent = "Updating Password…";

    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;

      window.amsnShowMessage(message, "Password updated successfully. Returning you to Sign In…", "success");

      try { await client.auth.signOut(); } catch {}

      setTimeout(() => {
        window.location.replace("index.html?reset=success");
      }, 1000);
    } catch (error) {
      window.amsnShowMessage(
        message,
        error.message || "Could not update your password. Please request a new reset link.",
        "error"
      );
      submitButton.disabled = false;
      submitButton.textContent = "Update Password";
    }
  });

  window.addEventListener("beforeunload", () => {
    listenerData?.subscription?.unsubscribe();
  });

  function showResetForm(email) {
    settled = true;
    loading.hidden = true;
    errorPanel.hidden = true;
    form.hidden = false;
    intro.textContent = email
      ? `Set a new password for ${email}.`
      : "Set a new password for your AMSN-PH account.";
    updateStrength();
    requestAnimationFrame(() => passwordInput.focus({ preventScroll: true }));
  }

  function showInvalidLink(detail = "") {
    if (recoveryReady) return;
    settled = true;
    loading.hidden = true;
    form.hidden = true;
    errorPanel.hidden = false;

    if (detail) {
      const p = errorPanel.querySelector("p");
      if (p) p.textContent = `${detail} Request a fresh password-reset link from the AMSN-PH Sign In page.`;
    }

    intro.textContent = "We could not validate this password-recovery link.";
  }

  function updateStrength() {
    const value = passwordInput.value;
    if (!value) {
      strength.className = "password-strength";
      strength.textContent = "Enter a new password.";
      return;
    }

    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 1) {
      strength.className = "password-strength weak";
      strength.textContent = "Password strength: weak";
    } else if (score <= 3) {
      strength.className = "password-strength fair";
      strength.textContent = "Password strength: fair";
    } else {
      strength.className = "password-strength strong";
      strength.textContent = "Password strength: strong";
    }
  }
});
