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
    // 🟡 STEP 3.1 — Search Activation Logic
    // -----------------------------------------------
    const searchWarning = root.querySelector("#searchWarning");
    const originInput = root.querySelector("#origin");
    const destinationInput = root.querySelector("#destination");
    const departDate = root.querySelector("#departDate");
    const returnDate = root.querySelector("#returnDate");
    const cabinSelect = root.querySelector("#cabin");
    const flexToggles = root.querySelectorAll('input[name="flexDays"]');
    const routingToggles = root.querySelectorAll('.step.routing input[type="radio"]');
    
    function isFormReady() {
      const originOk = originInput?.value?.length === 3;
      const destOk = destinationInput?.value?.length === 3;
      const dateOk = !!departDate.value;
      const cabinOk = cabinSelect.value !== "";
      const flexOk = root.querySelector("#exactBtn.active, #flexBtn.active") !== null;
      const directOk = root.querySelector("#directStop .active") !== null;
      const multiOk = root.querySelector("#multiConn .active") !== null;
      const posOk = root.querySelector("#posFlight .active") !== null;
      const routingOk = [...routingToggles].some(el => el.checked);
      return originOk && destOk && dateOk && cabinOk && flexOk && routingOk;
    }
    
    function updateSearchState() {
      if (isFormReady()) {
        searchBtn.disabled = false;
        if (searchWarning) searchWarning.style.display = "none";
        searchBtn.classList.add("ready");
      } else {
        searchBtn.disabled = true;
        if (searchWarning) searchWarning.style.display = "block";
        searchBtn.classList.remove("ready");
      }
    }
    
    // Attach live validation listeners for Step 1 & 2
    [
      originInput, destinationInput, departDate, returnDate, cabinSelect,
      ...flexToggles
    ].forEach(el => el?.addEventListener("change", updateSearchState));
    
    // Listen for clicks on Step 2 routing buttons (Yes/No)
    const routingButtons = root.querySelectorAll(
      "#directStop button, #multiConn button, #posFlight button"
    );
    routingButtons.forEach(btn =>
      btn.addEventListener("click", () => {
        // Give DOM a beat to toggle .active states, then recheck
        setTimeout(updateSearchState, 50);
      })
    );
    
    updateSearchState(); // initial check

  
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
    // <-- this closes initializeHandlers

    console.log("🔁 Routing toggles initialized and mapped to DOM groups.");
    }

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
  // 🔁 Step 2 Routing Toggles — Matches redem-con.html
  // --------------------------------------------------
  function setupRoutingToggles(root) {
    const groups = [
      { id: "directStop", type: "direct" },
      { id: "multiConn", type: "multi" },
      { id: "posFlight", type: "positioning" }
    ];
  
    // utility: update active state
    const setActive = (group, value) => {
      const buttons = group.querySelectorAll("button");
      buttons.forEach(btn => {
        const isActive = btn.dataset.val === value;
        btn.classList.toggle("active", isActive);
      });
    };
  
    groups.forEach(({ id, type }) => {
      const group = root.querySelector(`#${id}`);
      if (!group) {
        console.warn(`⚠️ Routing group #${id} not found in DOM.`);
        return;
      }
  
      const [yesBtn, noBtn] = group.querySelectorAll("button");
  
      if (yesBtn && noBtn) {
        yesBtn.addEventListener("click", () => {
          setActive(group, "yes");
  
          // interlock rule: direct ↔ multi exclusive
          if (type === "direct") {
            const multiGroup = root.querySelector("#multiConn");
            if (multiGroup) setActive(multiGroup, "no");
          }
          if (type === "multi") {
            const directGroup = root.querySelector("#directStop");
            if (directGroup) setActive(directGroup, "no");
          }
  
          console.log(`✈️ ${type} set to YES`);
        });
  
        noBtn.addEventListener("click", () => {
        setActive(group, "no");
            console.log(`✈️ ${type} set to NO`);
          });
        }
      });
    
    console.log("🔁 Routing toggles initialized and mapped to DOM groups.");
  } // closes setupRoutingToggles(root)
})(); // closes entire IIFE


