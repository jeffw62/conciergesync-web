// ========================================================================
//  ConciergeSync™ — REDEMPTION MODULE (FINAL — FULL IATA + ROUTING + FLEX)
//  Fully headless, injection-safe, fault-tolerant initializer
//  Zero globals, zero leakage, zero spaghetti
// ========================================================================

(function () {

  // =====================================================================
  // MASTER INITIALIZER
  // =====================================================================
  function init(root) {
    if (!root) return;
    if (root.__redemInitialized) return; // prevent double load
    root.__redemInitialized = true;

    // -----------------------------
    // ELEMENT GETTERS
    // -----------------------------
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

    const searchBtn     = root.querySelector("#searchBtn");
    const searchWarning = root.querySelector("#searchWarning");

    const spinner       = root.querySelector("#spinner-overlay");

    const originSug     = root.querySelector("#origin-suggestions");
    const destSug       = root.querySelector("#destination-suggestions");

    if (!origin) return; // safety

    flexPicker.style.display = "none";

    // =====================================================================
    // IATA AUTOLOAD
    // =====================================================================
    let iataData = null;

    async function loadIATA() {
      if (iataData) return iataData;
      try {
        const res = await fetch("/dev/asset/iata-icao.json");
        iataData = await res.json();
      } catch (e) {
        console.error("IATA load error:", e);
        iataData = [];
      }
      return iataData;
    }

    function renderSuggestions(list, box) {
      box.innerHTML = "";
      if (!list.length) {
        box.style.display = "none";
        return;
      }
      list.forEach(item => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = `${item.iata} — ${item.city}, ${item.country}`;
        div.addEventListener("click", () => {
          if (box === originSug) origin.value = item.iata;
          else destination.value = item.iata;
          box.innerHTML = "";
          box.style.display = "none";
          validateReady();
        });
        box.appendChild(div);
      });
      box.style.display = "block";
    }

    async function attachIATA(input, box) {
      await loadIATA();
      input.addEventListener("input", () => {
        const q = input.value.trim().toUpperCase();
        if (!q || !iataData) {
          box.style.display = "none";
          return;
        }
        const filt = iataData.filter(a =>
          a.iata.startsWith(q) ||
          a.city.toUpperCase().includes(q)
        ).slice(0, 12);
        renderSuggestions(filt, box);
      });
      input.addEventListener("blur", () => {
        setTimeout(() => { box.style.display = "none"; }, 150);
      });
    }

    attachIATA(origin, originSug);
    attachIATA(destination, destSug);

    // =====================================================================
    // BUTTON GROUP HELPERS
    // =====================================================================
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

    // =====================================================================
    // ROUTING LOGIC — FINAL MATRIX
    // =====================================================================
    function applyRoutingRules() {
      const direct = getVal(directGroup);
      const multi  = getVal(multiGroup);

      // ---- DIRECT = YES ----
      if (direct === "yes") {
        setActive(multiGroup, "no");
        disableGroup(multiGroup);

        setActive(posGroup, "no");
        disableGroup(posGroup);
        return;
      }

      // ---- MULTI = YES ----
      if (multi === "yes") {
        setActive(directGroup, "no");
        disableGroup(directGroup);

        // pos active but starting NO
        enableGroup(posGroup);
        return;
      }

      // ---- BOTH NO ----
      enableGroup(directGroup);
      enableGroup(multiGroup);

      setActive(posGroup, "no");
      disableGroup(posGroup);
    }

    // =====================================================================
    // GROUP TOGGLE LISTENERS
    // =====================================================================
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

    // =====================================================================
    // EXACT / FLEX
    // =====================================================================
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

    // =====================================================================
    // READINESS VALIDATOR
    // =====================================================================
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

      // multi=yes → pos available
      if (multi === "yes") enableGroup(posGroup);

      searchBtn.disabled = false;
      searchWarning.style.display = "none";
    }

    [
      origin, destination, departDate, passengers,
      serviceClass, program, flexDays
    ].forEach(el => el?.addEventListener("input", validateReady));

    returnDate?.addEventListener("change", validateReady);

    // =====================================================================
    // SEARCH PAYLOAD
    // =====================================================================
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

    // =====================================================================
    // SEARCH EXECUTION
    // =====================================================================
    searchBtn.addEventListener("click", async () => {
      if (searchBtn.disabled) return;

      const payload = buildPayload();
      console.log("🔍 SEARCH PAYLOAD:", payload);

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

    // =====================================================================
    // INIT
    // =====================================================================
    applyRoutingRules();
    validateReady();
  }

  // =====================================================================
  // DYNAMIC INJECTION HANDLING (HEADLESS SAFE)
  // =====================================================================
  document.addEventListener("module:ready", (ev) => {
    const root =
      ev.detail?.root ||
      ev.detail?.element ||
      document.querySelector(".redem-con");

    if (root) init(root);
  });

  window.addEventListener("DOMContentLoaded", () => {
    const lateRoot = document.querySelector(".redem-con");
    if (lateRoot) init(lateRoot);
  });

})();
