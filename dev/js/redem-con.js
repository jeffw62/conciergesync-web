/**
 * ✈️ ConciergeSync™ Redemption Module Logic
 * Handles IATA autocomplete, toggle logic, flex-days, and search-button activation.
 * Designed for console injection (no <body>, no duplicate DOM roots).
 */

(function initRedemptionModule() {
  console.group("🧩 Initializing Redemption Module");

  const root = document; // workspace context (injected)
  const originInput = root.querySelector("#origin");
  const destinationInput = root.querySelector("#destination");
  const searchButton = root.querySelector("#searchBtn");

  // --- Ensure core elements exist before continuing ---
  if (!originInput || !destinationInput || !searchButton) {
    console.warn("⚠️ Redemption module: key inputs not found yet.");
    console.groupEnd();
    return;
  }

  /* ============================================================
     IATA Autocomplete
  ============================================================ */
  function setupIataAutocomplete(ctx = root) {
    const iataInputs = ctx.querySelectorAll("input[data-iata]");
    if (!iataInputs.length) return console.warn("⚠️ No IATA inputs found.");
    iataInputs.forEach(input => {
      input.addEventListener("input", e => {
        const val = e.target.value.toUpperCase().trim();
        if (val.length >= 2) {
          console.log(`🔍 IATA lookup for: ${val}`);
          // (placeholder for API-driven suggestions)
        }
      });
    });
    console.log("✅ IATA autocomplete active");
  }

  /* ============================================================
     Toggle Logic (Direct / Multi / Positioning)
  ============================================================ */
  function setupToggleLogic(ctx = root) {
    const toggles = ctx.querySelectorAll("#directStop button, #multiConn button, #posFlight button");
    toggles.forEach(btn => {
      btn.addEventListener("click", e => {
        const parent = e.target.closest("div");
        parent.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        updateButtonState(ctx);
      });
    });
    console.log("✅ Toggle logic active");
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
        updateButtonState(ctx);
      });
    });
    console.log("✅ Flex-day logic active");
  }

  /* ============================================================
     Button State Logic
  ============================================================ */
  function updateButtonState(ctx = root) {
    const origin = ctx.querySelector("#origin")?.value.trim();
    const destination = ctx.querySelector("#destination")?.value.trim();
    const depart = ctx.querySelector("#departDate")?.value.trim();
    const direct = ctx.querySelector("#directStop button.active")?.dataset.val;
    const multi  = ctx.querySelector("#multiConn button.active")?.dataset.val;
    const pos    = ctx.querySelector("#posFlight button.active")?.dataset.val;
    const mode   = ctx.querySelector("#mode")?.value;

    const anyYes = [direct, multi, pos].includes("yes");
    const ready = origin && destination && depart && anyYes && mode;

    searchButton.disabled = !ready;
    console.log(`🔁 Search button ${ready ? "ENABLED" : "disabled"}`);
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
    console.log("🕓 Fallback recheck complete.");
  }, 1500);

  console.log("✅ Redemption module fully initialized");
  console.groupEnd();
})();
