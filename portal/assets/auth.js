
document.addEventListener("DOMContentLoaded", () => {
  const warning = document.getElementById("setup-warning");
  if (!window.AMSN_SUPABASE_CONFIGURED && warning) warning.hidden = false;

  const tabs = document.querySelectorAll(".auth-tab");
  const panes = document.querySelectorAll(".auth-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      panes.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
    });
  });

  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginMessage = document.getElementById("login-message");
  const signupMessage = document.getElementById("signup-message");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const client = window.amsnRequireClient();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      window.amsnShowMessage(loginMessage, "Signed in. Opening your portal…", "success");
      window.location.href = "dashboard.html";
    } catch (error) {
      window.amsnShowMessage(loginMessage, error.message, "error");
    }
  });

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!signupForm.consent.checked) {
      window.amsnShowMessage(signupMessage, "Please confirm the membership data and privacy notice.", "error");
      return;
    }

    try {
      const client = window.amsnRequireClient();
      const email = signupForm.email.value.trim();
      const password = signupForm.password.value;
      const confirmPassword = signupForm.confirm_password.value;

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const metadata = {
        full_name: signupForm.full_name.value.trim(),
        school_name: signupForm.school_name.value.trim(),
        year_level: signupForm.year_level.value,
        region: signupForm.region.value,
      };

      const redirectTo = new URL("dashboard.html", window.location.href).href;

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      if (data.session) {
        window.amsnShowMessage(signupMessage, "Account created. Opening your portal…", "success");
        window.location.href = "dashboard.html";
      } else {
        window.amsnShowMessage(
          signupMessage,
          "Account created. Please check your email to confirm your address. After confirmation, sign in here. Your AMSN membership will remain pending until verified.",
          "success"
        );
        signupForm.reset();
      }
    } catch (error) {
      window.amsnShowMessage(signupMessage, error.message, "error");
    }
  });

  if (window.amsnSupabase) {
    window.amsnSupabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "dashboard.html";
    });
  }
});
