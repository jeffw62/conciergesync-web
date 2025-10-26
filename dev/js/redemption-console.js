(() => {
  console.log("%c🚀 ConciergeSync™ redemption-console.js booting...", "color:#f6b93b; font-weight:bold;");

  // ------------------------------------------------------------
  // 🧩 1. Environment Guards
  // ------------------------------------------------------------
  const workspace = document.getElementById("workspace");
  if (!workspace) {
    console.warn("⚠️ No #workspace found — not running inside console. Exiting redemption-console.js");
    return;
  }

  const form = workspace.querySelector("#redemption-form");
  if (!form) {
    console.warn("⚠️ No #redemption-form found in workspace. Waiting for injection...");
    const observer = new MutationObserver(() => {
      const injected = workspace.querySelector("#redemption-form");
      if (injected) {
        observer.disconnect();
        console.log("✅ Form detected post-injection. Initializing handlers...");
        initializeHandlers(injected);
      }
    });
    observer.observe(workspace, { childList: true, subtree: true });
    return;
  }

  // ------------------------------------------------------------
  // 🧠 2. Main Initializer
  // ------------------------------------------------------------
  initializeHandlers(form);

  function initializeHandlers(formEl) {
    console.log("🧭 Initializing redemption form inside console workspace...");

    const originInput = formEl.querySelector("#origin");
    const destInput   = formEl.querySelector("#destination");
    const searchBtn   = formEl.querySelector("#searchBtn");
    const warning     = formEl.querySelector("#searchWarning");

    if (searchBtn) {
      searchBtn.disabled = true;
      console.log("🔒 Search button initially disabled.");
    }

    // ----------------------------------------------------------
    // ✈️ 3. Load Airport Data
    // ----------------------------------------------------------
    window.airports = window.airports || [];
    if (window.airports.length === 0) {
      fetch("/dev/asset/iata-icao.json")
        .then(res => res.json())
        .then(data => {
          window.airports = data;
          console.log("✈️ Airports loaded:", data.length);
        })
        .catch(err => console.error("❌ Failed to load airports:", err));
    }

    // ----------------------------------------------------------
    // 🔡 4. IATA Autocomplete (light version)
    // ----------------------------------------------------------
    function setupAutocomplete(input) {
      if (!input) return;
      const suggestions = document.createElement("div");
      suggestions.className = "suggestions";
      suggestions.style.position = "absolute";
      suggestions.style.background = "#fff";
      suggestions.style.border = "1px solid #ccc";
      suggestions.style.zIndex = "9999";
      suggestions.style.display = "none";
      input.parentElement.appendChild(suggestions);

      input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        suggestions.innerHTML = "";
        if (query.length < 2) {
          suggestions.style.display = "none";
          return;
        }
        const matches = (window.airports || [])
          .filter(a =>
            a.iata.toLowerCase().includes(query) ||
            a.airport.toLowerCase().includes(query)
          )
          .slice(0, 8);

        if (matches.length === 0) {
          suggestions.style.display = "none";
          return;
        }

        matches.forEach(m => {
          const div = document.createElement("div");
          div.textContent = `${m.iata} – ${m.airport}`;
          div.style.padding = "4px 8px";
          div.style.cursor = "pointer";
          div.addEventListener("click", () => {
            input.value = m.iata;
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
            validateForm();
          });
          suggestions.appendChild(div);
        });
        suggestions.style.display = "block";
      });

      document.addEventListener("click", (e) => {
        if (!suggestions.contains(e.target) && e.target !== input) {
          suggestions.style.display = "none";
        }
      });
    }

    setupAutocomplete(originInput);
    setupAutocomplete(destInput);

    // ----------------------------------------------------------
    // 🟢 5. Yes/No Toggle Handler
    // ----------------------------------------------------------
    workspace.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-val]");
      if (!btn) return;

      const group = btn.closest(".toggle-group");
      if (!group) return;

      group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      console.log(`🟩 ${group.id || "(group)"} → ${btn.dataset.val}`);

      validateForm();
    });

    // ----------------------------------------------------------
    // ✅ 6. Form Validation
    // ----------------------------------------------------------
    function validateForm() {
      const filledOrigin = !!originInput?.value.trim();
      const filledDest   = !!destInput?.value.trim();

      const allGroups = formEl.querySelectorAll(".toggle-group");
      const allSelected = Array.from(allGroups).every(g => g.querySelector("button.active"));

      const ready = filledOrigin && filledDest && allSelected;
      if (searchBtn) searchBtn.disabled = !ready;
      if (warning) warning.style.display = ready ? "none" : "block";

      console.log(`🧩 Validation → Origin:${filledOrigin} Dest:${filledDest} Toggles:${allSelected}  =>  Ready:${ready}`);
    }

    // ----------------------------------------------------------
    // 🔍 7. Search Button
    // ----------------------------------------------------------
    if (searchBtn) {
      searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (searchBtn.disabled) {
          console.warn("🚫 Search clicked while disabled.");
          return;
        }

        console.log("🚀 Search button clicked — building payload...");
        const payload = {
          origin: originInput?.value.toUpperCase(),
          destination: destInput?.value.toUpperCase(),
          direct: formEl.querySelector("#directStop .active")?.dataset.val,
          multi: formEl.querySelector("#multiConn .active")?.dataset.val,
          positioning: formEl.querySelector("#posFlight .active")?.dataset.val,
        };
        console.log("📦 Payload ready:", payload);

        // For now, just simulate next step
        console.log("✅ Redemption-console Step 1 complete — ready for shimmer / API layer next phase.");
      });
    }

    console.log("✅ Redemption-console handlers fully initialized.");
  }
})();
