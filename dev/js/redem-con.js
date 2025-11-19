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
    // PRELOAD IATA ON FLIGHT DECK INIT (CCT – zero hesitation)
    // =====================================================================
    loadIATA();

    // =====================================================================
    // DEFAULT ROUTING STATE — FINAL CCT VERSION
    // =====================================================================
    resetRoutingToDefaults();
    
    function resetRoutingToDefaults() {
      setToggle(directStop, "no", true);      // enabled
      setToggle(multiConn, "no", true);       // enabled
      setToggle(posFlight, "no", false);      // disabled
    }
    
    // Helper: set toggle state
    function setToggle(group, value, enabled) {
      const yesBtn = group.querySelector('[data-val="yes"]');
      const noBtn = group.querySelector('[data-val="no"]');
    
      yesBtn.classList.remove("active");
      noBtn.classList.remove("active");
    
      if (value === "yes") yesBtn.classList.add("active");
      else noBtn.classList.add("active");
    
      if (!enabled) {
        group.classList.add("disabled-toggle");
        yesBtn.disabled = true;
        noBtn.disabled = true;
      } else {
        group.classList.remove("disabled-toggle");
        yesBtn.disabled = false;
        noBtn.disabled = false;
      }
    }
    
    // Helper: read active value
    function getToggleValue(group) {
      const btn = group.querySelector("button.active");
      return btn?.dataset.val || "no";
    }
    
    // =====================================================================
    // APPLY ROUTING RULES (FINAL SPECIFICATION)
    // =====================================================================
    function applyRoutingRules() {
      const direct = getToggleValue(directStop);
      const multi = getToggleValue(multiConn);
    
      // ---------------------------------------------
      // CASE 1 — DIRECT = YES
      // ---------------------------------------------
      if (direct === "yes") {
        setToggle(multiConn, "no", true);   // enabled but forced NO
        setToggle(posFlight, "no", false);  // disabled
      }
    
      // ---------------------------------------------
      // CASE 2 — MULTI = YES
      // ---------------------------------------------
      else if (multi === "yes") {
        setToggle(directStop, "no", true);  // enabled but forced NO
        setToggle(posFlight, "no", true);   // enabled
      }
    
      // ---------------------------------------------
      // CASE 3 — BOTH = NO
      // ---------------------------------------------
      else {
        setToggle(directStop, "no", true);   // enabled
        setToggle(multiConn, "no", true);    // enabled
        setToggle(posFlight, "no", false);   // disabled
      }
    
      validateReady();
    }
    
    // =====================================================================
    // ROUTING TOGGLE LISTENERS
    // =====================================================================
    [directStop, multiConn].forEach(group => {
      group.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button");
        if (!btn || btn.disabled) return;
    
        // set clicked btn active
        group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    
        applyRoutingRules();
      });
    });
    
    // Positioning listener stays but only fires when enabled
    posFlight.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button");
      if (!btn || btn.disabled) return;
    
      posFlight.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    
      validateReady();
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
    // IATA AUTOCOMPLETE — CONCIERGESYNC LUXURY ENGINE (CCT • IS-READY)
    // =====================================================================
    
    // Metro airport clusters for commercial-only cities
    const metroClusters = {
      "MIAMI":        ["MIA", "FLL"],
      "FORT LAUDERDALE": ["FLL", "MIA"],
      "DALLAS":       ["DFW", "DAL"],
      "LOS ANGELES":  ["LAX", "BUR", "LGB", "ONT", "SNA"],
      "CHICAGO":      ["ORD", "MDW"],
      "WASHINGTON":   ["DCA", "IAD"],
      "LONDON":       ["LHR", "LGW", "LCY", "STN", "LTN"],
      "TOKYO":        ["HND", "NRT"],
      "NEW YORK":     ["JFK", "LGA", "EWR"],
      "SAN FRANCISCO":["SFO", "OAK", "SJC"],
      "BOSTON":       ["BOS", "PVD"],
      "DENVER":       ["DEN"]
    };
    
    // Global throttle
    let iataTimer = null;
    let iataData = null;
    
    // Load IATA list
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
    
    // Utility: is commercial airport?
    function isCommercial(airport) {
      return airport.commercial === true || airport.type === "large_airport" || airport.type === "medium_airport";
    }

    // Identify major North America long-haul hubs
    function isMajorNorthAmerica(a) {
      return a.major_north_america === true;
    }
    
    // Main setup
    function setupIATA(input, suggestionBox) {
      input.addEventListener("input", () => {
        const value = input.value.trim().toUpperCase();
        suggestionBox.innerHTML = "";
    
        if (value.length < 2) return;
    
        clearTimeout(iataTimer);
        iataTimer = setTimeout(async () => {
          const list = await loadIATA();
          let results = [];
    
          // ---------------------------------------------------------------
          // SPECIAL CASE — User typed "USCA" to load all major NA hubs
          // ---------------------------------------------------------------
          if (value === "USCA") {

            // CCT truth marker for IS ingestion
            input.dataset.cs_iata_mode = "USCA";
          
            const majorList = iataData.filter(a => isCommercial(a) && isMajorNorthAmerica(a));
          
            const display = majorList
              .sort((a, b) => a.iata.localeCompare(b.iata))
              .slice(0, 12);
          
            renderSuggestions(display, suggestionBox, input);
            return;
          }
          
          // ---------------------------------------------------------------
          // CASE 1 — User typed EXACT 3-letter IATA code
          // ---------------------------------------------------------------
          if (value.length === 3) {
            const exact = list.filter(a => a.iata?.toUpperCase() === value);
            if (exact.length) {
              results = exact; // ONLY show this one
            }
            renderSuggestions(results, suggestionBox, input);
            return;
          }
    
          // ---------------------------------------------------------------
          // CASE 2 — User typed CITY NAME (partial or full)
          // ---------------------------------------------------------------
          const cityMatches = list.filter(a =>
            a.city?.toUpperCase().startsWith(value)
          );
    
          if (cityMatches.length) {
            const cityName = cityMatches[0].city.toUpperCase();
            const cluster = metroClusters[cityName] || [];
    
            // Show only the commercial cluster
            const clusterResults = list.filter(a =>
              cluster.includes(a.iata?.toUpperCase())
            );
    
            if (clusterResults.length) {
              results = clusterResults;
              renderSuggestions(results, suggestionBox, input);
              return;
            }
          }
    
          // ---------------------------------------------------------------
          // CASE 3 — Partial alpha input (ex: "mia" but not exact code yet)
          // ---------------------------------------------------------------
          const tier1 = list.filter(a =>
            a.iata?.toUpperCase().startsWith(value) &&
            isCommercial(a)
          );
    
          const tier2 = list.filter(a =>
            a.city?.toUpperCase().startsWith(value) &&
            isCommercial(a)
          );
    
          results = [...tier1, ...tier2];
    
          // Remove duplicates
          results = results.filter((a, i, self) =>
            i === self.findIndex(b => b.iata === a.iata)
          );
    
          // Limit to luxury top 5
          results = results.slice(0, 5);
    
          renderSuggestions(results, suggestionBox, input);
        }, 120);
      });
    }
    
    // Render suggestions
    function renderSuggestions(results, box, input) {
      box.innerHTML = "";
    
      results.forEach(a => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = `${a.iata} — ${a.airport}`;
        div.addEventListener("click", () => {
          input.value = a.iata;
          box.innerHTML = "";
          validateReady();
        });
        box.appendChild(div);
      });
    }
    
    // Hook to DOM
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
