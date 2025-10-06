// ======================================================
// ConciergeSync™ – Redemption Form Logic
// ======================================================

function initRedemptionModule() {
  console.log("✅ initRedemptionModule() fired");

  const exactBtn = document.getElementById("exactBtn");
  const flexBtn = document.getElementById("flexBtn");
  const flexPicker = document.getElementById("flexPicker");
  const searchBtn = document.querySelector(".search-btn");
  const warning = document.getElementById("searchWarning");

  if (!exactBtn || !flexBtn || !searchBtn) {
    console.warn("⚠️ Redemption form elements not found.");
    return;
  }

  // -------------------------
  // 1. Date-mode toggle logic
  // -------------------------
  function setMode(mode) {
    if (mode === "exact") {
      exactBtn.classList.add("active");
      flexBtn.classList.remove("active");
      if (flexPicker) flexPicker.style.display = "none";
    } else {
      flexBtn.classList.add("active");
      exactBtn.classList.remove("active");
      if (flexPicker) flexPicker.style.display = "block";
    }
  }

  exactBtn.addEventListener("click", () => setMode("exact"));
  flexBtn.addEventListener("click", () => setMode("flexible"));
  setMode("exact");

  // --------------------------------
  // 2. Routing preference interactions
  // --------------------------------
  initRoutingLogic();

  function initRoutingLogic() {
    const groups = ["directStop", "multiConn", "posFlight"].map(id =>
      document.getElementById(id)
    );

    const checkSelections = () => {
      const allSelected = groups.every(g => g && g.querySelector(".active"));
      if (allSelected) {
        searchBtn.disabled = false;
        searchBtn.style.opacity = "1";
        searchBtn.style.cursor = "pointer";
        warning.classList.add("hidden");
        warning.style.display = "none";
      } else {
        searchBtn.disabled = true;
        searchBtn.style.opacity = "0.6";
        searchBtn.style.cursor = "not-allowed";
        warning.classList.remove("hidden");
        warning.style.display = "block";
      }
    };

    groups.forEach(group => {
      if (!group) return;
      group.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
          group.querySelectorAll("button").forEach(b =>
            b.classList.remove("active")
          );
          btn.classList.add("active");
          checkSelections();
        });
      });
    });

    checkSelections();
  }

  // -----------------------------
  // 3. Search-button click handler
  // -----------------------------
  searchBtn.addEventListener("click", () => {
    const payload = {
      origin: document.getElementById("origin").value.trim().toUpperCase(),
      destination: document
        .getElementById("destination")
        .value.trim()
        .toUpperCase(),
      passengers: document.getElementById("passengers").value,
      cabin: document.getElementById("cabin").value,
      program: document.getElementById("program").value,
      date: document.getElementById("departDate").value,
    };

    console.log("➡️ Payload being sent:", payload);
    searchBtn.textContent = "Searching…";
    searchBtn.disabled = true;

    fetch("/api/redemption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        const sessionId = data.sessionId || Date.now();
        window.location.href = `/dev/redemption-results.html?session=${sessionId}`;
      })
      .catch(err => {
        console.error("❌ Redemption API error:", err);
        alert("Something went wrong while searching. Please try again.");
      });
  });

  // -----------------------------
  // 4. Airport autocomplete setup
  // -----------------------------
  fetch("/dev/asset/iata-icao.json")
    .then(res => res.json())
    .then(data => {
      setupAutocomplete("origin", "origin-suggestions", data);
      setupAutocomplete("destination", "destination-suggestions", data);
    })
    .catch(() => console.warn("⚠️ Could not load airport data."));

  function setupAutocomplete(inputId, suggestionsId, airports) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    if (!input || !suggestions) return;

    input.addEventListener("input", () => {
      const query = input.value.toLowerCase();
      suggestions.innerHTML = "";
      if (query.length < 2) return;

      const matches = airports
        .filter(
          a =>
            a.iata.toLowerCase().includes(query) ||
            a.airport.toLowerCase().includes(query) ||
            (a.region_name &&
              a.region_name.toLowerCase().includes(query))
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

    document.addEventListener("click", e => {
      if (!suggestions.contains(e.target) && e.target !== input) {
        suggestions.innerHTML = "";
      }
    });
  }
}

// make available to console.html loader
window.initRedemptionModule = initRedemptionModule;
