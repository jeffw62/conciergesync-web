// =====================================================
// ConciergeSync – Redemption Form Logic (stable build)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🧠 Redemption module initializing...");

  // ----------------------------------------------------
  // Yes / No toggle groups
  // ----------------------------------------------------
  const toggleGroups = document.querySelectorAll(".yes-no");
  toggleGroups.forEach(group => {
    const buttons = group.querySelectorAll("button");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        btn.dataset.value = btn.textContent.trim().toLowerCase();
        console.log(`🔘 ${group.id}: ${btn.dataset.value}`);
      });
    });
  });

  // ----------------------------------------------------
  // Date mode toggles
  // ----------------------------------------------------
  const exactBtn = document.getElementById("exactBtn");
  const flexBtn = document.getElementById("flexBtn");
  const flexPicker = document.getElementById("flexPicker");

  if (exactBtn && flexBtn && flexPicker) {
    exactBtn.addEventListener("click", () => {
      exactBtn.classList.add("active");
      flexBtn.classList.remove("active");
      flexPicker.style.display = "none";
      console.log("📅 Exact-date mode selected");
    });

    flexBtn.addEventListener("click", () => {
      flexBtn.classList.add("active");
      exactBtn.classList.remove("active");
      flexPicker.style.display = "block";
      console.log("📅 Flexible-range mode selected");
    });
  }

  // ----------------------------------------------------
  // Form submission
  // ----------------------------------------------------
  const searchBtn = document.getElementById("searchBtn");
  if (!searchBtn) {
    console.warn("⚠️ searchBtn not found");
    return;
  }

  searchBtn.addEventListener("click", async () => {
    console.log("🚀 Search clicked");

    const payload = {
      origin: document.getElementById("origin").value.trim().toUpperCase(),
      destination: document.getElementById("destination").value.trim().toUpperCase(),
      passengers: document.getElementById("passengers").value,
      cabin: document.getElementById("cabin").value,
      program: document.getElementById("program").value,
      date: document.getElementById("departDate").value,
      flexDays: document.getElementById("flexDays")?.value || 0,
      mode: flexBtn?.classList.contains("active") ? "flex" : "exact"
    };

    console.log("📦 Payload being sent:", payload);

    try {
      const res = await fetch("/api/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("🧠 Redemption API response:", data);

      alert(`Search complete – ${data.results?.length || 0} results found`);
      // Uncomment when ready to redirect:
      // const sessionId = data.sessionId || Date.now();
      // window.location.href = `/dev/redemption-results.html?session=${sessionId}`;

    } catch (err) {
      console.error("❌ Redemption fetch error:", err);
      alert("Search failed – check console for details.");
    }
  });

  console.log("✅ Redemption module initialized.");
});
