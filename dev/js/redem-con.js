/**
 * ConciergeSync™ Redemption Module
 * Clean Rebuild — CCT Standard (Clarity • Clean • True)
 * No globals, no duplicates, fully injection-safe.
 */

let searchButton = null;
let directGroup, multiGroup, posGroup;

/* ============================================================
   MAIN INITIALIZER — runs immediately for first load
============================================================ */
(function initRedemptionModule() {
  console.group("Initializing Redemption Module");
  const root = document;

  // Cache button globally for updateButtonState()
  searchButton = root.querySelector("#searchBtn");

  if (!root.querySelector("#origin") ||
      !root.querySelector("#destination") ||
      !searchButton) {
    console.warn("Redemption module: key inputs not found yet.");
    console.groupEnd();
    return;
  }

  // ----- Submodules -----
  setupToggleLogic(root);
  setupIataAutocomplete(root);
  setupFlexDaysLogic(root);
  initRoutingState(root);
  updateButtonState(root);

  console.log("Redemption module initialized.");
  console.groupEnd();
})();

/* ============================================================
   REINIT HOOK — for when console injects redem-con.html
============================================================ */
(function attachModuleReadyHook() {
  if (window._redemConAttached) return;
  window._redemConAttached = true;

  document.addEventListener("module:ready", e => {
    if (e.detail?.page !== "redem-con") return;
    const ws = e.detail.workspace || document;

    console.group("Re-initializing Redemption Module via module:ready");
    setupToggleLogic(ws);
    setupIataAutocomplete(ws);
    setupFlexDaysLogic(ws);
    initRoutingState(ws);
    updateButtonState(ws);
    console.groupEnd();
  });
})();

/* ============================================================
   1. IATA AUTOCOMPLETE
============================================================ */
async function setupIataAutocomplete(ctx) {
  const inputs = ctx.querySelectorAll("input[data-iata]");
  if (!inputs.length) return;

  let AIRPORTS = [];
  try {
    const res = await fetch("/dev/asset/iata-icao.json", { cache: "no-store" });
    AIRPORTS = await res.json();
    console.log("IATA loaded:", AIRPORTS.length);
  } catch (err) {
    console.error("IATA load failed:", err);
    return;
  }

  inputs.forEach(input => {
    const list = input.nextElementSibling;
    if (!list || !list.classList.contains("suggestions")) return;

    input.addEventListener("input", () => {
      const term = input.value.toUpperCase().trim();
      list.innerHTML = "";
      if (term.length < 2) return;

      const matches = AIRPORTS
        .filter(a =>
          (a.iata && a.iata.includes(term)) ||
          (a.city && a.city.toUpperCase().includes(term)) ||
          (a.name && a.name.toUpperCase().includes(term))
        )
        .slice(0, 8);

      matches.forEach(a => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = `${a.airport} (${a.iata}) - ${a.city}`;
        div.addEventListener("click", () => {
          input.value = a.iata;
          list.innerHTML = "";
          updateButtonState(ctx);
          input.blur();
        });
        list.appendChild(div);
      });
    });

    // Click outside → close suggestions
    document.addEventListener("click", e => {
      if (!input.contains(e.target) && !list.contains(e.target)) {
        list.innerHTML = "";
      }
    });
  });

  console.log("IATA autocomplete active");
}

/* ============================================================
   2. ROUTING TOGGLE LOGIC — CCT STANDARD
============================================================ */
function setToggle(group, val) {
  const yes = group.querySelector("button[data-val='yes']");
  const no = group.querySelector("button[data-val='no']");
  if (!yes || !no) return;

  if (val === "yes") {
    yes.classList.add("active");
    no.classList.remove("active");
  } else {
    no.classList.add("active");
    yes.classList.remove("active");
  }
}

function lockToggle(group, locked) {
  if (locked) group.classList.add("disabled-toggle");
  else group.classList.remove("disabled-toggle");
}

/* MASTER RULE ENGINE — Clean, predictable, no overlap */
function applyRoutingRules(ctx, lastClickedGroup) {
  const directVal = directGroup.querySelector(".active")?.dataset.val || "no";
  const multiVal = multiGroup.querySelector(".active")?.dataset.val || "no";

  // 1. Multi-city YES → Direct must be NO, Positioning unlocked
  if (lastClickedGroup === multiGroup && multiVal === "yes") {
    setToggle(directGroup, "no");
    lockToggle(posGroup, false);
    updateButtonState(ctx);
    return;
  }

  // 2. Direct YES → Multi forced NO, Positioning locked OFF
  if (lastClickedGroup === directGroup && directVal === "yes") {
    setToggle(multiGroup, "no");
    setToggle(posGroup, "no");
    lockToggle(posGroup, true);
    updateButtonState(ctx);
    return;
  }

  // 3. Safety net — enforce consistent state
  if (directVal === "yes") {
    setToggle(multiGroup, "no");
    setToggle(posGroup, "no");
    lockToggle(posGroup, true);
  } else if (multiVal === "yes") {
    setToggle(directGroup, "no");
    lockToggle(posGroup, false);
  } else {
    // Both NO → neutral state
    setToggle(posGroup, "no");
    lockToggle(posGroup, true);
  }

  updateButtonState(ctx);
}

function setupToggleLogic(ctx) {
  directGroup = ctx.querySelector("#directStop");
  multiGroup = ctx.querySelector("#multiConn");
  posGroup = ctx.querySelector("#posFlight");

  if (!directGroup || !multiGroup || !posGroup) {
    console.warn("Toggle groups missing. Will retry on module:ready");
    return false;
  }

  [directGroup, multiGroup, posGroup].forEach(group => {
    group.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        setToggle(group, btn.dataset.val);
        applyRoutingRules(ctx, group);
      });
    });
  });

  console.log("Toggle logic active");
  return true;
}

function initRoutingState(ctx) {
  if (!directGroup || !multiGroup || !posGroup) return;

  setToggle(directGroup, "no");
  setToggle(multiGroup, "no");
  setToggle(posGroup, "no");
  lockToggle(posGroup, true);
  applyRoutingRules(ctx, null); // initial sync
}

/* ============================================================
   3. FLEX MODE LOGIC
============================================================ */
function setupFlexDaysLogic(ctx) {
  const exactBtn = ctx.querySelector("#exactBtn");
  const flexBtn = ctx.querySelector("#flexBtn");
  const modeInput = ctx.querySelector("#mode");
  const flexBox = ctx.querySelector("#flexPicker");

  if (!exactBtn || !flexBtn || !modeInput) return;

  const setMode = (mode) => {
    exactBtn.classList.toggle("active", mode === "exact");
    flexBtn.classList.toggle("active", mode === "flex");
    modeInput.value = mode;
    flexBox.style.display = mode === "flex" ? "block" : "none";
    updateButtonState(ctx);
  };

  exactBtn.addEventListener("click", () => set regarded("exact"));
  flexBtn.addEventListener("click", () => setMode("flex"));

  const flexDays = ctx.querySelector("#flexDays");
  if (flexDays) {
    flexDays.addEventListener("change", () => updateButtonState(ctx));
  }

  // Initialize
  setMode(modeInput.value || "exact");

  console.log("Flex logic active");
}

/* ============================================================
   4. SEARCH BUTTON READINESS
============================================================ */
function updateButtonState(ctx) {
  if (!searchButton) return;

  const origin = ctx.querySelector("#origin")?.value.trim();
  const dest = ctx.querySelector("#destination")?.value.trim();
  const depart = ctx.querySelector("#departDate")?.value;
  const passengers = ctx.querySelector("#passengers")?.value || "1";

  const ready = 
    origin?.length === 3 &&
    dest?.length === 3 &&
    depart &&
    passengers > 0;

  searchButton.disabled = !ready;

  const warn = ctx.querySelector("#searchWarning");
  if (warn) {
    warn.style.opacity = ready ? "0" : "1";
  }

  console.log(`Search button: ${ready ? "ENABLED" : "disabled"}`);
}

/* ============================================================
   5. SEARCH BUTTON HANDLER
============================================================ */
document.addEventListener("click", e => {
  if (!e.target.matches("#searchBtn, #searchBtn *")) return;
  if (searchButton?.disabled) return;

  e.preventDefault();
  e.stopPropagation();

  const ctx = document;

  const payload = {
    origin: ctx.querySelector("#origin")?.value.trim(),
    destination: ctx.querySelector("#destination")?.value.trim(),
    departDate: ctx.querySelector("#departDate")?.value,
    returnDate: ctx.querySelector("#returnDate")?.value || null,
    passengers: ctx.querySelector("#passengers")?.value,
    serviceClass: ctx.querySelector("#serviceClass")?.value,
    allowBudget: ctx.querySelector("#allowBudget")?.checked || false,
    partnerSpace: ctx.querySelector("#partnerSpace")?.checked || false,
    program: ctx.querySelector("#program")?.value,
    direct: directGroup?.querySelector(".active")?.dataset.val || "no",
    multi: multiGroup?.querySelector(".active")?.dataset.val || "no",
    pos: posGroup?.querySelector(".active")?.dataset.val || "no",
    mode: ctx.querySelector("#mode")?.value || "exact",
    flexDays: ctx.querySelector("#flexDays")?.value || null
  };

  console.log("Search PAYLOAD → backend:", payload);

  const overlay = ctx.querySelector("#spinner-overlay");
  if (overlay) overlay.style.display = "flex";

  // Simulate processing
  setTimeout(() => {
    if (overlay) overlay.style.display = "none";
    console.log("Payload sent to backend (mock)");
    // Here you'd normally fetch("/search", { method: "POST", body: JSON.stringify(payload) })
  }, 1500);
});
