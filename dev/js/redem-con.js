// ============================================================
//  ConciergeSync™  —  REDEMPTION MODULE (CCT CLEAN REBUILD)
//  Fully headless, injection-safe, no globals, no leakage
// ============================================================

document.addEventListener("module:ready", (ev) => {
  const ctx = ev.detail?.root;
  if (!ctx) return;

  // ------- ELEMENT GETTERS -------
  const origin        = ctx.querySelector("#origin");
  const destination   = ctx.querySelector("#destination");
  const departDate    = ctx.querySelector("#departDate");
  const returnDate    = ctx.querySelector("#returnDate");
  const passengers    = ctx.querySelector("#passengers");
  const serviceClass  = ctx.querySelector("#serviceClass");
  const allowBudget   = ctx.querySelector("#allowBudget");
  const partnerSpace  = ctx.querySelector("#partnerSpace");
  const program       = ctx.querySelector("#program");
  const modeField     = ctx.querySelector("#mode");
  const flexDays      = ctx.querySelector("#flexDays");

  const exactBtn      = ctx.querySelector("#exactBtn");
  const flexBtn       = ctx.querySelector("#flexBtn");
  const flexPicker    = ctx.querySelector("#flexPicker");

  const directGroup   = ctx.querySelector("#directStop");
  const multiGroup    = ctx.querySelector("#multiConn");
  const posGroup      = ctx.querySelector("#posFlight");
  const posWarning    = ctx.querySelector("#posWarning");

  const searchBtn     = ctx.querySelector("#searchBtn");
  const searchWarning = ctx.querySelector("#searchWarning");

  const spinner       = ctx.querySelector("#spinner-overlay");

  // Hide flex picker initially
  flexPicker.style.display = "none";

  // ============================================================
  //  BUTTON GROUP HELPER
  // ============================================================
  function setActive(group, val) {
    const btns = group.querySelectorAll("button");
    btns.forEach(b => {
      if (b.dataset.val === val) b.classList.add("active");
      else b.classList.remove("active");
    });
  }

  function getVal(group) {
    return group.querySelector("button.active")?.dataset.val || "no";
  }

  function disableGroup(group) {
    group.classList.add("disabled");
    group.querySelectorAll("button").forEach(b => b.disabled = true);
  }

  function enableGroup(group) {
    group.classList.remove("disabled");
    group.querySelectorAll("button").forEach(b => b.disabled = false);
  }

  // ============================================================
  //  ROUTING LOGIC — EXACT SPEC YOU APPROVED
  // ============================================================
  function applyRoutingRules() {
    const direct = getVal(directGroup);
    const multi  = getVal(multiGroup);

    // ---- CASE 1: DIRECT = YES ----
    if (direct === "yes") {
      setActive(multiGroup, "no");
      disableGroup(multiGroup);

      setActive(posGroup, "no");
      disableGroup(posGroup);

      return;
    }

    // ---- CASE 2: MULTI = YES ----
    if (multi === "yes") {
      setActive(directGroup, "no");
      disableGroup(directGroup);

      // pos active, starts NO, user may toggle
      enableGroup(posGroup);

      return;
    }

    // ---- CASE 3: BOTH DIRECT NO + MULTI NO ----
    enableGroup(directGroup);
    enableGroup(multiGroup);

    // pos locked NO
    setActive(posGroup, "no");
    disableGroup(posGroup);
  }

  // ============================================================
  //  GROUP BUTTON LISTENERS
  // ============================================================
  function attachToggleBehavior(group, onChange) {
    group.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        setActive(group, btn.dataset.val);
        onChange();
      });
    });
  }

  attachToggleBehavior(directGroup, () => {
    applyRoutingRules();
    validateReady();
  });

  attachToggleBehavior(multiGroup, () => {
    applyRoutingRules();
    validateReady();
  });

  attachToggleBehavior(posGroup, () => {
    validateReady();
  });

  // ============================================================
  //  DATE MODE TOGGLES (Exact / Flex)
  // ============================================================
  exactBtn.addEventListener("click", () => {
    modeField.value = "exact";
    exactBtn.classList.add("active");
    flexBtn.classList.remove("active");
    flexPicker.style.display = "none";
    validateReady();
  });

  flexBtn.addEventListener("click", () => {
    modeField.value = "flex";
    flexBtn.classList.add("active");
    exactBtn.classList.remove("active");
    flexPicker.style.display = "block";
    validateReady();
  });

  // ============================================================
  //  READINESS CHECK
  // ============================================================
  function validateReady() {
    const o = origin.value.trim();
    const d = destination.value.trim();
    const dd = departDate.value.trim();
    const sc = serviceClass.value.trim();
    const pax = passengers.value.trim();

    const direct = getVal(directGroup);
    const multi  = getVal(multiGroup);
    const pos    = getVal(posGroup);
    const mode   = modeField.value;

    // Must have at least one routing YES
    const hasRouting = (direct === "yes" || multi === "yes");

    // Flex requires range
    if (mode === "flex" && !flexDays.value) {
      searchBtn.disabled = true;
      searchWarning.style.display = "block";
      return;
    }

    // Must fill core fields
    if (!o || !d || !dd || !sc || !pax || !hasRouting) {
      searchBtn.disabled = true;
      searchWarning.style.display = "block";
      return;
    }

    // Multi=yes requires pos be available (but user may choose yes/no)
    // (Your logic does NOT force pos=yes, only that the group is ACTIVE)
    if (multi === "yes") {
      enableGroup(posGroup);
    }

    searchBtn.disabled = false;
    searchWarning.style.display = "none";
  }

  // Attach validation to all input fields
  [origin, destination, departDate, passengers, serviceClass, program, flexDays]
    .forEach(el => el?.addEventListener("input", validateReady));

  returnDate?.addEventListener("change", validateReady);


  // ============================================================
  //  BUILD PAYLOAD
  // ============================================================
  function buildPayload() {
    return {
      origin:        origin.value.trim(),
      destination:   destination.value.trim(),
      departDate:    departDate.value.trim(),
      returnDate:    returnDate.value.trim() || null,
      passengers:    passengers.value.trim(),
      serviceClass:  serviceClass.value,
      allowBudget:   allowBudget.checked,
      partnerSpace:  partnerSpace.checked,
      program:       program.value,

      direct:        getVal(directGroup),
      multi:         getVal(multiGroup),
      pos:           getVal(posGroup),

      mode:          modeField.value,
      flexDays:      flexDays.value || null
    };
  }

  // ============================================================
  //  SEARCH BUTTON
  // ============================================================
  searchBtn.addEventListener("click", async () => {
    if (searchBtn.disabled) return;

    const payload = buildPayload();
    console.log("🔍 FLIGHT SEARCH PAYLOAD:", payload);

    spinner.style.display = "flex";

    try {
      const res = await fetch("/api/redemption/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      spinner.style.display = "none";

      // Store results
      sessionStorage.setItem("latestRedemptionResults", JSON.stringify(data));

      // Trigger workspace navigation
      document.dispatchEvent(new CustomEvent("workspace:navigate", {
        detail: { target: "redemption-results" }
      }));

    } catch (err) {
      console.error("❌ Search Error:", err);
      spinner.style.display = "none";
    }
  });

  // ============================================================
  //  INITIALIZE
  // ============================================================
  applyRoutingRules();
  validateReady();
});
