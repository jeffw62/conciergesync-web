// === ConciergeSync™ Redemption Bridge ===
// Connects the redem-con form to the gold card animation & backend.

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  if (!searchBtn) return;

  searchBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // gather form data
    const payload = {
      origin: document.getElementById("origin")?.value.trim().toUpperCase(),
      destination: document.getElementById("destination")?.value.trim().toUpperCase(),
      passengers: document.getElementById("passengers")?.value || 1,
      cabin: document.getElementById("cabin")?.value,
      program: document.getElementById("program")?.value,
      date: document.getElementById("departDate")?.value,
      flexDays: document.getElementById("flexDays")?.value || 0,
    };

    if (!payload.origin || !payload.destination || !payload.date) {
      alert("Please complete all Step 1 fields before searching.");
      return;
    }

    console.log("📦 Sending payload:", payload);

    try {
      // show gold-card sequence while backend processes
      if (window.launchGoldCard) launchGoldCard();

      const res = await fetch("/api/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      console.log("🧠 Redemption API response:", data);

      // retain results locally
      localStorage.setItem("latestRedemptionResults", JSON.stringify(data.results || []));
      localStorage.setItem("lastSessionId", data.sessionId || Date.now());

    } catch (err) {
      console.error("❌ Redemption fetch error:", err);
      alert("Search failed – check console for details.");
    }
  });
});
