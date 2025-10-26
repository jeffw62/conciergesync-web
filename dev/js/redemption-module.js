// ============================================================
//  ConciergeSync™ Redemption Module
//  Unified version — handles form, gold-card, shimmer, and injection
// ============================================================

(() => {
  console.log("🕓 redemption-module.js executing immediately (IIFE mode)...");

  // ============================================================
  // 🧱 Global Flags — prevent premature or duplicate execution
  // ============================================================
  window._manualLaunch = false;
  window._setupLocked = true;
  window._redemptionInitialized = false;

  // ============================================================
  // 🪄 Manual Entry Points
  // ============================================================
  function initRedemptionModule() {
    console.log("🩷 initRedemptionModule defined — waiting for manual trigger only.");
  }

  window.launchGoldCard = async () => {
    console.log("🎯 Manual gold-card launch requested.");
    window._manualLaunch = true;
    window._setupLocked = false;
    await setupRedemptionModule();
  };

  // ============================================================
  // ✈️ Load Airports
  // ============================================================
  window.airports = window.airports || [];

  function loadAirports() {
    fetch("/dev/asset/iata-icao.json")
      .then((res) => res.json())
      .then((data) => {
        window.airports.length = 0;
        Array.prototype.push.apply(window.airports, data);
        console.log("✈️ Loaded airports:", window.airports.length);
      })
      .catch((err) => console.error("❌ Failed to load airports:", err));
  }

  // ============================================================
  // 💳 Spinner Bridge + Gold Card Setup
  // ============================================================
  async function setupRedemptionModule() {
    if (window._setupLocked && !window._manualLaunch) {
      console.log("🛑 setupRedemptionModule blocked — global lock active.");
      return;
    }
    if (window._redemptionInitialized) return;

    window._redemptionInitialized = true;
    console.log("✅ setupRedemptionModule initialized manually.");

    const consoleContainer =
      document.querySelector("main.console-container") ||
      document.getElementById("workspace") ||
      document.body;

    if (consoleContainer) {
      consoleContainer.style.position = "relative";
      consoleContainer.style.overflow = "hidden";
    }

    // ------------------------------------------------------------
    // 🧱 Spinner Bridge Initialization
    // ------------------------------------------------------------
    const spinnerBridge = document.createElement("div");
    spinnerBridge.id = "spinner-bridge";
    Object.assign(spinnerBridge.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "linear-gradient(180deg, rgba(10,26,51,0.98) 0%, rgba(10,26,51,1) 100%)",
      zIndex: "99999",
      overflow: "hidden",
      maxWidth: "100%",
      maxHeight: "100%",
    });
    consoleContainer.appendChild(spinnerBridge);

    // ------------------------------------------------------------
    // 💳 Gold Card Construction
    // ------------------------------------------------------------
    const goldCard = document.createElement("div");
    goldCard.className = "gold-card";
    Object.assign(goldCard.style, {
      position: "relative",
      width: "260px",
      height: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      zIndex: 9999,
    });

    const cardImg = document.createElement("img");
    cardImg.src = "/dev/asset/CS_logo_vert_gold_card.png";
    cardImg.alt = "ConciergeSync™ Gold Card";
    Object.assign(cardImg.style, {
      width: "260px",
      height: "auto",
      display: "block",
      borderRadius: "8px",
      overflow: "hidden",
      clipPath: "inset(0 round 8px)",
    });
    goldCard.appendChild(cardImg);

    spinnerBridge.appendChild(goldCard);
    consoleContainer.appendChild(spinnerBridge);
    console.log("📦 Spinner bridge & gold card attached to workspace.");

    // ------------------------------------------------------------
    // ✨ Scoped Shimmer Overlay
    // ------------------------------------------------------------
    const shimmer = document.createElement("div");
    shimmer.id = "shimmer-overlay";
    Object.assign(shimmer.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      background:
        "linear-gradient(100deg, transparent 10%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 52%, transparent 90%)",
      backgroundRepeat: "no-repeat",
      backgroundSize: "200% 100%",
      backgroundPosition: "-100% 0",
      mixBlendMode: "overlay",
      animation: "shimmerMove 5s ease-in-out infinite",
      pointerEvents: "none",
      borderRadius: "8px",
      overflow: "hidden",
      zIndex: 2,
    });
    goldCard.appendChild(shimmer);

    // ------------------------------------------------------------
    // 🪄 Keyframes for Shimmer Animation
    // ------------------------------------------------------------
    if (!document.getElementById("shimmer-style")) {
      const style = document.createElement("style");
      style.id = "shimmer-style";
      style.textContent = `
        @keyframes shimmerMove {
          0%   { background-position: -120% 0; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { background-position: 120% 0; opacity: 0; }
        }`;
      document.head.appendChild(style);
    }

    // ------------------------------------------------------------
    // 💬 On-card Processing Message
    // ------------------------------------------------------------
    const cardMessage = document.createElement("div");
    cardMessage.id = "card-message";
    cardMessage.textContent =
      "Analyzing your award miles across routes and partners — please stand by.";
    Object.assign(cardMessage.style, {
      position: "absolute",
      top: "80%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "80%",
      textAlign: "center",
      color: "#0a1a33",
      fontSize: "1.05rem",
      fontWeight: "500",
      textShadow: "0 0 6px rgba(0,0,0,0.3)",
      opacity: "0",
      transition: "opacity 1.2s ease",
      pointerEvents: "none",
      zIndex: 10000,
    });
    goldCard.appendChild(cardMessage);
    setTimeout(() => (cardMessage.style.opacity = "1"), 500);

    // ------------------------------------------------------------
    // ✨ Shimmer Fade + Transition Logic
    // ------------------------------------------------------------
    let shimmerCount = 0;

    document.addEventListener("animationiteration", (e) => {
      if (e.target.id !== "shimmer-overlay") return;

      shimmerCount++;
      console.log(`✨ Shimmer cycle #${shimmerCount}`);

      if (shimmerCount === 3) {
        console.log("🌙 Three shimmer cycles complete — begin fade-out.");

        goldCard.style.transition = "opacity 1.2s ease";
        goldCard.style.opacity = "0";
        shimmer.style.transition = "opacity 1.2s ease";
        shimmer.style.opacity = "0";

        const msg = document.getElementById("card-message");
        if (msg) {
          msg.style.transition = "opacity 0.8s ease";
          msg.style.opacity = "0";
        }

        setTimeout(() => {
          console.log("🚀 Transition handoff triggered → loading flight cards");
          proceedToNextStage();
        }, 1300);

        // stop further shimmer counting
        e.target.style.animationIterationCount = "0";
      }
    });

    // ------------------------------------------------------------
    // 🪄 Transition to Flight-Cards View
    // ------------------------------------------------------------
    async function proceedToNextStage() {
      try {
        const workspace = document.getElementById("workspace");
        if (workspace) {
          const response = await fetch("/dev/flight-cards-con.html");
          const html = await response.text();

          const temp = document.createElement("div");
          temp.innerHTML = html;

          // Replace workspace content except script tags
          workspace.replaceChildren(
            ...Array.from(temp.childNodes).filter(
              (n) => n.nodeType !== 1 || n.tagName.toLowerCase() !== "script"
            )
          );

          // Execute scripts safely
          const scripts = Array.from(temp.querySelectorAll("script")).filter(
            (s) =>
              !["redemption-module.js", "redemption-bridge.js"].some((skip) =>
                (s.src || "").includes(skip)
              )
          );

          window._loadedScripts = window._loadedScripts || new Set();

          for (const oldScript of scripts) {
            const newScript = document.createElement("script");
            if (oldScript.src) {
              if (window._loadedScripts.has(oldScript.src)) continue;
              window._loadedScripts.add(oldScript.src);
              newScript.src = oldScript.src + `?v=${Date.now()}`;
              newScript.type = "text/javascript";
            } else {
              const code = oldScript.textContent.trim();
              if (window._loadedScripts.has(code)) continue;
              window._loadedScripts.add(code);
              newScript.textContent = code;
            }
            document.body.appendChild(newScript);
          }

          console.log("✅ Flight cards injected into workspace.");
        } else {
          console.warn("⚠️ Workspace not found — redirecting instead.");
          window.location.assign("/dev/flight-cards.html");
        }
      } catch (err) {
        console.error("❌ Flight-card injection error:", err);
      }
    }

    // ------------------------------------------------------------
    // 🌙 Fade-Out Bridge Observer
    // ------------------------------------------------------------
    const fadeOutBridge = () => {
      const msg = document.getElementById("card-message");
      if (msg) {
        msg.style.transition = "opacity 0.8s ease";
        msg.style.opacity = "0";
      }

      spinnerBridge.style.transition = "opacity 0.8s ease-in-out";
      spinnerBridge.style.opacity = "0";

      setTimeout(() => {
        if (spinnerBridge.parentElement) spinnerBridge.remove();
      }, 800);
    };

    const observer = new MutationObserver(() => {
      const form = document.querySelector("#redemption-form");
      if (form && form.style.display !== "none") {
        fadeOutBridge();
        observer.disconnect();
      }
    });
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // ============================================================
    // 🧩 Redemption Form Initialization
    // ============================================================
    loadAirports(); // preload airport list

    setupAutocomplete("origin", "origin-suggestions");
    setupAutocomplete("destination", "destination-suggestions");

    const directGroup = document.getElementById("directStop");
    const multiGroup = document.getElementById("multiConn");
    const posGroup = document.getElementById("posFlight");

    function activate(btn, group) {
      group.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }

    // Direct vs Multi-connection toggle logic
    if (directGroup && multiGroup) {
      directGroup.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          activate(btn, directGroup);
          if (btn.dataset.val === "yes") {
            const noBtn = multiGroup.querySelector('button[data-val="no"]');
            if (noBtn) {
              multiGroup.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
              noBtn.classList.add("active");
            }
          }
        });
      });

      multiGroup.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          activate(btn, multiGroup);
          if (btn.dataset.val === "yes") {
            const noBtn = directGroup.querySelector('button[data-val="no"]');
            if (noBtn) {
              directGroup.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
              noBtn.classList.add("active");
            }
          }
        });
      });
    }

    // Positioning flight toggle
    if (posGroup) {
      posGroup.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => activate(btn, posGroup));
      });
    }

    const searchBtn = document.getElementById("searchBtn");
    const warning = document.getElementById("searchWarning");

    // ---- Step-2 toggle groups
    document.querySelectorAll(".toggle-group").forEach((group) => {
      const btns = group.querySelectorAll("button");
      btns.forEach((btn) => {
        btn.addEventListener("click", () => {
          btns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          validateStep2();
        });
      });
    });

    function validateStep2() {
      const filled = [...document.querySelectorAll(".toggle-group")].every((g) =>
        g.querySelector("button.active")
      );
      searchBtn.disabled = !filled;
      warning.style.display = filled ? "none" : "block";
    }

    // ---- Date mode toggle
    const exactBtn = document.getElementById("exactBtn");
    const flexBtn = document.getElementById("flexBtn");
    const flexPicker = document.getElementById("flexPicker");
    if (exactBtn && flexBtn && flexPicker) {
      exactBtn.onclick = () => {
        exactBtn.classList.add("active");
        flexBtn.classList.remove("active");
        flexPicker.style.display = "none";
      };
      flexBtn.onclick = () => {
        flexBtn.classList.add("active");
        exactBtn.classList.remove("active");
        flexPicker.style.display = "block";
      };
    }
    // ============================================================
    // 🔍 Search Button Handler
    // ============================================================
    searchBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (searchBtn.disabled) return; // guard

      console.log("🟡 Unlocking redemption setup manually on click...");
      window._manualLaunch = true;
      window._setupLocked = false;

      // Run gold-card sequence
      await window.launchGoldCard?.();
      if (typeof window.createSpinnerBridge === "function") {
        window.createSpinnerBridge();
      }

      // Fade form out
      const form = document.getElementById("redemption-form");
      if (form) {
        form.style.transition = "none";
        form.style.opacity = "0";
        form.style.visibility = "hidden";
        form.style.pointerEvents = "none";
      }

      // === Build payload ===
      const payload = {
        origin: document.getElementById("origin").value.trim().toUpperCase(),
        destination: document
          .getElementById("destination")
          .value.trim()
          .toUpperCase(),
        passengers: document.getElementById("passengers").value,
        cabin: document.getElementById("cabin").value,
        program: document.getElementById("program").value,
        date: document.getElementById("departDate").value,
        flexDays: document.getElementById("flexDays")?.value || 0,
        mode: flexBtn.classList.contains("active") ? "flex" : "exact",
        direct: document.querySelector("#directStop button.active")?.dataset.val,
        multi: document.querySelector("#multiConn button.active")?.dataset.val,
        positioning:
          document.querySelector("#posFlight button.active")?.dataset.val,
      };

      // === Expand flexDays into date array ===
      const departDate = document.getElementById("departDate").value;
      const flexRange = parseInt(document.getElementById("flexDays").value) || 0;
      const searchDates = [];
      for (let i = -flexRange; i <= flexRange; i++) {
        const d = new Date(departDate);
        d.setDate(d.getDate() + i);
        searchDates.push(d.toISOString().split("T")[0]);
      }
      payload.searchDates = searchDates;
      delete payload.date;

      // === Validate ===
      if (!payload.origin || !payload.destination || !payload.searchDates?.length) {
        alert("Please complete all Step 1 fields before searching.");
        return;
      }

      console.log("IS outbound search payload:", payload);

      // ============================================================
      // 🚀 Redemption Fetch Call
      // ============================================================
      try {
        const res = await fetch("/api/redemption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        console.log("💗 Redemption API response:", data);
        localStorage.setItem(
          "latestRedemptionResults",
          JSON.stringify(data.results || [])
        );

        // ------------------------------------------------------------
        // ✨ Optional Shimmer Bridge Reload
        // ------------------------------------------------------------
        (async () => {
          const spinnerBridge = document.getElementById("spinner-bridge");
          const goldCard = document.querySelector(".gold-card");
          if (!spinnerBridge || !goldCard) return;

          spinnerBridge.style.zIndex = "99999";
          spinnerBridge.style.visibility = "visible";
          spinnerBridge.style.opacity = "1";
          spinnerBridge.style.display = "flex";
          goldCard.classList.add("active");

          // wait for shimmer animation period
          await new Promise((resolve) => setTimeout(resolve, 3000));
          console.log("✨ Shimmer complete — loading flight cards...");

          try {
            const res = await fetch("/dev/flight-cards.html");
            const html = await res.text();
            const workspace = document.getElementById("workspace");

            if (workspace) {
              const temp = document.createElement("div");
              temp.innerHTML = html;

              // Replace workspace content safely
              const children = Array.from(temp.childNodes);
              workspace.replaceChildren(
                ...children.filter(
                  (n) => n.nodeType !== 1 || n.tagName.toLowerCase() !== "script"
                )
              );

              // Execute inline & external scripts
              const scripts = Array.from(temp.querySelectorAll("script")).filter(
                (s) =>
                  !["redemption-module.js", "redemption-bridge.js"].some((skip) =>
                    (s.src || "").includes(skip)
                  )
              );

              window._loadedScripts = window._loadedScripts || new Set();

              for (const oldScript of scripts) {
                const newScript = document.createElement("script");
                if (oldScript.src) {
                  if (window._loadedScripts.has(oldScript.src)) continue;
                  window._loadedScripts.add(oldScript.src);
                  newScript.src = oldScript.src + `?v=${Date.now()}`;
                  newScript.type = "text/javascript";
                } else {
                  const code = oldScript.textContent.trim();
                  if (window._loadedScripts.has(code)) continue;
                  window._loadedScripts.add(code);
                  newScript.textContent = code;
                }
                document.body.appendChild(newScript);
              }

              const placeholder = workspace.querySelector("script");
              if (placeholder) placeholder.remove();

              console.log("✅ Flight cards injected successfully.");
            } else {
              console.warn("⚠️ No workspace found — redirecting.");
              window.location.href = "/dev/redemption-results.html";
            }
          } catch (err) {
            console.error("❌ Flight-card load error:", err);
          }
        })(); // shimmer-bridge reload
      } catch (err) {
        console.error("❌ Redemption fetch error:", err);
        alert("Search failed – check console for details.");
      }
    });

    // ============================================================
    // ♻️ Post-Injection Rebinds
    // ============================================================
    if (window.initRedemptionForm) window.initRedemptionForm();
    if (window.fetchIATA) window.fetchIATA();
    if (window.attachYesNoHandlers) window.attachYesNoHandlers();

    console.log(
      "♻️ Post-injection rebind executed for form, IATA, and yes/no handlers."
    );

    // Rebind new search button if DOM replaced
    setTimeout(() => {
      const newSearchBtn = document.getElementById("searchBtn");
      if (!newSearchBtn) {
        console.warn("⚠️ No searchBtn found after injection — skip rebind.");
        return;
      }

      console.log("🔁 Rebinding click handler to new Search button...");
      newSearchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (newSearchBtn.disabled) {
          console.log(
            "🚫 Search clicked while disabled — waiting for yes/no activation."
          );
          return;
        }

        console.log("🚀 Search button clicked — launching redemption flow...");
        if (typeof window.searchHandler === "function") {
          window.searchHandler(e);
        } else {
          console.warn("⚠️ No global searchHandler found.");
        }
      });
    }, 500);

    // ============================================================
    // ✅ Authoritative Yes/No Handler
    // ============================================================
    window.attachYesNoHandlers = function () {
      console.log("🧩 attachYesNoHandlers() initialized...");

      const ws = document.getElementById("workspace");
      if (!ws) {
        console.warn("⚠️ No workspace found for yes/no handler binding.");
        return;
      }

      // Prevent duplicates
      if (window._globalYesNoHandler) {
        ws.removeEventListener("click", window._globalYesNoHandler, false);
      }

      // Delegated click handler
      window._globalYesNoHandler = function (e) {
        const btn = e.target.closest("[data-val]");
        if (!btn) return;

        // toggle state within group
        const group = btn.closest(".toggle-group");
        if (group) {
          group.querySelectorAll("button").forEach((b) =>
            b.classList.remove("active")
          );
        }
        btn.classList.add("active");

        console.log(
          "🟢 Toggled:",
          btn.dataset.val,
          "within",
          group?.id || "(unknown group)"
        );

        // Enable search when all groups have selections
        const allGroups = ws.querySelectorAll(".toggle-group");
        const allSelected = Array.from(allGroups).every((g) =>
          g.querySelector("button.active")
        );

        const searchBtn = ws.querySelector("#searchBtn");
        const warning = ws.querySelector("#searchWarning");
        if (searchBtn) {
          searchBtn.disabled = !allSelected;
          if (warning) warning.style.display = allSelected ? "none" : "block";
          console.log("🔁 Search button disabled:", searchBtn.disabled);
        }
      };

      ws.addEventListener("click", window._globalYesNoHandler, false);
      console.log("✅ Yes/No handler attached to workspace (using data-val)");
    };

    // Observe DOM for redemption-form visibility to restore UI
    const observer = new MutationObserver(() => {
      const form = document.querySelector("#redemption-form");
      if (form && form.style.display !== "none") {
        fadeOutBridge();
        observer.disconnect();
      }
    });
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // ============================================================
    // 🧱 Deep-Hide Redemption Form Hierarchy (cleanup)
    // ============================================================
    const formContainerDeep = document.querySelector(
      "#redem-con-form, .redem-con-form, #search-form, .search-form"
    );
    if (formContainerDeep) {
      console.log("🧱 Locking form container completely...");
      formContainerDeep.style.setProperty("display", "none", "important");
      formContainerDeep.style.setProperty("visibility", "hidden", "important");
      formContainerDeep.style.setProperty("opacity", "0", "important");
      formContainerDeep.style.setProperty(
        "pointer-events",
        "none",
        "important"
      );

      // hide ancestors up to three levels
      let parent = formContainerDeep.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        if (parent.matches("section, div, form")) {
          parent.style.setProperty("visibility", "hidden", "important");
          parent.style.setProperty("opacity", "0", "important");
        }
        parent = parent.parentElement;
      }
    }

    // ============================================================
    // ✈️ Autocomplete Setup
    // ============================================================
    function setupAutocomplete(inputId, suggestionsId) {
      const input = document.getElementById(inputId);
      const suggestions = document.getElementById(suggestionsId);
      if (!input || !suggestions) return;

      input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        suggestions.innerHTML = "";
        if (query.length < 2) return;

        const matches = airports
          .filter(
            (a) =>
              a.iata.toLowerCase().includes(query) ||
              a.airport.toLowerCase().includes(query) ||
              (a.region_name &&
                a.region_name.toLowerCase().includes(query))
          )
          .slice(0, 10);

        matches.forEach((match) => {
          const div = document.createElement("div");
          div.classList.add("suggestion-item");
          div.innerHTML = `<span class="iata">${match.iata}</span> – <span class="airport">${match.airport}</span>`;
          div.addEventListener("click", () => {
            input.value = match.iata;
            suggestions.innerHTML = "";
          });
          suggestions.appendChild(div);
        });
      });

      // hide dropdown on outside click
      document.addEventListener("click", (e) => {
        if (!suggestions.contains(e.target) && e.target !== input) {
          suggestions.innerHTML = "";
        }
      });
    }

    // ============================================================
    // 🪄 Re-Initialize Autocompletes After Injection
    // ============================================================
    setTimeout(() => {
      if (document.getElementById("origin") && document.getElementById("destination")) {
        setupAutocomplete("origin", "origin-suggestions");
        setupAutocomplete("destination", "destination-suggestions");
        console.log("🔁 Autocompletes rebound after DOM injection.");
      }
    }, 1000);

    // ============================================================
    // 🧩 Final Shimmer Observer Validation
    // ============================================================
    document.addEventListener("animationend", (e) => {
      if (e.target.id === "shimmer-overlay") {
        console.log("🏁 Shimmer animation ended.");
        fadeOutBridge();
      }
    });

    console.log("✅ Redemption-module fully initialized and bound.");
  }); // END of DOMContentLoaded wrapper
  // ============================================================
  // 🧱 Global SpinnerBridge Safety Fallback
  // ============================================================
  let spinnerBridge = document.getElementById("spinner-bridge");
  if (!spinnerBridge) {
    spinnerBridge = document.createElement("div");
    spinnerBridge.id = "spinner-bridge";
    spinnerBridge.style.position = "absolute";
    spinnerBridge.style.inset = "0";
    spinnerBridge.style.display = "flex";
    spinnerBridge.style.alignItems = "center";
    spinnerBridge.style.justifyContent = "center";
    spinnerBridge.style.background =
      "linear-gradient(180deg, rgba(10,26,51,0.98) 0%, rgba(10,26,51,1) 100%)";
    spinnerBridge.style.zIndex = "99999";
    document.body.appendChild(spinnerBridge);
    console.log("📦 SpinnerBridge fallback created globally.");
  } else {
    console.log("✅ SpinnerBridge already present globally.");
  }

  // ============================================================
  // 💳 Global Gold Card Safety Fallback
  // ============================================================
  let goldCard = document.querySelector(".gold-card") || document.getElementById("gold-card");
  if (!goldCard) {
    goldCard = document.createElement("div");
    goldCard.id = "gold-card";
    goldCard.classList.add("gold-card");
    Object.assign(goldCard.style, {
      position: "relative",
      width: "260px",
      height: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      zIndex: 9999,
    });

    const cardImg = document.createElement("img");
    cardImg.src = "/dev/asset/CS_logo_vert_gold_card.png";
    cardImg.alt = "ConciergeSync™ Gold Card";
    Object.assign(cardImg.style, {
      width: "260px",
      height: "auto",
      display: "block",
      borderRadius: "8px",
      overflow: "hidden",
      clipPath: "inset(0 round 8px)",
    });
    goldCard.appendChild(cardImg);

    spinnerBridge.appendChild(goldCard);
    console.log("💳 GoldCard fallback reattached inside spinnerBridge.");
  } else {
    console.log("✅ GoldCard already present in DOM.");
  }

  // ============================================================
  // 🌈 Shimmer Overlay Initialization (global singleton)
  // ============================================================
  let shimmer = document.getElementById("shimmer-overlay");
  if (!shimmer) {
    shimmer = document.createElement("div");
    shimmer.id = "shimmer-overlay";
    Object.assign(shimmer.style, {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      background:
        "linear-gradient(100deg, transparent 10%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 52%, transparent 90%)",
      backgroundRepeat: "no-repeat",
      backgroundSize: "200% 100%",
      backgroundPosition: "-100% 0",
      mixBlendMode: "overlay",
      animation: "shimmerMove 5s ease-in-out infinite",
      pointerEvents: "none",
      borderRadius: "8px",
      overflow: "hidden",
      zIndex: 2,
    });

    // wait for goldCard to be ready
    const waitForCard = () => {
      const gold = document.querySelector(".gold-card");
      if (gold && gold.offsetWidth > 0) {
        gold.appendChild(shimmer);
        console.log("✨ Shimmer overlay attached to gold card.");
      } else {
        requestAnimationFrame(waitForCard);
      }
    };
    waitForCard();
  } else {
    console.log("✅ Shimmer overlay already exists.");
  }

  // ============================================================
  // 🪄 Dynamic Keyframes for Shimmer (singleton pattern)
  // ============================================================
  (() => {
    const id = "shimmer-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes shimmerMove {
          0%   { background-position: -120% 0; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { background-position: 120% 0; opacity: 0; }
        }`;
      document.head.appendChild(style);
      console.log("🎨 Global shimmer keyframes injected.");
    } else {
      console.log("✅ Shimmer keyframes already in DOM.");
    }
  })();

  // ============================================================
  // ✈️ Airport List Validation
  // ============================================================
  if (!window.airports || !window.airports.length) {
    console.log("🔄 Airport list empty — reloading iata-icao.json...");
    fetch("/dev/asset/iata-icao.json")
      .then((res) => res.json())
      .then((data) => {
        window.airports = data;
        console.log("✈️ Airports reloaded successfully:", data.length);
      })
      .catch((err) => console.error("❌ Failed to reload airports:", err));
  } else {
    console.log(`✈️ Airport dataset confirmed: ${window.airports.length} entries`);
  }

  // ============================================================
  // 🧩 Cleanup + Defensive Guards
  // ============================================================
  window._loadedScripts = window._loadedScripts || new Set();
  window._redemptionInitialized = window._redemptionInitialized || false;
  window._setupLocked = window._setupLocked ?? true;
  window._manualLaunch = window._manualLaunch ?? false;

  // Keep console tidy
  console.log(
    "🧭 Redemption-module environment stabilized. Flags:",
    "manualLaunch =", window._manualLaunch,
    "| setupLocked =", window._setupLocked,
    "| initialized =", window._redemptionInitialized
  );

  // ============================================================
  // 🩷 Final Aesthetic Touches
  // ============================================================
  if (goldCard && spinnerBridge) {
    spinnerBridge.style.backdropFilter = "blur(8px)";
    spinnerBridge.style.boxShadow = "inset 0 0 60px rgba(0,0,0,0.4)";
    goldCard.style.transition = "transform 0.6s ease";
    goldCard.addEventListener("mouseenter", () => {
      goldCard.style.transform = "scale(1.05)";
    });
    goldCard.addEventListener("mouseleave", () => {
      goldCard.style.transform = "scale(1)";
    });
    console.log("💅 Visual polish applied to spinner bridge + gold card.");
  }
  // ============================================================
  // 🧹 Shimmer / Transition Teardown
  // ============================================================
  const teardownShimmer = () => {
    const shimmer = document.getElementById("shimmer-overlay");
    const msg = document.getElementById("card-message");
    if (shimmer) {
      shimmer.style.transition = "opacity 0.6s ease";
      shimmer.style.opacity = "0";
      setTimeout(() => shimmer.remove(), 600);
    }
    if (msg) {
      msg.style.transition = "opacity 0.6s ease";
      msg.style.opacity = "0";
      setTimeout(() => msg.remove(), 600);
    }
    console.log("🧽 Shimmer + message elements cleaned up.");
  };

  // Watch shimmer completion to trigger teardown
  document.addEventListener("animationend", (e) => {
    if (e.target.id === "shimmer-overlay") {
      console.log("🏁 shimmerMove animation fully complete — tearing down.");
      teardownShimmer();
    }
  });

  // ============================================================
  // 🧩 Mutation Observer: Ensure Workspace Stability
  // ============================================================
  const workspaceObserver = new MutationObserver((mutations) => {
    const ws = document.getElementById("workspace");
    if (!ws) return;
    for (const m of mutations) {
      if (m.type === "childList" && ws.contains(document.getElementById("searchBtn"))) {
        console.log("🔁 Workspace mutated — re-attaching yes/no + autocomplete.");
        if (window.attachYesNoHandlers) window.attachYesNoHandlers();
        if (document.getElementById("origin")) setupAutocomplete("origin", "origin-suggestions");
        if (document.getElementById("destination")) setupAutocomplete("destination", "destination-suggestions");
      }
    }
  });
  workspaceObserver.observe(document.body, { childList: true, subtree: true });

  // ============================================================
  // 🧩 Event Safety: Handle Window Resets & Reloads
  // ============================================================
  window.addEventListener("beforeunload", () => {
    console.log("🧩 Cleaning up redemption-module state before unload.");
    workspaceObserver.disconnect();
    teardownShimmer();
    if (window._globalYesNoHandler) {
      const ws = document.getElementById("workspace");
      if (ws) ws.removeEventListener("click", window._globalYesNoHandler, false);
      delete window._globalYesNoHandler;
    }
    window._redemptionInitialized = false;
  });

  // ============================================================
  // 🧠 Diagnostic: Quick Manual Trigger Hooks
  // ============================================================
  window.redemptionDiagnostics = {
    relaunch: () => {
      console.log("🧠 Diagnostic relaunch triggered.");
      window._manualLaunch = true;
      window._setupLocked = false;
      window._redemptionInitialized = false;
      if (typeof window.launchGoldCard === "function") window.launchGoldCard();
    },
    reloadAirports: () => {
      console.log("🔁 Manual airport reload initiated.");
      fetch("/dev/asset/iata-icao.json")
        .then((r) => r.json())
        .then((data) => {
          window.airports = data;
          console.log("✈️ Reloaded airports manually:", data.length);
        })
        .catch((err) => console.error("❌ Airport reload failed:", err));
    },
    cleanup: teardownShimmer,
  };

  console.log(
    "%c🎯 ConciergeSync™ Redemption-Module fully loaded and ready.",
    "color:#f6b93b; font-weight:bold;"
  );
})(); // ✅ END entire redemption-module.js IIFE
