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
  // 📆 Flex Days Toggle Logic
  // --------------------------------------------------
  function setupFlexDays(root) {
    const flexBtn = root.querySelector("#flexDaysBtn");
    const dropdown = root.querySelector("#flexDaysDropdown");
    if (!flexBtn || !dropdown) {
      console.warn("⚠️ Flex Days elements not found.");
      return;
    }
  
    // toggle dropdown visibility
    flexBtn.addEventListener("click", () => {
      const isVisible = dropdown.classList.toggle("visible");
      dropdown.style.display = isVisible ? "block" : "none";
      console.log(`📆 Flex Days dropdown ${isVisible ? "opened" : "closed"}.`);
    });
  
    // click a value
    dropdown.querySelectorAll("button, .option").forEach(opt => {
      opt.addEventListener("click", () => {
        const val = opt.dataset.value || opt.textContent.trim();
        flexBtn.textContent = `±${val} days`;
        dropdown.style.display = "none";
        dropdown.classList.remove("visible");
        console.log(`📆 Flex Days set to ±${val} days`);
      });
    });
  
    console.log("📆 Flex Days logic initialized.");
  }
  
  // --------------------------------------------------
  // 🔁 Step 2 Toggle Logic
  // --------------------------------------------------
  function setupRoutingToggles(root) {
    const groups = ["direct", "multi", "positioning"];

    groups.forEach((key) => {
      const yes = root.querySelector(`#${key}Yes`);
      const no = root.querySelector(`#${key}No`);
      if (!yes || !no) return;

      const activate = (active) => {
        yes.classList.toggle("active", active);
        no.classList.toggle("active", !active);
        yes.dataset.value = active ? "yes" : "no";
        no.dataset.value = active ? "yes" : "no";
      };

      yes.addEventListener("click", () => activate(true));
      no.addEventListener("click", () => activate(false));
    });

    console.log("🔁 Routing toggles initialized.");
  }
})();

