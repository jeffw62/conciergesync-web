function initRedemptionModule() {
  setupRedemptionModule();
}
document.addEventListener("DOMContentLoaded", setupRedemptionModule);
// --- Airport Autocomplete (IATA/ICAO) ---
let airports = [];

function loadAirports() {
  fetch("/dev/asset/iata-icao.json")
    .then(res => res.json())
    .then(data => {
      airports = data;
      console.log("🛫 Loaded airports:", airports.length);
    })
    .catch(err => console.error("❌ Failed to load airports:", err));
}

function setupRedemptionModule() {
  if (window._redemptionInitialized) return;
  window._redemptionInitialized = true;
  console.log("💗 Redemption module initializing...");

  loadAirports(); // fetch airport list

  // activate autocompletes
  setupAutocomplete("origin", "origin-suggestions");
  setupAutocomplete("destination", "destination-suggestions");

  // --- Routing Preference Button Logic (moved from redem-con.html) ---
  const directGroup = document.getElementById("directStop");
  const multiGroup  = document.getElementById("multiConn");
  const posGroup    = document.getElementById("posFlight");
  
  function activate(btn, group) {
    group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }
  
  // Direct Non-stop buttons
  if (directGroup && multiGroup) {
    directGroup.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activate(btn, directGroup);
        if (btn.dataset.val === "yes") {
          const noBtn = multiGroup.querySelector('button[data-val="no"]');
          if (noBtn) {
            multiGroup.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            noBtn.classList.add("active");
          }
        }
      });
    });
  
    // Multiple Connections buttons
    multiGroup.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activate(btn, multiGroup);
        if (btn.dataset.val === "yes") {
          const noBtn = directGroup.querySelector('button[data-val="no"]');
          if (noBtn) {
            directGroup.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            noBtn.classList.add("active");
          }
        }
      });
    });
  }
  
  // Positioning Flight Allowed buttons
  if (posGroup) {
    posGroup.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activate(btn, posGroup);
      });
    });
  }

  
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

      // --- Save the API results for the results page ---
      sessionStorage.setItem("latestRedemptionResults", JSON.stringify(data.results));
      console.log("✅ sessionStorage write complete:", sessionStorage.getItem("latestRedemptionResults"));
      
      // --- Redirect after short delay ---
      setTimeout(() => {
        console.log("Redirecting to results page...");
        window.location.href = "https://conciergesync.ai/dev/redemption-results.html";
      }, 500);

      sessionStorage.setItem(
        "latestRedemptionResults",
        JSON.stringify(data.results || [])
      );

      const sessionId = data.sessionId || Date.now();
      // window.location.href = `/dev/redemption-results.html?session=${sessionId}`;
    } catch (err) {
      console.error("❌ Redemption fetch error:", err);
      alert("Search failed – check console for details.");
    }
  });

  // --- Autocomplete Setup Function ---
function setupAutocomplete(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);
  if (!input || !suggestions) return;

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    suggestions.innerHTML = "";
    if (query.length < 2) return;

    const matches = airports
      .filter(a =>
        a.iata.toLowerCase().includes(query) ||
        a.airport.toLowerCase().includes(query) ||
        (a.region_name && a.region_name.toLowerCase().includes(query))
      )
      .slice(0, 10);

    matches.forEach(match => {
      const div = document.createElement("div");
      div.classList.add("suggestion-item");
      div.innerHTML = `<span class="iata">${match.iata}</span> – <span class="airport">${match.airport}</span>`;
      div.addEventListener("click", () => {
        input.value = match.iata;
        suggestions.innerHTML = "";
      });
      suggestions.appendChild(div);
    });
  });

  // Hide dropdown when clicking elsewhere
  document.addEventListener("click", e => {
    if (!suggestions.contains(e.target) && e.target !== input) {
      suggestions.innerHTML = "";
    }
  });
}
}
