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
  // 🌿 3.0 Handler Initialization
  // -----------------------------------------------
  function initializeHandlers(root) {
    const searchBtn = root.querySelector("#searchBtn");
    const searchWarning = root.querySelector("#searchWarning");
    if (!searchBtn) {
      console.warn("⚠️ Search button not found in injected panel.");
      return;
    }
  
    searchBtn.addEventListener("click", async (e) => {
      e.preventDefault();
    
      const inputs = root.querySelectorAll("input, select");
      const payload = {};
      inputs.forEach((el) => (payload[el.id] = el.value));
    
      console.log("✅ Search click captured. Payload:", payload);

      // ----------------------------------------------------------
      // 🌀 Step 3.1 — Click Debounce + Spinner Prep
      // ----------------------------------------------------------
      if (searchBtn.classList.contains("loading")) {
        console.warn("⚠️ Search already in progress. Ignoring duplicate click.");
        return;
      }
    
      // visually lock button
      searchBtn.disabled = true;
      searchBtn.classList.add("loading");
      searchBtn.innerHTML = `<span class="spinner"></span> Searching...`;
      if (searchWarning) searchWarning.style.display = "none";

    // ----------------------------------------------------------
    // 3.2 — Bridge Payload → Backend (BP→B)
    // ----------------------------------------------------------
    
    const apiEndpoint = "/api/redemption";
    console.log("🌐 Sending payload to backend:", apiEndpoint);
  
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
  
      // Persist canonical results to sessionStorage
      sessionStorage.setItem(
        "latestRedemptionResults",
        JSON.stringify(data.results || [])
      );
  
      console.log(`💾 Redemption results stored — ${data.results?.length || 0} entries`);

      
      // ✅ Redirect to results page after storing session data
      try {
        if (data && data.results && data.results.length > 0) {
          console.log("🧭 Results saved — redirecting to results page...");
          window.location.href = "/dev/redemption-results.html";
        } else {
          console.warn("⚠️ No results to redirect — empty data set.");
          alert("No results returned. Please try a different route or date.");
        }
      } catch (err) {
        console.error("❌ Redirect error:", err);
      }

      
      // 🚫 Redirect suppressed — inject results internally if workspace exists
      const workspace = document.getElementById("workspace");
      if (workspace) {
        const resModule = await fetch("/dev/redemption-results.html");
        const resHTML = await resModule.text();
        workspace.innerHTML = resHTML;
        console.log("✅ Results injected into console workspace (no redirect).");
      } else {
        console.warn("⚠️ No workspace element found — redirect skipped.");
      }

    } catch (err) {
      console.error("❌ Redemption bridge failed:", err);
  
      if (searchWarning) {
        searchWarning.textContent = "Search failed — please try again.";
        searchWarning.style.display = "block";
      }
    } finally {
      // Restore Search button state no matter what
      searchBtn.classList.remove("loading");
      searchBtn.disabled = false;
      searchBtn.textContent = "Search";
      console.log("🟢 Spinner cleared — ready for next search.");
    }
  });
  
    // -----------------------------------------------
    // 🟡 STEP 3.3 — Search Activation Logic
    // -----------------------------------------------
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
      const flexOk = root.querySelector("#exactBtn.option-btn.active, #flexBtn.option-btn.active") !== null;
      const directOk = root.querySelector("#directStop button.active") !== null;
      const multiOk = root.querySelector("#multiConn button.active") !== null;
      const posOk = root.querySelector("#posFlight button.active") !== null;
      const routingOk = directOk && multiOk && posOk;
      return originOk && destOk && dateOk && cabinOk && flexOk && routingOk;
    }
    
    function updateSearchState() {
    const ready = isFormReady();
    console.log("🔍 Validation check:", {
      origin: originInput.value.trim().toUpperCase(),
      destination: destinationInput.value.trim().toUpperCase(),
      date: departDate.value,
      cabin: cabinSelect.value,
      flexActive: root.querySelector("#exactBtn.active, #flexBtn.active"),
      directActive: root.querySelector("#directStop .active"),
      multiActive: root.querySelector("#multiConn .active"),
      posActive: root.querySelector("#posFlight .active"),
      ready
    });
  
    if (ready) {
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

  // --------------------------------------------------
  // 🌐 Dynamic Workspace Loader for Hamburger Navigation
  // --------------------------------------------------
  async function loadPage(page) {
    const workspace = document.getElementById("workspace");
    if (!workspace) return console.warn("No workspace found for dynamic load.");

    try {
      console.log(`🔄 Loading ${page}...`);

      // Smooth fade transition
      workspace.style.transition = "opacity 0.4s ease";
      workspace.style.opacity = "0";

      // Fetch and inject content
      const res = await fetch(`/dev/${page}.html`);
      const html = await res.text();

      setTimeout(() => {
        workspace.innerHTML = html;
        workspace.style.opacity = "1";
        console.log(`✅ ${page} loaded successfully.`);
      }, 400);
    } catch (err) {
      console.error(`❌ Failed to load ${page}:`, err);
    }
  }

  // Attach link listeners for hamburger nav
  document.querySelectorAll('#sideNav a[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      console.log(`📂 Navigating to: ${page}`);
      loadPage(page);
      document.getElementById('sideNav').classList.remove('open');
    });
  });
  
})(); // closes entire IIFE


