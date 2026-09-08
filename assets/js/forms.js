(function () {
  function statusBox(form) {
    return form.querySelector("[data-form-status]");
  }

  function showStatus(form, message, type) {
    const box = statusBox(form);
    if (!box) return;
    box.textContent = message;
    box.className = "form-status show " + type;
  }

  function getConfig() {
    return window.AMSN_FORM_CONFIG || {};
  }

  async function submitToSupabase(table, payload) {
    const { supabaseUrl, supabaseAnonKey } = getConfig();

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Form backend is not configured yet. Add your Supabase URL and anon key in assets/js/config.js."
      );
    }

    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Submission failed.");
    }
  }

  document.querySelectorAll("[data-amsn-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const button = form.querySelector('button[type="submit"]');
      const originalText = button ? button.textContent : "";
      if (button) {
        button.disabled = true;
        button.textContent = "Submitting…";
      }

      try {
        const formType = form.dataset.amsnForm;
        const data = new FormData(form);

        if (formType === "inquiry") {
          await submitToSupabase("public_inquiries", {
            full_name: String(data.get("full_name") || "").trim(),
            email: String(data.get("email") || "").trim(),
            school_or_affiliation: String(data.get("school_or_affiliation") || "").trim(),
            inquiry_type: String(data.get("inquiry_type") || "").trim(),
            message: String(data.get("message") || "").trim(),
            consent: data.get("consent") === "on",
            source_page: window.location.pathname
          });

          form.reset();
          showStatus(
            form,
            "Thank you. Your inquiry has been submitted to AMSN-PH.",
            "success"
          );
        }

        if (formType === "story") {
          await submitToSupabase("story_submissions", {
            full_name: String(data.get("full_name") || "").trim(),
            email: String(data.get("email") || "").trim(),
            school_or_institution: String(data.get("school_or_institution") || "").trim(),
            role_or_level: String(data.get("role_or_level") || "").trim(),
            story_title: String(data.get("story_title") || "").trim(),
            story_body: String(data.get("story_body") || "").trim(),
            photo_link: String(data.get("photo_link") || "").trim() || null,
            permission_to_publish: data.get("permission_to_publish") === "on",
            permission_to_edit: data.get("permission_to_edit") === "on",
            source_page: window.location.pathname
          });

          form.reset();
          showStatus(
            form,
            "Thank you for sharing your story. The AMSN-PH team can review it before publication.",
            "success"
          );
        }
      } catch (error) {
        showStatus(form, error.message || "Something went wrong.", "error");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      }
    });
  });
})();
