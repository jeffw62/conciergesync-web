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


// ===== ConciergeSync — redem-con mock search handler (drop-in) =====
(function () {
  const MOCK_PAYLOAD = {
    "last_updated": new Date().toISOString(),
    "cards": [
      { "id": "PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m", "name": "Plaid Credit Card", "subtype": "credit card", "last4": "3333", "balance": 410, "available": null },
      { "id": "Lrd9rjnmANCKKabydW7bFDm1lGogNEf38Z1Nw", "name": "Plaid Business Credit Card", "subtype": "credit card", "last4": "9999", "balance": 5020, "available": 4980 }
    ],
    "transactions": [
      { "account_id": "PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m", "date": "2024-12-30", "name": "Tectra Inc", "amount": 500, "category": "ENTERTAINMENT", "merchant": null },
      { "account_id": "PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m", "date": "2024-12-29", "name": "AUTOMATIC PAYMENT - THANK", "amount": 2078.5, "category": "GENERAL_MERCHANDISE", "merchant": null },
      { "account_id": "PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m", "date": "2024-12-29", "name": "KFC", "amount": 500, "category": "FOOD_AND_DRINK", "merchant": "KFC" },
      { "account_id": "PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m", "date": "2024-12-18", "name": "Touchstone Climbing", "amount": 78.5, "category": "PERSONAL_CARE", "merchant": null },
      { "account_id": "PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m", "date": "2024-12-05", "name": "United Airlines", "amount": 500, "category": "TRAVEL", "merchant": "United Airlines" }
    ]
  };

  // Helper: find element safely inside the workspace document
  function $qs(root, sel) { return (root || document).querySelector(sel); }

  // Core render: builds a simple results panel and cards
  function renderResults(root, results) {
    const container = document.createElement('div');
    container.id = 'cs-redem-results';
    container.style.opacity = '0';
    container.style.transition = 'opacity .35s ease';
    container.innerHTML = `
      <div style="padding:18px;max-width:980px;margin:0 auto;">
        <h2 style="margin:0 0 12px 0;font-size:20px;">Redemption Results (mock)</h2>
        <div id="cs-results-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;"></div>
      </div>
    `;

    (root || document.body).appendChild(container);
    requestAnimationFrame(() => container.style.opacity = '1');
    const grid = container.querySelector('#cs-results-grid');

    const sampleRoutes = [
      { title: 'DFW to LHR — Business', points: 57000, program: 'Virgin Atlantic', value_cents_per_point: 1.3 },
      { title: 'DFW to MCO — Domestic Up', points: 15000, program: 'United', value_cents_per_point: 1.1 },
      { title: 'DFW to CUN — Off-peak', points: 23000, program: 'Aeroplan', value_cents_per_point: 1.6 },
    ];

    const cardsSummary = (results.cards || []);
    sampleRoutes.forEach((r, i) => {
      const cardBalance = cardsSummary[i % cardsSummary.length];
      const el = document.createElement('div');
      el.className = 'cs-redem-card';
      el.style.cssText = 'padding:12px;border-radius:10px;border:1px solid rgba(0,0,0,0.06);background:linear-gradient(180deg, rgba(255,255,255,0.98), #fff);box-shadow:0 6px 14px rgba(10,10,10,0.04);';
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700">${r.title}</div>
            <div style="font-size:12px;color:#666">${r.program} · ${r.points.toLocaleString()} pts</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">${(r.points * r.value_cents_per_point / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
            <div style="font-size:12px;color:#666">${(r.value_cents_per_point).toFixed(2)}¢/pt</div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:13px;color:#333">
          Recommended funding card: <strong>${cardBalance ? cardBalance.name + ' to to ' + cardBalance.last4 : '—'}</strong>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="cs-action-btn" data-route="${i}" style="padding:8px 10px;border-radius:8px;border:none;cursor:pointer;">Select</button>
          <button class="cs-action-btn-secondary" style="padding:8px 10px;border-radius:8px;border:1px solid #d7d7d7;background:transparent;cursor:pointer;">View details</button>
        </div>
      `;
      grid.appendChild(el);
    });

    container.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.cs-action-btn');
      if (!btn) return;
      const idx = Number(btn.dataset.route || 0);
      const selected = sampleRoutes[idx];

      try {
        sessionStorage.setItem('latestRedemptionSelection', JSON.stringify(selected));
        console.log('Stored latestRedemptionSelection:', selected);
      } catch (err) {
        console.error('sessionStorage write failed', err);
      }

      btn.textContent = 'Selected';
      btn.disabled = true;
      console.log('Ready to route to redemption-results-con.html');
    });
  }

  function attachSearchHandler(root) {
    const form = $qs(root, '#discovery-flights-form') || $qs(document, '#discovery-flights-form');
    if (!form) return console.warn('Discovery – Flights: form not found');

    console.log("🔗 attachSearchHandler: form found", form);
    
    if (form.__csBound) return;
    form.__csBound = true;

   const btn = form.querySelector('#searchBtn');
    form.addEventListener('submit', function submitHandler(e) {
      e.preventDefault();
      if (!btn) return;

      btn.disabled = true;
      const oldText = btn.innerHTML;
      btn.innerHTML = 'Searching…';

      const spinner = document.createElement('div');
      spinner.id = 'cs-search-spinner';
      spinner.style.cssText = 'position:fixed;top:12px;right:12px;padding:10px 12px;border-radius:8px;background:#111;color:#fff;font-size:13px;z-index:9999';
      spinner.textContent = 'Searching ConciergeSync™';
      document.body.appendChild(spinner);

      setTimeout(() => {
        try {
          sessionStorage.setItem('latestRedemptionResults', JSON.stringify(MOCK_PAYLOAD));
        } catch (err) {
          console.error('sessionStorage set failed', err);
        }

        spinner.remove();
        btn.disabled = false;
        btn.innerHTML = oldText;

        const workspace = document.querySelector('#workspace') || document.querySelector('.workspace') || document.body;
        const existing = workspace.querySelector('#cs-redem-results');
        if (existing) existing.remove();

        workspace.style.transition = 'opacity .18s ease';
        workspace.style.opacity = '0';
        setTimeout(() => {
          workspace.innerHTML = '';
          renderResults(workspace, MOCK_PAYLOAD);
          workspace.style.opacity = '1';
        }, 200);
      }, 700);
    });
  }

  function bootRedemCon() {
    try { attachSearchHandler(document); } catch (e) { console.warn("attachSearchHandler failed:", e); }
    try { setupIataAutocomplete(document); } catch (e) { console.warn("setupIataAutocomplete failed:", e); }
    try { typeof updateButtonState === 'function' && updateButtonState(document); } catch (e) { /* ignore */ }

    setTimeout(() => {
      try { attachSearchHandler(document); } catch (e) {}
      try { setupIataAutocomplete(document); } catch (e) {}
      try { typeof updateButtonState === 'function' && updateButtonState(document); } catch (e) {}
    }, 250);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(bootRedemCon, 50);
  } else {
    window.addEventListener('DOMContentLoaded', bootRedemCon);
  }
})(); // ← Correctly closes the second IIFE
