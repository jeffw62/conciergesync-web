  /**
   * ConciergeSync™ Redemption Module Logic
   * Handles IATA autocomplete, routing logic, flex-days, and search-button activation.
   * Designed for console injection (headless workspace).
   */
  
  let searchButton; // GLOBAL required by updateButtonState()
  
  (function initRedemptionModule() {
    console.group("Initializing Redemption Module");
  
    const root = document; // injected workspace root
  
    // Bind globals
    searchButton = root.querySelector("#searchBtn");
  
    const originInput = root.querySelector("#origin");
    const destinationInput = root.querySelector("#destination");
  
    // --- Ensure required elements exist ---
    if (!originInput || !destinationInput || !searchButton) {
      console.warn("Redemption module: key inputs not found yet.");
      console.groupEnd();
      return;
    }
  
    console.log("🔧 Core inputs loaded:", {
      originInput,
      destinationInput,
      searchButton
    });
  
    // Initialize routing rules ON LOAD
    applyRoutingRules();
    updateButtonState(root);
  
    console.log("🚀 Redemption module initialized");
    console.groupEnd();
  })();

  /* ============================================================
     IATA Autocomplete (local dataset, expandable)
  ============================================================ */
  async function setupIataAutocomplete(ctx = root) {
    const iataInputs = ctx.querySelectorAll("input[data-iata]");
    if (!iataInputs.length) return console.warn("No IATA inputs found.");
  
    let IATA_AIRPORTS = [];
  
    async function loadIataData() {
      try {
        const res = await fetch("/dev/asset/iata-icao.json", { cache: "no-store" });
        IATA_AIRPORTS = await res.json();
        console.log("🌎 Loaded IATA dataset:", IATA_AIRPORTS.length, "airports");
      } catch (err) {
        console.error("❌ Failed to load IATA JSON:", err);
      }
    }
  
    // Load dataset before proceeding
    await loadIataData();
  
    iataInputs.forEach(input => {
      const container = input.nextElementSibling;
      if (!container || !container.classList.contains("suggestions")) {
        console.warn(`Missing suggestions container for ${input.id}`);
        return;
      }
  
      input.addEventListener("input", e => {
        const term = e.target.value.toUpperCase().trim();
        container.innerHTML = "";
  
        if (term.length < 2 || !IATA_AIRPORTS.length) return;
  
        const matches = IATA_AIRPORTS.filter(a =>
          (a.iata && a.iata.toUpperCase().includes(term)) ||
          (a.city && a.city.toUpperCase().includes(term)) ||
          (a.name && a.name.toUpperCase().includes(term))
        ).slice(0, 8);
  
        matches.forEach(a => {
          const opt = document.createElement("div");
          opt.className = "suggestion";
          opt.textContent = `${a.airport} (${a.iata})`;
  
          opt.addEventListener("click", () => {
            input.value = a.iata;
            container.innerHTML = "";
            input.dispatchEvent(new Event("change"));
            updateButtonState(root);
            input.blur();
          });
  
          container.appendChild(opt);
        });
      });
  
      document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !container.contains(e.target)) {
          container.innerHTML = "";
        }
      });
    });
  
    console.log("IATA autocomplete active");
  }

  // ============================================================
  // ConciergeSync™ Routing Logic
  // Direct / Multi / Positioning Ruleset
  // CCT: Clarity • Clean • True
  // ============================================================
  
  // Dynamically pull fresh toggle groups (injected DOM)
  function getToggleGroups() {
    return {
      directGroup: document.querySelector("#directStop"),
      multiGroup:  document.querySelector("#multiConn"),
      posGroup:    document.querySelector("#posFlight"),
    };
  }
  
  // ============================================================
  // BASIC HELPERS
  // ============================================================
  function setToggle(group, value) {
    const yesBtn = group.querySelector("button[data-val='yes']");
    const noBtn  = group.querySelector("button[data-val='no']");
  
    if (value === "yes") {
      yesBtn.classList.add("active");
      noBtn.classList.remove("active");
    } else {
      noBtn.classList.add("active");
      yesBtn.classList.remove("active");
    }
  }
  
  function lockToggle(group, locked) {
    if (locked) {
      group.classList.add("disabled-toggle");
    } else {
      group.classList.remove("disabled-toggle");
    }
  }
  
  // ============================================================
  // MASTER RULE ENGINE
  // ============================================================
  function applyRoutingRules() {
    const { directGroup, multiGroup, posGroup } = getToggleGroups();
  
    const directVal = directGroup.querySelector(".active").dataset.val;
    const multiVal  = multiGroup.querySelector(".active").dataset.val;
  
    // ---------- RULESET 1: Direct = YES ----------
    if (directVal === "yes") {
      setToggle(multiGroup, "no");
      setToggle(posGroup, "no");
  
      lockToggle(posGroup, true);     // pos locked
      lockToggle(multiGroup, false);  // multi stays clickable
  
      return;
    }
  
    // ---------- RULESET 2: Multi = YES ----------
    if (multiVal === "yes") {
      setToggle(directGroup, "no");
  
      lockToggle(posGroup, false);    // pos unlocked
      return;
    }
  
    // ---------- RULESET 3: Neutral (Direct=NO & Multi=NO) ----------
    setToggle(posGroup, "no");
    lockToggle(posGroup, true);
  }
  
  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  (function bindRoutingListeners() {
    const { directGroup, multiGroup, posGroup } = getToggleGroups();
  
    [directGroup, multiGroup, posGroup].forEach(group => {
      const yesBtn = group.querySelector("button[data-val='yes']");
      const noBtn  = group.querySelector("button[data-val='no']");
  
      yesBtn.addEventListener("click", () => {
        yesBtn.classList.add("active");
        noBtn.classList.remove("active");
        applyRoutingRules();
        updateButtonState(document);
      });
  
      noBtn.addEventListener("click", () => {
        noBtn.classList.add("active");
        yesBtn.classList.remove("active");
        applyRoutingRules();
        updateButtonState(document);
      });
    });
  })();
  
  // ============================================================
  // INITIAL STATE
  // ============================================================
  (function initRoutingState() {
    const { directGroup, multiGroup, posGroup } = getToggleGroups();
  
    setToggle(directGroup, "no");
    setToggle(multiGroup, "no");
    setToggle(posGroup, "no");
    lockToggle(posGroup, true);
  
    applyRoutingRules();
  })();

  /* ============================================================
     Flex-Day Logic
  ============================================================ */
  function setupFlexDaysLogic(ctx = root) {
    const exactBtn = ctx.querySelector("#exactBtn");
    const flexBtn  = ctx.querySelector("#flexBtn");
    if (!exactBtn || !flexBtn) return;

    [exactBtn, flexBtn].forEach(btn => {
      btn.addEventListener("click", () => {
        exactBtn.classList.remove("active");
        flexBtn.classList.remove("active");
        btn.classList.add("active");
  
        const modeInput = ctx.querySelector("#mode");
        const flexPicker = ctx.querySelector("#flexPicker");
        
        if (btn === exactBtn) {
          modeInput.value = "exact";
          flexPicker.style.display = "none";
        }
  
        if (btn === flexBtn) {
          modeInput.value = "flex";
          flexPicker.style.display = "block";
        }
  
        updateButtonState(ctx);
      });
    });

    const flexSelect = ctx.querySelector("#flexDays");
    if (flexSelect) {
      flexSelect.addEventListener("change", () => updateButtonState(ctx));
    }
    console.log("Flex-day logic active");
  }

  /* ============================================================
     Button State Logic
  ============================================================ */
  function updateButtonState(ctx = root) {
    const searchWarning = ctx.querySelector("#searchWarning");
    console.log("🔍 updateButtonState root:", ctx, "searchButton:", searchButton);
    
    const origin = ctx.querySelector("#origin")?.value.trim();
    const destination = ctx.querySelector("#destination")?.value.trim();
    const depart = ctx.querySelector("#departDate")?.value.trim();
    const direct = ctx.querySelector("#directStop button.active")?.dataset.val;
    const multi  = ctx.querySelector("#multiConn button.active")?.dataset.val;
    const pos    = ctx.querySelector("#posFlight button.active")?.dataset.val;
    const mode = ctx.querySelector("#mode")?.value;

    if (!["exact", "flex"].includes(mode)) {
      searchButton.disabled = true;
      return;
    }

    const serviceClass = ctx.querySelector("#serviceClass")?.value;
    const passengers = ctx.querySelector("#passengers")?.value;
    
    if (mode === "flex") {
      const flexDaysVal = ctx.querySelector("#flexDays")?.value;
      if (!flexDaysVal) {
        searchButton.disabled = true;
        return;
      }
    }

    const ready =
      origin &&
      destination &&
      depart &&
      serviceClass &&
      passengers &&
      (direct === "yes" || multi === "yes") &&
      (!(multi === "yes") || pos) &&
      (mode === "exact" || (mode === "flex" && ctx.querySelector("#flexDays")?.value));

    searchButton.disabled = !ready;
    if (searchWarning) {
      searchWarning.style.opacity = ready ? "0" : "1";
    }
    console.log(`Search button ${ready ? "ENABLED" : "disabled"}`);
  }

  /* ============================================================
     Initialize all submodules
  ============================================================ */
  setupIataAutocomplete(root);
  setupFlexDaysLogic(root);
  updateButtonState(root);

  /* ============================================================
     Fallback Safety Timer (handles async injection delays)
  ============================================================ */
  setTimeout(() => {
    updateButtonState(root);
    console.log("Fallback recheck complete.");
  }, 1500);

  /* ============================================================
   Search Button Click Handler
  ============================================================ */
  searchButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  
    console.log("🔎 Search button clicked — collecting form data...");
  
    const payload = {
      origin: root.querySelector("#origin")?.value.trim(),
      destination: root.querySelector("#destination")?.value.trim(),
      departDate: root.querySelector("#departDate")?.value,
      returnDate: root.querySelector("#returnDate")?.value,
      passengers: root.querySelector("#passengers")?.value,
      serviceClass: root.querySelector("#serviceClass")?.value,
      allowBudget: root.querySelector("#allowBudget")?.checked,
      partnerSpace: root.querySelector("#partnerSpace")?.checked,
      program: root.querySelector("#program")?.value,
      direct: root.querySelector("#directStop button.active")?.dataset.val,
      multi: root.querySelector("#multiConn button.active")?.dataset.val,
      pos: root.querySelector("#posFlight button.active")?.dataset.val,
      mode: root.querySelector("#mode")?.value,
      flexDays: root.querySelector("#flexDays")?.value || null
    };
  
    console.log("📦 Search payload:", payload);
  
    const overlay = root.querySelector("#spinner-overlay");
    if (overlay) overlay.style.display = "flex";
  
    setTimeout(() => {
      console.log("🎉 Payload ready — backend call goes here.");
      overlay.style.display = "none";
    }, 1500);
  });
  
  console.log("Redemption module fully initialized");
  console.groupEnd();

// === ConciergeSync™ Redem-Con Initialization Bridge ===
(function attachRedemConHook() {
  // Ensure listener is attached only once
  if (window._redemConAttached) return;
  window._redemConAttached = true;

  // Attach listener
  document.addEventListener("module:ready", (e) => {
    console.log("redem-con.js listening for module:ready", e.detail);
    if (e.detail?.page !== "redem-con") return;

    console.group("Initializing Redemption Module");
      try {
        const ws = e.detail.workspace || document;
      
        setupIataAutocomplete?.(ws);
        console.log("IATA autocomplete initialized");
      
        setupToggleLogic?.(ws);
        console.log("Toggle logic active");
      
        setupFlexDaysLogic?.(ws);
        console.log("Flex-days logic active");
      
        updateButtonState?.(ws);
        console.log("Button-state logic re-evaluated");
      
        console.groupEnd();
        console.log("Redemption module fully initialized");
      } catch (err) {
        console.error("Error initializing Redemption Module:", err);
        console.groupEnd();
      }
      });
      })(); // ← Closes attachRedemConHook IIFE
