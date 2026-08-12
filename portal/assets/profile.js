
document.addEventListener("DOMContentLoaded", async () => {
  const { user, profile } = await window.amsnSetupProtectedPage();
  const form = document.getElementById("profile-form");
  const message = document.getElementById("profile-message");

  form.full_name.value = profile.full_name || "";
  form.preferred_name.value = profile.preferred_name || "";
  form.school_name.value = profile.school_name || "";
  form.year_level.value = profile.year_level || "";
  form.city.value = profile.city || "";
  form.region.value = profile.region || "";
  form.bio.value = profile.bio || "";
  form.interests.value = (profile.interests || []).join(", ");
  form.mentorship_interest.checked = !!profile.mentorship_interest;
  form.collaboration_interest.checked = !!profile.collaboration_interest;
  form.directory_visible.checked = profile.directory_visible !== false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const client = window.amsnRequireClient();
      const interests = form.interests.value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const updates = {
        full_name: form.full_name.value.trim(),
        preferred_name: form.preferred_name.value.trim() || null,
        school_name: form.school_name.value.trim(),
        year_level: form.year_level.value || null,
        city: form.city.value.trim() || null,
        region: form.region.value || null,
        bio: form.bio.value.trim() || null,
        interests,
        mentorship_interest: form.mentorship_interest.checked,
        collaboration_interest: form.collaboration_interest.checked,
        directory_visible: form.directory_visible.checked,
        updated_at: new Date().toISOString(),
      };

      const { error } = await client.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      window.amsnShowMessage(message, "Profile updated.", "success");
    } catch (error) {
      window.amsnShowMessage(message, error.message, "error");
    }
  });
});
