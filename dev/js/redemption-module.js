// ============================================================
// ConciergeSync™ Redemption Module (stable + console compatible)
// ============================================================

// ---------- GLOBAL INIT (required by console.html) ----------
function initRedemptionModule() {
  console.log("⚙️ initRedemptionModule() called");
  setupRedemptionModule();
}

// ---------- SELF-START (stand-alone pages) ----------
document.addEventListener("DOMContentLoaded", setupRedemptionModule);

// ============================================================
// Main setup
// ============================================================
function setupRedemptionModule() {
  if (window.__redemptionInitialized) return; // prevent double-init
  window.__redemptionInitialized = true;
  console.log("🧠 Redemption module initializing...");

  // ------------------------------------------------------------
  // 1. YES / NO Toggles
  // ------------------------------------------------------------
  document.querySelectorAll(".yes-no").forEach(group => {
    const btns = group.querySelectorAll("button");
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        btns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        btn.dataset.value = btn.textContent.trim().toLowerCase();
        console.log(`🔘 ${group.id}: ${btn.dataset.value}`);
      });
    });
  });

  // ------------------------------------------------------------
  // 2. Exact / Flexible Date Toggle
  // ------------------------------------------------------------
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
      console.log("📅 Flexible-date mode selected");
    });
  }

  // ------------------------------------------------------------
  // 3. Search submission
  // ------------------------------------------------------------
  const searchBtn = document.getElementById("searchBtn");
  if (!searchBtn) {
    console.warn("⚠️ searchBtn not found");
    console.log("✅ Redemption module initialized (no searchBtn).");
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
      mode: flexBtn?.classList.contains("active") ? "flex" : "exact",
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
      alert(`Search complete – ${data.results?.length || 0} results found.`);

      // Redirect after success
      const sessionId = data.sessionId || Date.now();
      window.location.href = `/dev/redemption-results.html?session=${sessionId}`;
    } catch (err) {
      console.error("❌ Redemption fetch error:", err);
      alert("Search failed – check console for details.");
    }
  });

  console.log("✅ Redemption module initialized.");
}
