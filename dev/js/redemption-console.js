(() => {
  console.log(
    "%c🚀 ConciergeSync™ redemption-console.js booting...",
    "color:#f6b93b; font-weight:bold;"
  );

  // -----------------------------------------------
  // 🌿 1. Environment Guards
  // -----------------------------------------------
  const workspace = document.getElementById("workspace");
  if (!workspace) {
    console.warn(
      "⚠️ No #workspace found — not running inside console. Exiting redemption-console.js"
    );
    return;
  }

  // Watch for the search panel (actual injected content)
  const panel = workspace.querySelector("#searchPanel");
  if (!panel) {
    console.warn("⚠️ No #searchPanel found yet — waiting for injection...");

    const observer = new MutationObserver(() => {
      const injected = workspace.querySelector("#searchPanel");
      if (injected) {
        observer.disconnect();
        console.log("✅ Search panel detected post-injection. Initializing handlers...");
        initializeHandlers(injected);
      }
    });

    observer.observe(workspace, { childList: true, subtree: true });
  } else {
    initializeHandlers(panel);
  }

  // -----------------------------------------------
  // 🌿 2. Handler Initialization
  // -----------------------------------------------
  function initializeHandlers(root) {
    const searchBtn = root.querySelector("#searchBtn");
    if (!searchBtn) {
      console.warn("⚠️ Search button not found in injected panel.");
      return;
    }

    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const inputs = root.querySelectorAll("input, select");
      const payload = {};
      inputs.forEach((el) => (payload[el.id] = el.value));

      console.log("✅ Search click captured. Payload:", payload);

      const warning = root.querySelector("#searchWarning");
      if (warning) warning.textContent = "Search event captured successfully.";
    });

    console.log("💡 Redemption console event listener active.");

    // -----------------------------------------------
    // ✈️  Field Initialization (Origin / Destination)
    // -----------------------------------------------
    setupIataAutocomplete(root);

    // --------------------------------------------------
    // 📆 Flex Days Toggle Logic — Matches redem-con.html
    // --------------------------------------------------
    setupFlexDays(root);

    // -----------------------------------------------
    // 🔁 Step 2 Toggle Logic (Yes/No buttons)
    // -----------------------------------------------
    setupRoutingToggles(root);
  } // <-- this closes initializeHandlers

    // --------------------------------------------------
    // ✈️ IATA Autocomplete — Live from local JSON
    // --------------------------------------------------
    async function setupIataAutocomplete(root) {
      const fields = ["origin", "destination"];
      let airportData = [];
    
      // Load local dataset once
      try {
        const res = await fetch("/dev/asset/iata-icao.json");
        airportData = await res.json();
        console.log(`🗺️ Loaded ${airportData.length} airport entries.`);
      } catch (err) {
        console.error("❌ Failed to load IATA dataset:", err);
        return;
      }
    
      // Utility: filter by query
      function findMatches(query) {
        const q = query.toUpperCase();
        return airportData
          .filter(a =>
            a.iata?.startsWith(q) ||
            a.city?.toUpperCase().includes(q) ||
            a.name?.toUpperCase().includes(q)
          )
          .slice(0, 8);
      }
    
      // Build interaction
      fields.forEach(id => {
        const input = root.querySelector(`#${id}`);
        const suggBox = root.querySelector(`#${id}-suggestions`);
        if (!input || !suggBox) return;
    
        input.addEventListener("input", e => {
          const val = e.target.value.trim();
          suggBox.innerHTML = "";
          if (val.length < 2) return;
    
          const matches = findMatches(val);
          matches.forEach(a => {
            const div = document.createElement("div");
            div.className = "suggestion";
            div.textContent = `${a.iata?.toUpperCase()} — ${a.region_name}, ${a.country_code} • ${a.airport}`;
            div.addEventListener("click", () => {
              input.value = a.iata;
              suggBox.innerHTML = "";
            });
            suggBox.appendChild(div);
          });
        });
    
        // simple blur cleanup
        input.addEventListener("blur", () => {
          setTimeout(() => (suggBox.innerHTML = ""), 150);
        });
      });
    
      console.log("✈️ IATA autocomplete initialized.");
    }

  // --------------------------------------------------
  // 📆 Flex Days Toggle Logic — Matches redem-con.html
  // --------------------------------------------------
  function setupFlexDays(root) {
    const exactBtn = root.querySelector("#exactBtn");
    const flexBtn = root.querySelector("#flexBtn");
    const flexPicker = root.querySelector("#flexPicker");
    const flexSelect = root.querySelector("#flexDays");
  
    if (!exactBtn || !flexBtn || !flexPicker || !flexSelect) {
      console.warn("⚠️ Flex Days elements not found in workspace.");
      return;
    }
  
    // Switch between Exact and Flexible modes
    exactBtn.addEventListener("click", () => {
      exactBtn.classList.add("active");
      flexBtn.classList.remove("active");
      flexPicker.style.display = "none";
      console.log("📆 Exact Date mode selected.");
    });
  
    flexBtn.addEventListener("click", () => {
      flexBtn.classList.add("active");
      exactBtn.classList.remove("active");
      flexPicker.style.display = "block";
      console.log("📆 Flexible +/- Days mode selected.");
    });
  
    // Handle change in the +/- days dropdown
    flexSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      console.log(`📆 Flex Days set to ±${val} days`);
    });
  
    console.log("📆 Flex Days logic initialized.");
  }

  // --------------------------------------------------
  // 🔁 Step 2 Routing Toggles (Updated Interlock Rules)
  // --------------------------------------------------
  function setupRoutingToggles(root) {
    const directYes = root.querySelector("#directYes");
    const directNo = root.querySelector("#directNo");
    const multiYes = root.querySelector("#multiYes");
    const multiNo = root.querySelector("#multiNo");
    const posYes = root.querySelector("#positioningYes");
    const posNo = root.querySelector("#positioningNo");
  
    if (!directYes || !multiYes || !posYes) {
      console.warn("⚠️ Routing toggle buttons missing.");
      return;
    }
  
    // Helper to set active / inactive styles
    const setActive = (yesBtn, noBtn, state) => {
      yesBtn.classList.toggle("active", state);
      noBtn.classList.toggle("active", !state);
    };
  
    // Direct ↔ Multi-stop Interlock
    directYes.addEventListener("click", () => {
      setActive(directYes, directNo, true);
      setActive(multiYes, multiNo, false);
      console.log("✈️ Direct = YES → Multi-stop = NO");
    });
    directNo.addEventListener("click", () => setActive(directYes, directNo, false));
  
    multiYes.addEventListener("click", () => {
      setActive(multiYes, multiNo, true);
      setActive(directYes, directNo, false);
      console.log("✈️ Multi-stop = YES → Direct = NO");
    });
    multiNo.addEventListener("click", () => setActive(multiYes, multiNo, false));
  
    // Positioning Flights (independent)
    posYes.addEventListener("click", () => setActive(posYes, posNo, true));
    posNo.addEventListener("click", () => setActive(posYes, posNo, false));
  
    console.log("🔁 Routing toggles initialized with interlock behavior.");
  }

  }
})();

