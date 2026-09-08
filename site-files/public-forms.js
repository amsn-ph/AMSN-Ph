(function () {
  const config = () => ({
    url: window.AMSN_SUPABASE_URL || "",
    key: window.AMSN_SUPABASE_PUBLISHABLE_KEY || ""
  });

  function setStatus(form, message, type = "") {
    const node = form.querySelector("[data-form-status]");
    if (!node) return;
    node.textContent = message;
    node.className = "form-status" + (type ? " " + type : "");
  }

  async function insertRow(table, payload) {
    const { url, key } = config();
    if (!url || !key) {
      throw new Error("The public form connection is not configured.");
    }

    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || "Submission failed.");
    }
  }

  document.querySelectorAll("[data-public-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      if (String(data.get("website") || "").trim()) return; // honeypot

      const button = form.querySelector('button[type="submit"]');
      const original = button?.textContent || "";

      try {
        if (button) {
          button.disabled = true;
          button.textContent = "Submitting…";
        }
        setStatus(form, "");

        if (form.dataset.publicForm === "inquiry") {
          await insertRow("public_inquiries", {
            full_name: String(data.get("full_name") || "").trim(),
            email: String(data.get("email") || "").trim(),
            school_or_affiliation: String(data.get("school_or_affiliation") || "").trim() || null,
            inquiry_type: String(data.get("inquiry_type") || "").trim(),
            message: String(data.get("message") || "").trim(),
            consent: data.get("consent") === "on",
            source_page: window.location.pathname
          });
          form.reset();
          setStatus(form, "Thank you. Your inquiry has been submitted to AMSN-PH.", "success");
        }

        if (form.dataset.publicForm === "story") {
          await insertRow("story_submissions", {
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
          setStatus(
            form,
            "Thank you for sharing your story. The AMSN-PH team can review it before publication.",
            "success"
          );
        }
      } catch (error) {
        console.error(error);
        setStatus(form, "We could not submit the form. Please try again or email connect@amsn-ph.org.", "error");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = original;
        }
      }
    });
  });
})();
