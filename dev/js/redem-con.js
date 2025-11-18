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

  // cache button globally for updateButtonState()
  searchButton = root.querySelector("#searchBtn");

  if (!root.querySelector("#origin") ||
      !root.querySelector("#destination") ||
      !searchButton) {
    console.warn("Redemption module: key inputs not found yet.");
    console.groupEnd();
    return;
  }

  // ----- submodules -----
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

    input.addEventListener("input", e => {
      const term = e.target.value.toUpperCase().trim();
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
        div.textContent = `${a.airport} (${a.iata})`;
        div.addEventListener("click", () => {
          input.value = a.iata;
          list.innerHTML = "";
          updateButtonState(ctx);
          input.blur();
        });
        list.appendChild(div);
      });
    });

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

/* Basic helpers */
function setToggle(group, val) {
  const yes = group.querySelector("button[data-val='yes']");
  const no  = group.querySelector("button[data-val='no']");
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

/* MASTER RULE ENGINE */
function applyRoutingRules(ctx, lastClickedGroup) {
  const directVal = directGroup.querySelector(".active")?.dataset.val || "no";
  const multiVal  = multiGroup.querySelector(".active")?.dataset.val  || "no";

  /* ------------------------------------------------------------------
     RULE: If the user clicked DIRECT
     ------------------------------------------------------------------*/
  if (lastClickedGroup === directGroup && directVal === "yes") {
    // Direct YES → force Multi NO (but do NOT lock)
    setToggle(multiGroup, "no");

    // Positioning always locked when Direct is YES
    setToggle(posGroup, "no");
    lockToggle(posGroup, true);

    updateButtonState(ctx);
    return;
  }

  /* ============================================================
   CCT ROUTING ENGINE (Option A — Cleanest, Most Predictable)
   ============================================================ */
   function applyRoutingRules(ctx, lastClickedGroup) {
     const directVal = directGroup.querySelector(".active")?.dataset.val || "no";
     const multiVal  = multiGroup.querySelector(".active")?.dataset.val  || "no";
   
     /* --------------------------------------------------------------
        1) MULTI CLICKED
        --------------------------------------------------------------*/
     if (lastClickedGroup === multiGroup && multiVal === "yes") {
       // Multi YES → Direct auto-set to NO
       setToggle(directGroup, "no");
   
       // Positioning only allowed in Multi YES
       lockToggle(posGroup, false);
   
       updateButtonState(ctx);
       return;
     }
   
     /* --------------------------------------------------------------
        2) DIRECT CLICKED
        --------------------------------------------------------------*/
     if (lastClickedGroup === directGroup && directVal === "yes") {
       // Direct YES → Multi forced NO
       setToggle(multiGroup, "no");
   
       // Positioning locked OFF
       setToggle(posGroup, "no");
       lockToggle(posGroup, true);
   
       updateButtonState(ctx);
       return;
     }
   
     /* --------------------------------------------------------------
        3) GENERAL STATE — SAFETY NET
        --------------------------------------------------------------*/
     // Both NO → Neutral
     if (directVal === "no" && multiVal === "no") {
       setToggle(posGroup, "no");
       lockToggle(posGroup, true);
     }
   
     // Direct YES (fallback)
     if (directVal === "yes") {
       setToggle(multiGroup, "no");
       setToggle(posGroup, "no");
       lockToggle(posGroup, true);
     }
   
     // Multi YES (fallback)
     if (multiVal === "yes") {
       setToggle(directGroup, "no");
       lockToggle(posGroup, false);
     }
   
     updateButtonState(ctx);
   }

/* Bind click listeners */
function setupToggleLogic(ctx) {
  directGroup = ctx.querySelector("#directStop");
  multiGroup  = ctx.querySelector("#multiConn");
  posGroup    = ctx.querySelector("#posFlight");

  if (!directGroup || !multiGroup || !posGroup) {
    console.warn("Toggle groups missing. Will retry on module:ready");
    return false;
  }

  [directGroup, multiGroup, posGroup].forEach(group => {
    group.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        setToggle(group, btn.dataset.val);
        applyRoutingRules(ctx, group); // ← THE CRITICAL FIX
      });
    });
  });

  console.log("Toggle logic active");
  return true;
}

/* Initial state */
function initRoutingState(ctx) {
  if (!directGroup || !multiGroup || !posGroup) return;

  setToggle(directGroup, "no");
  setToggle(multiGroup,  "no");
  setToggle(posGroup,    "no");

  lockToggle(posGroup, true);

  applyRoutingRules(ctx);
}

/* ============================================================
   3. FLEX MODE LOGIC
============================================================ */
function setupFlexDaysLogic(ctx) {
  const exactBtn = ctx.querySelector("#exactBtn");
  const flexBtn  = ctx.querySelector("#flexBtn");
  const mode     = ctx.querySelector("#mode");
  const flexBox  = ctx.querySelector("#flexPicker");

  if (!exactBtn || !flexBtn) return;

  [exactBtn, flexBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      exactBtn.classList.remove("active");
      flexBtn.classList.remove("active");
      btn.classList.add("active");

      if (btn === exactBtn) {
        mode.value = "exact";
        flexBox.style.display = "none";
      } else {
        mode.value = "flex";
        flexBox.style.display = "block";
      }
      updateButtonState(ctx);
    });
  });

  const flexDays = ctx.querySelector("#flexDays");
  if (flexDays) {
    flexDays.addEventListener("change", () => updateButtonState(ctx));
  }

  console.log("Flex logic active");
}

/* ============================================================
   4. SEARCH BUTTON READINESS
============================================================ */
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

  // 🔥 These three must use DOM queries, nothing else
   direct: ctx.querySelector("#directStop .active")?.dataset.val || "no",
   multi:  ctx.querySelector("#multiConn .active")?.dataset.val || "no",
   pos:    ctx.querySelector("#posFlight .active")?.dataset.val || "no",
   mode:   ctx.querySelector("#mode")?.value,

  flexDays: root.querySelector("#flexDays")?.value || null
};

  searchButton.disabled = !ready;

  const warn = ctx.querySelector("#searchWarning");
  if (warn) warn.style.opacity = ready ? "0" : "1";

  console.log(`Search: ${ready ? "ENABLED" : "disabled"}`);

/* ============================================================
   5. SEARCH BUTTON HANDLER
============================================================ */
document.addEventListener("click", e => {
  if (!e.target.matches("#searchBtn")) return;

  e.preventDefault();
  e.stopPropagation();

  const ctx = document;

  const payload = {
    origin:        ctx.querySelector("#origin")?.value.trim(),
    destination:   ctx.querySelector("#destination")?.value.trim(),
    departDate:    ctx.querySelector("#departDate")?.value,
    returnDate:    ctx.querySelector("#returnDate")?.value || null,
    passengers:    ctx.querySelector("#passengers")?.value,
    serviceClass:  ctx.querySelector("#serviceClass")?.value,
    allowBudget:   ctx.querySelector("#allowBudget")?.checked,
    partnerSpace:  ctx.querySelector("#partnerSpace")?.checked,
    program:       ctx.querySelector("#program")?.value,
    direct,
    multi,
    pos,
    mode,
    flexDays:      ctx.querySelector("#flexDays")?.value || null
  };

  console.log("PAYLOAD:", payload);

  const overlay = ctx.querySelector("#spinner-overlay");
  if (overlay) overlay.style.display = "flex";

  setTimeout(() => {
    if (overlay) overlay.style.display = "none";
    console.log("Payload ready → backend");
  }, 1500);
});
