/**
 * ConciergeSync™ Redemption Module Logic
 * Fixed & Cleaned – November 2025
 */

let searchButton; // GLOBAL required by updateButtonState()

const root = document;

// ========================================================
// 1. Main Initialization IIFE
// ========================================================
(function initRedemptionModule() {
  console.group("Initializing Redemption Module");

  searchButton = root.querySelector("#searchBtn");
  const originInput = root.querySelector("#origin");
  const destinationInput = root.querySelector("#destination");

  if (!originInput || !destinationInput || !searchButton) {
    console.warn("Redemption module: key inputs not found yet.");
    console.groupEnd();
    return;
  }

  console.log("Core inputs loaded");

  // ----- MOVE ALL CONST DECLARATIONS HERE (before any use) -----
  const directGroup = root.querySelector("#directStop");
  const multiGroup  = root.querySelector("#multiConn");
  const posGroup    = root.querySelector("#posFlight");

  // Make them available globally for other functions
  window._toggleGroups = { directGroup, multiGroup, posGroup };

  // Initialize everything
  setupIataAutocomplete(root);
  setupToggleLogic(root);
  setupFlexDaysLogic(root);
  initRoutingState();
  updateButtonState(root);

  console.log("Redemption module initialized");
  console.groupEnd();
})();

// ========================================================
// 2. IATA Autocomplete
// ========================================================
async function setupIataAutocomplete(ctx = root) {
  const iataInputs = ctx.querySelectorAll("input[data-iata]");
  if (!iataInputs.length) return console.warn("No IATA inputs found.");

  let IATA_AIRPORTS = [];

  async function loadIataData() {
    try {
      const res = await fetch("/dev/asset/iata-icao.json", { cache: "no-store" });
      IATA_AIRPORTS = await res.json();
      console.log("Loaded IATA dataset:", IATA_AIRPORTS.length, "airports");
    } catch (err) {
      console.error("Failed to load IATA JSON:", err);
    }
  }

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

      const matches = IATA_AIRPORTS
        .filter(a => 
          (a.iata && a.iata.includes(term)) ||
          (a.city && a.city.toUpperCase().includes(term)) ||
          (a.name && a.name.toUpperCase().includes(term))
        )
        .slice(0, 8);

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

    document.addEventListener("click", e => {
      if (!input.contains(e.target) && !container.contains(e.target)) {
        container.innerHTML = "";
      }
    });
  });

  console.log("IATA autocomplete active");
}

// ========================================================
// 3. Toggle Groups Logic (Direct / Multi / Positioning)
// ========================================================
function setupToggleLogic(ctx = root) {
  const { directGroup, multiGroup, posGroup } = window._toggleGroups;

  if (!directGroup || !multiGroup || !posGroup) {
    console.warn("Toggle groups not found");
    return;
  }

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
    group.classList.toggle("disabled-toggle", locked);
  }

  window.applyRoutingRules = function() {
    const directVal = directGroup.querySelector(".active")?.dataset.val || "no";
    const multiVal  = multiGroup.querySelector(".active")?.dataset.val  || "no";

    if (directVal === "yes") {
      setToggle(multiGroup, "no");
      setToggle(posGroup, "no");
      lockToggle(posGroup, true);
      lockToggle(multiGroup, false);
    }
    else if (multiVal === "yes") {
      setToggle(directGroup, "no");
      lockToggle(posGroup, false);
    }
    else {
      // Neutral state
      setToggle(posGroup, "no");
      lockToggle(posGroup, true);
    }

    updateButtonState(root);
  };

  // Attach click handlers to all toggle buttons
  [directGroup, multiGroup, posGroup].forEach(group => {
    group.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        setToggle(group, btn.dataset.val);
        window.applyRoutingRules();
      });
    });
  });

  console.log("Toggle logic active");
}

// ========================================================
// 4. Initial Routing State
// ========================================================
function initRoutingState() {
  const { directGroup, multiGroup, posGroup } = window._toggleGroups;

  setToggle(directGroup, "no");
  setToggle(multiGroup,  "no");
  setToggle(posGroup,    "no");
  lockToggle(posGroup, true);

  window.applyRoutingRules();
}

// ========================================================
// 5. Flex-Day Logic
// ========================================================
function setupFlexDaysLogic(ctx = root) {
  const exactBtn = ctx.querySelector("#exactBtn");
  const flexBtn  = ctx.querySelector("#flexBtn");
  if (!exactBtn || !flexBtn) return;

  [exactBtn, flexBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      exactBtn.classList.remove("active");
      flexBtn.classList.remove("active");
      btn.classList.add("active");

      const modeInput    = ctx.querySelector("#mode");
      const flexPicker   = ctx.querySelector("#flexPicker");

      if (btn === exactBtn) {
        modeInput.value = "exact";
        flexPicker.style.display = "none";
      } else {
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

// ========================================================
// 6. Button State Logic
// ========================================================
function updateButtonState(ctx = root) {
  if (!searchButton) return;

  const origin      = ctx.querySelector("#origin")?.value.trim();
  const destination = ctx.querySelector("#destination")?.value.trim();
  const depart      = ctx.querySelector("#departDate")?.value.trim();
  const mode        = ctx.querySelector("#mode")?.value;
  const serviceClass = ctx.querySelector("#serviceClass")?.value;
  const passengers  = ctx.querySelector("#passengers")?.value;

  const directVal   = ctx.querySelector("#directStop .active")?.dataset.val;
  const multiVal    = ctx.querySelector("#multiConn .active")?.dataset.val;
  const posVal      = ctx.querySelector("#posFlight .active")?.dataset.val;

  let ready = Boolean(
    origin && destination && depart && serviceClass && passengers &&
    (directVal === "yes" || multiVal === "yes") &&
    (multiVal !== "yes" || posVal)
  );

  if (mode === "flex") {
    const flexDays = ctx.querySelector("#flexDays")?.value;
    ready = ready && Boolean(flexDays);
  }

  searchButton.disabled = !ready;

  const warning = ctx.querySelector all("#searchWarning");
  if (warning) warning.style.opacity = ready ? "0" : "1";

  console.log(`Search button ${ready ? "ENABLED" : "DISABLED"}`);
}

// ========================================================
// 7. Search Button Handler
// ========================================================
if (searchButton) {
  searchButton.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Search button clicked");

    const payload = {
      origin:         root.querySelector("#origin")?.value.trim(),
      destination:    root.querySelector("#destination")?.value.trim(),
      departDate:     root.querySelector("#departDate")?.value,
      returnDate:     root.querySelector("#returnDate")?.value || null,
      passengers:     root.querySelector("#passengers")?.value,
      serviceClass:   root.querySelector("#serviceClass")?.value,
      allowBudget:    root.querySelector("#allowBudget")?.checked,
      partnerSpace:   root.querySelector("#partnerSpace")?.checked,
      program:        root.querySelector("#program")?.value,
      direct:         root.querySelector("#directStop .active")?.dataset.val,
      multi:          root.querySelector("#multiConn .active")?.dataset.val,
      pos:            root.querySelector("#posFlight .active")?.dataset.val,
      mode:           root.querySelector("#mode")?.value,
      flexDays:       root.querySelector("#flexDays")?.value || null
    };

    console.log("Search payload:", payload);

    const overlay = root.querySelector("#spinner-overlay");
    if (overlay) overlay.style.display = "flex";

    setTimeout(() => {
      if (overlay) overlay.style.display = "none";
      console.log("Payload ready – send to backend here");
    }, 1500);
  });
}

// ========================================================
// 8. Optional: module:ready bridge (kept for compatibility)
// ========================================================
(function attachRedemConHook() {
  if (window._redemConAttached) return;
  window._redemConAttached = true;

  document.addEventListener("module:ready", e => {
    if (e.detail?.page !== "redem-con") return;
    console.group("Re-initializing via module:ready");
    const ws = e.detail.workspace || document;
    setupIataAutocomplete(ws);
    setupToggleLogic(ws);
    setupFlexDaysLogic(ws);
    updateButtonState(ws);
    console.groupEnd();
  });
})();
