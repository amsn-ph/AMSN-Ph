
document.addEventListener("DOMContentLoaded", async () => {
  const { roles } = await window.amsnSetupProtectedPage();

  if (!window.amsnRoleAllowsOfficerHub(roles)) {
    window.location.href = "dashboard.html";
    return;
  }

  const client = window.amsnRequireClient();
  const form = document.getElementById("announcement-form");
  const message = document.getElementById("announcement-message");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const user = await window.amsnRequireUser();

      const payload = {
        title: form.title.value.trim(),
        body: form.body.value.trim(),
        audience: form.audience.value,
        is_published: form.is_published.checked,
        published_at: form.is_published.checked ? new Date().toISOString() : null,
        created_by: user.id,
      };

      const { error } = await client.from("announcements").insert(payload);
      if (error) throw error;

      form.reset();
      window.amsnShowMessage(message, "Announcement saved.", "success");
    } catch (error) {
      window.amsnShowMessage(message, error.message, "error");
    }
  });
});
