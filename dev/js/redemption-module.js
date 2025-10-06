function initRedemptionModule() {
  setupRedemptionModule();
}
document.addEventListener("DOMContentLoaded", setupRedemptionModule);

function setupRedemptionModule() {
  if (window.__redemptionInitialized) return;
  window.__redemptionInitialized = true;
  console.log("🧠 Redemption module initializing...");

  const searchBtn = document.getElementById("searchBtn");
  const warning = document.getElementById("searchWarning");

  // ---- toggle groups (Step 2)
  document.querySelectorAll(".toggle-group").forEach(group => {
    const btns = group.querySelectorAll("button");
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        btns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        validateStep2();
      });
    });
  });

  function validateStep2() {
    const filled = [...document.querySelectorAll(".toggle-group")].every(g =>
      g.querySelector("button.active")
    );
    searchBtn.disabled = !filled;
    warning.style.display = filled ? "none" : "block";
  }

  // ---- date mode toggle
  const exactBtn = document.getElementById("exactBtn");
  const flexBtn = document.getElementById("flexBtn");
  const flexPicker = document.getElementById("flexPicker");
  if (exactBtn && flexBtn && flexPicker) {
    exactBtn.onclick = () => {
      exactBtn.classList.add("active");
      flexBtn.classList.remove("active");
      flexPicker.style.display = "none";
    };
    flexBtn.onclick = () => {
      flexBtn.classList.add("active");
      exactBtn.classList.remove("active");
      flexPicker.style.display = "block";
    };
  }

  // ---- search click
  searchBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (searchBtn.disabled) return;

    const payload = {
      origin: document.getElementById("origin").value.trim().toUpperCase(),
      destination: document.getElementById("destination").value.trim().toUpperCase(),
      passengers: document.getElementById("passengers").value,
      cabin: document.getElementById("cabin").value,
      program: document.getElementById("program").value,
      date: document.getElementById("departDate").value,
      flexDays: document.getElementById("flexDays")?.value || 0,
      mode: flexBtn.classList.contains("active") ? "flex" : "exact",
      direct: document.querySelector("#directStop button.active")?.dataset.val,
      multi: document.querySelector("#multiConn button.active")?.dataset.val,
      positioning: document.querySelector("#posFlight button.active")?.dataset.val,
    };

    if (!payload.origin || !payload.destination || !payload.date) {
      alert("Please complete all Step 1 fields before searching.");
      return;
    }

    console.log("📦 Sending payload:", payload);

    try {
      const res = await fetch("/api/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      console.log("🧠 Redemption API response:", data);

      sessionStorage.setItem(
        "latestRedemptionResults",
        JSON.stringify(data.results || [])
      );

      const sessionId = data.sessionId || Date.now();
      window.location.href = `/dev/redemption-results.html?session=${sessionId}`;
    } catch (err) {
      console.error("❌ Redemption fetch error:", err);
      alert("Search failed – check console for details.");
    }
  });

  console.log("✅ Redemption module initialized.");
}
