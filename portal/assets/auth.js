document.addEventListener("DOMContentLoaded", async () => {
  const warning = document.getElementById("setup-warning");
  if (!window.AMSN_SUPABASE_CONFIGURED && warning) warning.hidden = false;

  const tabs = document.querySelectorAll(".auth-tab");
  const panes = document.querySelectorAll(".auth-pane");
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    panes.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
  }));

  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginMessage = document.getElementById("login-message");
  const signupMessage = document.getElementById("signup-message");
  const schoolSelect = document.getElementById("signup-school");
  const schoolOtherWrap = document.getElementById("signup-school-other-wrap");
  const schoolOtherInput = document.getElementById("signup-school-other");
  const chapterSelect = document.getElementById("signup-chapter");
  const regionSelect = document.getElementById("signup-region");
  let schoolRegistry = [];

  if (window.amsnSupabase) await loadRegistries();

  schoolSelect?.addEventListener("change", () => {
    const other = schoolSelect.value === "__other__";
    schoolOtherWrap.hidden = !other;
    schoolOtherInput.required = other;
    if (!other) {
      const school = schoolRegistry.find((x) => x.id === schoolSelect.value);
      if (school?.region) regionSelect.value = school.region;
      if (school?.chapter_id && !chapterSelect.value) chapterSelect.value = school.chapter_id;
    }
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const client = window.amsnRequireClient();
      const { error } = await client.auth.signInWithPassword({
        email: loginForm.email.value.trim(), password: loginForm.password.value
      });
      if (error) throw error;
      window.amsnShowMessage(loginMessage, "Signed in. Opening your portal…", "success");
      window.location.href = "dashboard.html";
    } catch (error) { window.amsnShowMessage(loginMessage, error.message, "error"); }
  });

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!signupForm.consent.checked) {
      window.amsnShowMessage(signupMessage, "Please confirm the membership data and privacy notice.", "error"); return;
    }
    try {
      const client = window.amsnRequireClient();
      if (signupForm.password.value !== signupForm.confirm_password.value) throw new Error("Passwords do not match.");
      const selectedSchool = schoolRegistry.find((x) => x.id === schoolSelect.value);
      const schoolName = schoolSelect.value === "__other__" ? schoolOtherInput.value.trim() : (selectedSchool?.name || "");
      if (!schoolName) throw new Error("Please select or enter your medical school.");

      const metadata = {
        full_name: signupForm.full_name.value.trim(),
        school_name: schoolName,
        medical_school_id: selectedSchool?.id || "",
        chapter_id: chapterSelect.value || "",
        year_level: signupForm.year_level.value,
        region: signupForm.region.value,
      };
      const redirectTo = new URL("dashboard.html", window.location.href).href;
      const { data, error } = await client.auth.signUp({
        email: signupForm.email.value.trim(), password: signupForm.password.value,
        options: { data: metadata, emailRedirectTo: redirectTo }
      });
      if (error) throw error;
      if (data.session) {
        window.amsnShowMessage(signupMessage, "Account created. Opening your portal…", "success");
        window.location.href = "dashboard.html";
      } else {
        window.amsnShowMessage(signupMessage, "Account created. Please check your email to confirm your address. Your AMSN membership remains pending until verified.", "success");
        signupForm.reset(); schoolOtherWrap.hidden = true;
      }
    } catch (error) { window.amsnShowMessage(signupMessage, error.message, "error"); }
  });

  if (window.amsnSupabase) window.amsnSupabase.auth.getUser().then(({ data }) => { if (data.user) window.location.href = "dashboard.html"; });

  async function loadRegistries() {
    const client = window.amsnSupabase;
    const [{data:schools,error:schoolError},{data:chapters,error:chapterError}] = await Promise.all([
      client.from("medical_schools").select("id,name,short_name,city,province,region,chapter_id").eq("is_active",true).order("name"),
      client.from("chapters").select("id,code,name,region").eq("is_active",true).order("code")
    ]);
    if (schoolError || chapterError) {
      schoolSelect.innerHTML='<option value="">Run the V2.2 database migration first</option>';
      chapterSelect.innerHTML='<option value="">Run the V2.2 database migration first</option>'; return;
    }
    schoolRegistry=schools||[];
    schoolSelect.innerHTML='<option value="">Select your medical school</option>'+schoolRegistry.map(s=>{
      const place=[s.city,s.province].filter(Boolean).join(", ");
      return `<option value="${s.id}">${escapeHtml(s.short_name||s.name)}${place?" — "+escapeHtml(place):""}</option>`;
    }).join("")+'<option value="__other__">My medical school is not listed</option>';
    chapterSelect.innerHTML='<option value="">Not yet affiliated / I am not sure</option>'+(chapters||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.code)} — ${escapeHtml(c.name)}</option>`).join("");
  }
});
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
