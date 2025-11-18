// ========================================================================
//  ConciergeSync™  —  REDEMPTION MODULE (CCT CLEAN REBUILD — FAULT-TOLERANT)
//  Works with module:ready, late-load, early-load, or missing-event injection
// ========================================================================

(function () {

  // -----------------------------
  // MASTER INITIALIZER
  // -----------------------------
  function init(root) {
    if (!root) return;
    if (root.__redemInitialized) return; // avoid duplicate bootstraps
    root.__redemInitialized = true;

    // ------- ELEMENT GETTERS -------
    const origin        = root.querySelector("#origin");
    const destination   = root.querySelector("#destination");
    const departDate    = root.querySelector("#departDate");
    const returnDate    = root.querySelector("#returnDate");
    const passengers    = root.querySelector("#passengers");
    const serviceClass  = root.querySelector("#serviceClass");
    const allowBudget   = root.querySelector("#allowBudget");
    const partnerSpace  = root.querySelector("#partnerSpace");
    const program       = root.querySelector("#program");
    const modeField     = root.querySelector("#mode");
    const flexDays      = root.querySelector("#flexDays");

    const exactBtn      = root.querySelector("#exactBtn");
    const flexBtn       = root.querySelector("#flexBtn");
    const flexPicker    = root.querySelector("#flexPicker");

    const directGroup   = root.querySelector("#directStop");
    const multiGroup    = root.querySelector("#multiConn");
    const posGroup      = root.querySelector("#posFlight");
    const posWarning    = root.querySelector("#posWarning");

    const searchBtn     = root.querySelector("#searchBtn");
    const searchWarning = root.querySelector("#searchWarning");

    const spinner       = root.querySelector("#spinner-overlay");

    if (!origin) return; // safety

    flexPicker.style.display = "none";

    // ============================================================
    // BUTTON GROUP HELPERS
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
    // ROUTING LOGIC — FINAL MATRIX
    // ============================================================
    function applyRoutingRules() {
      const direct = getVal(directGroup);
      const multi  = getVal(multiGroup);

      // ---- DIRECT = YES → everything else locked NO ----
      if (direct === "yes") {
        setActive(multiGroup, "no");
        disableGroup(multiGroup);

        setActive(posGroup, "no");
        disableGroup(posGroup);

        return;
      }

      // ---- MULTI = YES → pos active, direct locked NO ----
      if (multi === "yes") {
        setActive(directGroup, "no");
        disableGroup(directGroup);

        enableGroup(posGroup);
        // positioning starts NO, user may toggle to YES
        return;
      }

      // ---- BOTH NO → pos locked NO ----
      enableGroup(directGroup);
      enableGroup(multiGroup);

      setActive(posGroup, "no");
      disableGroup(posGroup);
    }

    // ============================================================
    // BUTTON GROUP LISTENERS
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
    // EXACT / FLEX MODE
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
    // READINESS CHECK
    // ============================================================
    function validateReady() {
      const o = origin.value.trim();
      const d = destination.value.trim();
      const dd = departDate.value.trim();
      const sc = serviceClass.value.trim();
      const pax = passengers.value.trim();
      const direct = getVal(directGroup);
      const multi  = getVal(multiGroup);
      const mode   = modeField.value;

      const hasRouting = (direct === "yes" || multi === "yes");

      if (mode === "flex" && !flexDays.value) {
        searchBtn.disabled = true;
        searchWarning.style.display = "block";
        return;
      }

      if (!o || !d || !dd || !sc || !pax || !hasRouting) {
        searchBtn.disabled = true;
        searchWarning.style.display = "block";
        return;
      }

      if (multi === "yes") {
        enableGroup(posGroup);
      }

      searchBtn.disabled = false;
      searchWarning.style.display = "none";
    }

    [origin, destination, departDate, passengers, serviceClass, program, flexDays]
      .forEach(el => el?.addEventListener("input", validateReady));

    returnDate?.addEventListener("change", validateReady);

    // ============================================================
    // PAYLOAD BUILDER
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
    // SEARCH HANDLER
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

        sessionStorage.setItem("latestRedemptionResults", JSON.stringify(data));

        document.dispatchEvent(new CustomEvent("workspace:navigate", {
          detail: { target: "redemption-results" }
        }));

      } catch (err) {
        console.error("❌ Search Error:", err);
        spinner.style.display = "none";
      }
    });

    // ============================================================
    // INIT
    // ============================================================
    applyRoutingRules();
    validateReady();
  }

  // =====================================================================
  // LISTEN FOR module:ready OR SELF-FIND ROOT IF EVENT MISSES
  // =====================================================================

  // CASE 1: console fires module:ready (normal)
  document.addEventListener("module:ready", (ev) => {
    const root =
      ev.detail?.root ||
      ev.detail?.element ||
      document.querySelector(".redem-con");

    if (root) init(root);
  });

  // CASE 2: module injected BEFORE script loaded (fallback)
  window.addEventListener("DOMContentLoaded", () => {
    const lateRoot = document.querySelector(".redem-con");
    if (lateRoot) init(lateRoot);
  });

})();
