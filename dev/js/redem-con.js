/**
 * ConciergeSync™ Redemption Module Logic
 * Handles IATA autocomplete, toggle logic, flex-days, and search-button activation.
 * Designed for console injection (no <body>, no duplicate DOM roots).
 */

(function initRedemptionModule() {
  console.group("Initializing Redemption Module");

  const root = document; // workspace context (injected)
  const originInput = root.querySelector("#origin");
  const destinationInput = root.querySelector("#destination");
  const searchButton = root.querySelector("#searchBtn");

  // --- Helper: programmatically set a toggle group to yes/no ---
  function setToggleState(groupId, value) {
    const group = root.getElementById(groupId) || document.getElementById(groupId);
    if (!group) return;

    group.querySelectorAll("button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.val === value);
    });
  }

  // --- Ensure core elements exist before continuing ---
  if (!originInput || !destinationInput || !searchButton) {
    console.warn("Redemption module: key inputs not found yet.");
    console.groupEnd();
    return;
  }

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

  /* ============================================================
     Toggle Logic (Direct / Multi / Positioning)
  ============================================================ */
  function setupToggleLogic(ctx = root) {
    let posWarningTimer = null;
    
    const posWarning = ctx.querySelector("#posWarning");
    const toggles = ctx.querySelectorAll("#directStop button, #multiConn button, #posFlight button");
    toggles.forEach(btn => {
      btn.addEventListener("click", e => {
        const parent = e.target.closest("div");
        parent.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        
        // --- Show/hide Positioning warning depending on state ---
        if (parent.id === "multiConn" && e.target.dataset.val === "yes") {
          setToggleState("directStop", "no");
          root.querySelector("#posFlight")?.classList.remove("disabled-toggle");
        
          const posActive = ctx.querySelector("#posFlight button.active")?.dataset.val;
          if (!posActive) {
            clearTimeout(posWarningTimer);
            posWarningTimer = setTimeout(() => {
              posWarning.style.display = "block";
            }, 120);
          }
        }
        
        if (parent.id === "posFlight") {
          clearTimeout(posWarningTimer);
          posWarning.style.display = "none";
        }
        
        if (parent.id === "multiConn" && e.target.dataset.val === "no") {
          clearTimeout(posWarningTimer);
          posWarning.style.display = "none";
        }
        
        if (parent.id === "directStop" && e.target.dataset.val === "yes") {
          setToggleState("multiConn", "no");
          setToggleState("posFlight", "no");
          clearTimeout(posWarningTimer);
          posWarning.style.display = "none";
        }
        
        if (parent.id === "directStop" && e.target.dataset.val === "no") {
          root.querySelector("#posFlight")?.classList.remove("disabled-toggle");
        }
        
        if (parent.id === "multiConn" && e.target.dataset.val === "yes") {
          setToggleState("directStop", "no");
        }
        
        updateButtonState(ctx);
      });
    });
    console.log("Toggle logic active");
  }

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

    if (multi === "yes" && !pos) {
      searchButton.disabled = true;
      return;
    }

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

    if (direct === "no" && multi === "no") {
      searchButton.disabled = true;
      return;
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
  setupToggleLogic(root);
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
})(); // ← Correctly closes the IIFE

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
