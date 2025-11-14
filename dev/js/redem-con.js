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
    console.warn("⚠️ Redemption module: key inputs not found yet.");
    console.groupEnd();
    return;
  }

  /* ============================================================
     ✈️  IATA Autocomplete (local dataset, expandable)
  ============================================================ */
function setupIataAutocomplete(ctx = root) {
  const iataInputs = ctx.querySelectorAll("input[data-iata]");
  if (!iataInputs.length) return console.warn("⚠️ No IATA inputs found.");

  // Local static list for now — can later move to an API
  const IATA_AIRPORTS = [
    { code: "ATL", city: "Atlanta", country: "USA" },
    { code: "DFW", city: "Dallas/Fort Worth", country: "USA" },
    { code: "JFK", city: "New York (JFK)", country: "USA" },
    { code: "LHR", city: "London Heathrow", country: "UK" },
    { code: "CDG", city: "Paris CDG", country: "France" },
    { code: "LAX", city: "Los Angeles", country: "USA" },
    { code: "CUN", city: "Cancún", country: "Mexico" },
    { code: "MCO", city: "Orlando", country: "USA" },
    { code: "FRA", city: "Frankfurt", country: "Germany" },
    { code: "NRT", city: "Tokyo Narita", country: "Japan" },
  ];

  iataInputs.forEach(input => {
    const container = input.nextElementSibling;
    if (!container || !container.classList.contains("suggestions")) {
      console.warn(`⚠️ Missing suggestions container for ${input.id}`);
      return;
    }

    input.addEventListener("input", e => {
      const term = e.target.value.toUpperCase().trim();
      container.innerHTML = "";

      if (term.length < 2) return;

      const matches = IATA_AIRPORTS.filter(
        a =>
          a.code.includes(term) ||
          a.city.toUpperCase().includes(term)
      ).slice(0, 6);

      matches.forEach(a => {
        const opt = document.createElement("div");
        opt.className = "suggestion";
        opt.textContent = `${a.city} (${a.code})`;
        opt.addEventListener("click", () => {
          input.value = a.code;
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

  console.log("✅ IATA autocomplete active");
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
          // Multi = YES → Direct forced to NO
          setToggleState("directStop", "no");
            root.querySelector("#posFlight")?.classList.remove("disabled-toggle");
        
          // Check if Positioning has any selection yet
          const posActive = ctx.querySelector("#posFlight button.active")?.dataset.val;
          if (!posActive) {
            clearTimeout(posWarningTimer);
            posWarningTimer = setTimeout(() => {
              posWarning.style.display = "block";
            }, 120); // small grace delay for smoother UX
          }
        
        // --- When user clicks Positioning, hide the warning ---
        if (parent.id === "posFlight") {
          clearTimeout(posWarningTimer);
          posWarning.style.display = "none";
        }

        // --- If Multi is turned OFF, hide the warning ---
        if (parent.id === "multiConn" && e.target.dataset.val === "no") {
          clearTimeout(posWarningTimer);
          posWarning.style.display = "none";
        }
        
        // --- Routing Rule: Direct Only = YES forces Multi & Positioning to NO ---
        if (parent.id === "directStop" && e.target.dataset.val === "yes") {
          setToggleState("multiConn", "no");
          setToggleState("posFlight", "no");
          clearTimeout(posWarningTimer);
          posWarning.style.display = "none"; // hide warning if it was up
        }

        // --- If Direct toggles to NO, re-enable Positioning ---
        if (parent.id === "directStop" && e.target.dataset.val === "no") {
          root.querySelector("#posFlight")?.classList.remove("disabled-toggle");
        }
        
        // --- Routing Rule: Multi = YES forces Direct = NO ---
        // (Already handled above, but safe to keep structured)
        if (parent.id === "multiConn" && e.target.dataset.val === "yes") {
          setToggleState("directStop", "no");
        }

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
  
      // --- Step 3B: Date Mode Visual + Value Updates ---
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
    });   // <-- closes addEventListener
  });     // <-- closes forEach   ❗ THIS was missing
  
  const flexSelect = ctx.querySelector("#flexDays");
  if (flexSelect) {
    flexSelect.addEventListener("change", () => updateButtonState(ctx));
  }
  console.log("✅ Flex-day logic active");

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

      // --- Routing Rule: Multi = YES requires Positioning Yes/No selection ---
      if (multi === "yes" && !pos) {
        searchButton.disabled = true;
        return;
      }

    const mode   = ctx.querySelector("#mode")?.value;

      if (!["exact", "flex"].includes(mode)) {
        searchButton.disabled = true;
        return;
      }

    const serviceClass = ctx.querySelector("#serviceClass")?.value;
    const passengers = ctx.querySelector("#passengers")?.value;
    const allowBudget = ctx.querySelector("#allowBudget")?.checked;
    
    // --- If Flexible Mode, require flexDays selection ---
      if (mode === "flex") {
        const flexDaysVal = ctx.querySelector("#flexDays")?.value;
        if (!flexDaysVal) {
          searchButton.disabled = true;
          return;
        }
      }

    const anyYes = [direct, multi, pos].includes("yes");

      // --- Routing sanity check: Direct=NO AND Multi=NO → cannot search ---
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
    (direct === "yes" || multi === "yes") &&   // routing requirement
    (!(multi === "yes") || pos) &&             // if Multi=YES → pos required
    (mode === "exact" || (mode === "flex" && ctx.querySelector("#flexDays")?.value));

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

// === ConciergeSync™ Redem-Con Initialization Bridge ===
(function attachRedemConHook() {
  // Ensure listener is attached only once
  if (window._redemConAttached) return;
  window._redemConAttached = true;

  // Attach listener
  document.addEventListener("module:ready", (e) => {
    // Log immediately so we know this hook is live
    console.log("🪝 redem-con.js listening for module:ready", e.detail);

    if (e.detail?.page !== "redem-con") return;

    console.group("🧩 Initializing Redemption Module");
    try {
      setupIataAutocomplete?.();
      console.log("✈️ IATA autocomplete initialized");

      setupToggleLogic?.();
      console.log("🧩 Toggle logic active");

      setupFlexDaysLogic?.();
      console.log("📅 Flex-days logic active");

      setupSearchButtonLogic?.();
      console.log("🕹️ Search button logic ready");

      console.groupEnd();
      console.log("✅ Redemption module fully initialized");
    } catch (err) {
      console.error("❌ Error initializing Redemption Module:", err);
      console.groupEnd();
    }
  });

  console.log("🪝 redem-con.js hook attached and waiting for module:ready");
})();

// ===== ConciergeSync — redem-con mock search handler (drop-in) =====
// Paste this into /dev/redem-con.js (replace existing form submit handler).
(function(){
  const MOCK_PAYLOAD = {
    "last_updated": new Date().toISOString(),
    "cards": [
      { "id":"PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m","name":"Plaid Credit Card","subtype":"credit card","last4":"3333","balance":410,"available":null },
      { "id":"Lrd9rjnmANCKKabydW7bFDm1lGogNEf38Z1Nw","name":"Plaid Business Credit Card","subtype":"credit card","last4":"9999","balance":5020,"available":4980 }
    ],
    "transactions": [
      {"account_id":"PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m","date":"2024-12-30","name":"Tectra Inc","amount":500,"category":"ENTERTAINMENT","merchant":null},
      {"account_id":"PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m","date":"2024-12-29","name":"AUTOMATIC PAYMENT - THANK","amount":2078.5,"category":"GENERAL_MERCHANDISE","merchant":null},
      {"account_id":"PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m","date":"2024-12-29","name":"KFC","amount":500,"category":"FOOD_AND_DRINK","merchant":"KFC"},
      {"account_id":"PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m","date":"2024-12-18","name":"Touchstone Climbing","amount":78.5,"category":"PERSONAL_CARE","merchant":null},
      {"account_id":"PxPwxe9KLZC331boPKRbiqnZL935NWsKdqz3m","date":"2024-12-05","name":"United Airlines","amount":500,"category":"TRAVEL","merchant":"United Airlines"}
    ]
  };

  // Helper: find element safely inside the workspace document
  function $qs(root, sel){ return (root || document).querySelector(sel); }

  // Core render: builds a simple results panel and cards
  function renderResults(root, results){
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
    // Append and fade in
    (root || document.body).appendChild(container);
    requestAnimationFrame(()=> container.style.opacity = '1');

    const grid = container.querySelector('#cs-results-grid');

    // Create cards from mock data: simple algorithm to convert tx -> "award candidate"
    const sampleRoutes = [
      { title: 'DFW → LHR — Business', points: 57000, program: 'Virgin Atlantic', value_cents_per_point: 1.3 },
      { title: 'DFW → MCO — Domestic Up', points: 15000, program: 'United', value_cents_per_point: 1.1 },
      { title: 'DFW → CUN — Off-peak', points: 23000, program: 'Aeroplan', value_cents_per_point: 1.6 },
    ];

    // Build a card per sampleRoute but enrich with user card balances
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
            <div style="font-weight:700">${(r.points * r.value_cents_per_point / 100).toLocaleString(undefined,{style:'currency',currency:'USD'})}</div>
            <div style="font-size:12px;color:#666">${(r.value_cents_per_point).toFixed(2)}¢/pt</div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:13px;color:#333">
          Recommended funding card: <strong>${cardBalance ? cardBalance.name + ' • • • ' + cardBalance.last4 : '—'}</strong>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="cs-action-btn" data-route="${i}" style="padding:8px 10px;border-radius:8px;border:none;cursor:pointer;">Select</button>
          <button class="cs-action-btn-secondary" style="padding:8px 10px;border-radius:8px;border:1px solid #d7d7d7;background:transparent;cursor:pointer;">View details</button>
        </div>
      `;
      grid.appendChild(el);
    });

    // wire sample actions
    container.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('.cs-action-btn');
      if(!btn) return;
      const idx = Number(btn.dataset.route || 0);
      const selected = sampleRoutes[idx];
    
      // Persist selection
      try {
        sessionStorage.setItem('latestRedemptionSelection', JSON.stringify(selected));
        console.log('💾 Stored latestRedemptionSelection:', selected);
      } catch(err) {
        console.error('sessionStorage write failed', err);
      }
    
      // Optional visual feedback
      btn.textContent = 'Selected ✓';
      btn.disabled = true;
    
      // Route to results page (for now: console log)
      console.log('➡️ Ready to route to redemption-results-con.html');
      // TODO: integrate workspace loader or navigation when ready
    });
  }

  // Submit handler: disables button, shows spinner, simulates network, writes sessionStorage, renders results
  function attachSearchHandler(root){
    const form = $qs(root, '#cs-redem-form') || $qs(document, '#cs-redem-form');
    if(!form) return console.warn('redem-con: form #cs-redem-form not found');

    // prevent duplicate binding
    if(form.__csBound) return;
    form.__csBound = true;

    const btn = form.querySelector('button[type="submit"], #searchButton') || form.querySelector('.search-btn');

    form.addEventListener('submit', function submitHandler(e){
      e.preventDefault();
      if(!btn) return;

      // UI lock
      btn.disabled = true;
      const oldText = btn.innerHTML;
      btn.innerHTML = 'Searching…';

      // optional: show local spinner
      const spinner = document.createElement('div');
      spinner.id = 'cs-search-spinner';
      spinner.style.cssText = 'position:fixed;top:12px;right:12px;padding:10px 12px;border-radius:8px;background:#111;color:#fff;font-size:13px;z-index:9999';
      spinner.textContent = 'Searching ConciergeSync™';
      document.body.appendChild(spinner);

      // simulate network + processing time (mock)
      setTimeout(()=>{
        // write canonical payload to sessionStorage
        try {
          sessionStorage.setItem('latestRedemptionResults', JSON.stringify(MOCK_PAYLOAD));
        } catch(err) {
          console.error('sessionStorage set failed', err);
        }

        // Remove spinner + unlock UI
        spinner.remove();
        btn.disabled = false;
        btn.innerHTML = oldText;

        // clear existing workspace and render results
        // If the page is running inside the console and a 'workspace' container exists, use it
        const workspace = document.querySelector('#workspace') || document.querySelector('.workspace') || document.body;
        // remove previous results node if exists
        const existing = workspace.querySelector('#cs-redem-results');
        if(existing) existing.remove();

        // fade-out old workspace and inject new content (nice UX)
        workspace.style.transition = 'opacity .18s ease';
        workspace.style.opacity = '0';
        setTimeout(()=>{
          // cleanup children if needed (safe harbor)
          // workspace.replaceChildren() is used by console injection elsewhere; here we just append
          workspace.innerHTML = ''; // intentionally simple to ensure fresh render
          renderResults(workspace, MOCK_PAYLOAD);
          workspace.style.opacity = '1';
        }, 200);
      }, 700); // 700ms simulated latency
    });
  }

  // Auto-run when script executed; if inside injection, attempt to attach after DOM ready
function bootRedemCon() {
  // attach core search handler
  try { attachSearchHandler(document); } catch (e) { console.warn("attachSearchHandler failed:", e); }

  // attach IATA autocomplete
  try { setupIataAutocomplete(document); } catch (e) { console.warn("setupIataAutocomplete failed:", e); }

  // also re-run updateButtonState once to catch any pre-filled values
  try { typeof updateButtonState === 'function' && updateButtonState(document); } catch (e) { /* ignore */ }

  // If this module is injected into the console workspace (replaceChildren), the DOM may be re-written;
  // schedule a follow-up attach to be safe (idempotent guards inside the functions prevent double-bind)
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

  // If console injects via AJAX and workspace.replaceChildren(...doc.body.children) fires,
  // this handler will still attach because attachSearchHandler searches globally for #cs-redem-form.
})();

