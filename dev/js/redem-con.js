console.log("🔥 redem-con.js loaded");

// GLOBAL IATA DATA (lazy-loaded once)
let iataData = null;

(function () {

  // =====================================================================
  // MASTER INITIALIZER
  // =====================================================================
  function init(root) {
    if (!root || root.__redemInitialized) return;
    root.__redemInitialized = true;

    console.log("🟦 INIT: redem-con module");

    // =====================================================================
    // ELEMENT REFERENCES
    // =====================================================================
    const origin = root.querySelector("#origin");
    const destination = root.querySelector("#destination");
    const departDate = root.querySelector("#departDate");
    const returnDate = root.querySelector("#returnDate");
    const passengers = root.querySelector("#passengers");
    const serviceClass = root.querySelector("#serviceClass");

    const exactBtn = root.querySelector("#exactBtn");
    const flexBtn = root.querySelector("#flexBtn");
    const modeInput = root.querySelector("#mode");
    const flexPicker = root.querySelector("#flexPicker");
    const flexDays = root.querySelector("#flexDays");

    const partnerSpace = root.querySelector("#partnerSpace");
    const program = root.querySelector("#program");
    const allowBudget = root.querySelector("#allowBudget");

    const directStop = root.querySelector("#directStop");
    const multiConn = root.querySelector("#multiConn");
    const posFlight = root.querySelector("#posFlight");

    const searchBtn = root.querySelector("#searchBtn");
    const searchWarning = root.querySelector("#searchWarning");

    const spinner = root.querySelector("#spinner-overlay");

    // =====================================================================
    // DEFAULT ROUTING STATE — CORRECTED RULES
    // =====================================================================
    resetRoutingToDefaults();

    function resetRoutingToDefaults() {
      setToggle(directStop, "no", true);      // enabled
      setToggle(multiConn, "no", true);       // enabled
      setToggle(posFlight, "no", false);      // disabled
    }

    // Helper: apply toggle state
    function setToggle(group, value, enabled) {
      const yes = group.querySelector('[data-val="yes"]');
      const no = group.querySelector('[data-val="no"]');

      yes.classList.remove("active");
      no.classList.remove("active");

      if (value === "yes") yes.classList.add("active");
      else no.classList.add("active");

      if (!enabled) {
        group.classList.add("disabled-toggle");
        yes.disabled = true;
        no.disabled = true;
      } else {
        group.classList.remove("disabled-toggle");
        yes.disabled = false;
        no.disabled = false;
      }
    }

    // Helper: get current value
    function getToggleValue(group) {
      const btn = group.querySelector("button.active");
      return btn?.dataset.val || "no";
    }

    // =====================================================================
    // CORRECTED ROUTING RULES (FINAL)
    // =====================================================================
    function applyRoutingRules() {
      const direct = getToggleValue(directStop);
      const multi = getToggleValue(multiConn);

      // DIRECT YES
      if (direct === "yes") {
        setToggle(multiConn, "no", true);     // forced NO but enabled
        setToggle(posFlight, "no", false);    // disabled
      }

      // MULTI YES
      else if (multi === "yes") {
        setToggle(directStop, "no", true);    // forced NO but enabled
        setToggle(posFlight, "no", true);     // enabled
      }

      // BOTH NO
      else {
        setToggle(directStop, "no", true);
        setToggle(multiConn, "no", true);
        setToggle(posFlight, "no", false);
      }

      validateReady();
    }

    // =====================================================================
    // TOGGLE EVENT LISTENERS
    // =====================================================================
    ;[directStop, multiConn, posFlight].forEach(group => {
      group.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button");
        if (!btn || btn.disabled) return;

        group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        applyRoutingRules();
      });
    });

    // =====================================================================
    // EXACT / FLEX MODE
    // =====================================================================
    exactBtn.addEventListener("click", () => {
      exactBtn.classList.add("active");
      flexBtn.classList.remove("active");
      modeInput.value = "exact";
      flexPicker.style.display = "none";
      validateReady();
    });

    flexBtn.addEventListener("click", () => {
      exactBtn.classList.remove("active");
      flexBtn.classList.add("active");
      modeInput.value = "flex";
      flexPicker.style.display = "block";
      validateReady();
    });

    // =====================================================================
    // IATA AUTOCOMPLETE (FIXED)
    // =====================================================================
    async function loadIATA() {
      if (iataData) return iataData;

      try {
        console.log("🌍 Loading IATA…");
        const res = await fetch("/dev/asset/iata-icao.json");
        iataData = await res.json();
        console.log("🌍 IATA loaded:", iataData.length);
      } catch (err) {
        console.error("❌ IATA load error:", err);
        iataData = [];
      }
      return iataData;
    }

    function setupIATA(input, suggestions) {
      input.addEventListener("input", async () => {
        const value = input.value.trim().toUpperCase();
        suggestions.innerHTML = "";

        if (value.length < 2) return;

        const data = await loadIATA();

        const matches = data.filter(r =>
          r.code?.toUpperCase().startsWith(value) ||
          r.city?.toUpperCase().startsWith(value)
        );

        matches.slice(0, 8).forEach(r => {
          const div = document.createElement("div");
          div.className = "suggestion";
          div.textContent = `${r.code} — ${r.city}`;
          div.addEventListener("click", () => {
            input.value = r.code;
            suggestions.innerHTML = "";
            validateReady();
          });
          suggestions.appendChild(div);
        });
      });
    }

    setupIATA(origin, root.querySelector("#origin-suggestions"));
    setupIATA(destination, root.querySelector("#destination-suggestions"));

    // =====================================================================
    // VALIDATION
    // =====================================================================
    function validateReady() {
      const ready =
        origin.value.trim().length === 3 &&
        destination.value.trim().length === 3 &&
        departDate.value &&
        serviceClass.value &&
        passengers.value &&
        (getToggleValue(directStop) === "yes" || getToggleValue(multiConn) === "yes") &&
        (modeInput.value !== "flex" || flexDays.value);

      searchBtn.disabled = !ready;
      searchWarning.style.display = ready ? "none" : "block";
    }

    [origin, destination, departDate, serviceClass, passengers, flexDays]
      .forEach(el => {
        el.addEventListener("input", validateReady);
        el.addEventListener("change", validateReady);
      });

    // =====================================================================
    // SEARCH EXECUTION
    // =====================================================================
    searchBtn.addEventListener("click", async () => {
      if (searchBtn.disabled) return;

      const payload = {
        origin: origin.value.trim(),
        destination: destination.value.trim(),
        departDate: departDate.value,
        returnDate: returnDate.value || null,
        passengers: passengers.value,
        serviceClass: serviceClass.value,
        allowBudget: allowBudget.checked,
        partnerSpace: partnerSpace.checked,
        program: program.value,
        direct: getToggleValue(directStop),
        multi: getToggleValue(multiConn),
        pos: getToggleValue(posFlight),
        mode: modeInput.value,
        flexDays: flexDays.value || null
      };

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

    // Initialize state
    applyRoutingRules();
    validateReady();
  }

  // =====================================================================
  // DYNAMIC MODULE LOADING
  // =====================================================================
  document.addEventListener("module:ready", (ev) => {
    const root =
      ev.detail?.root ||
      ev.detail?.element ||
      document.querySelector(".redem-con");

    if (root) init(root);
  });

  window.addEventListener("DOMContentLoaded", () => {
    const late = document.querySelector(".redem-con");
    if (late) init(late);
  });

  const mo = new MutationObserver(() => {
    const el = document.querySelector(".redem-con");
    if (el && !el.__redemInitialized) {
      init(el);
      mo.disconnect();
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

})();
