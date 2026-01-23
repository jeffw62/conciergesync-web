/**
 * ===========================================================
 * ConciergeSync™ Console Core — v2025.11.06
 * Purpose: Unified orchestration for all console interactions
 * Creed Alignment: Clarity • Clean • Truth
 * ===========================================================
 */

(() => {
  "use strict";

  /**
   * 🧭 1. Footer Loader + Header Navigation
   * -----------------------------------------------------------
   * Loads footer content once, attaches hamburger logic safely,
   * and reinitializes automatically when modules are injected.
   */
  function initializeFooterAndNav() {
    const footerEl = document.getElementById("footer");
    if (footerEl && !footerEl.dataset.loaded) {
      fetch("/dev/footer.html")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(html => {
          footerEl.innerHTML = html;
          footerEl.dataset.loaded = "true";
          console.log("✅ Footer loaded successfully.");
        })
        .catch(err => console.error("❌ Footer failed to load:", err));
    } else if (!footerEl) {
      console.warn("⚠️ #footer element not found in DOM.");
    }

    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("header nav");
    if (toggle && nav) {
      toggle.removeEventListener("click", window._footerNavHandler || (() => {}));
      window._footerNavHandler = () => {
        nav.classList.toggle("active");
        console.log(`🍔 Nav menu toggled → ${nav.classList.contains("active") ? "open" : "closed"}`);
      };
      toggle.addEventListener("click", window._footerNavHandler);
    } else {
      console.warn("⚠️ Hamburger or nav not found in DOM.");
    }
  }

  document.addEventListener("module:ready", e => {
  const { page } = e.detail || {};
  if (!page) return;

  initializeFooterAndNav();


  /**
   * 💳 Wallet — Active Card State (FOUNDATIONAL)
   * --------------------------------------------------
   * Establishes which card is currently in focus.
   * No UI mutation tied to card selection.
   * Zone D visibility is user-intent driven only.
   */
      document.addEventListener("module:ready", e => {
      const { page, workspace } = e.detail || {};
      if (page !== "wallet-con" || !workspace) return;
    
      let activeCardId = null;
    
      const zoneD = workspace.querySelector("#wallet-zone-d");
      const seeTransactionsBtn = workspace.querySelector("#see-transactions-btn");
    
      // ─────────────────────────────────────────────
      // Initial state (ON LOAD)
      // ─────────────────────────────────────────────
      if (zoneD) zoneD.hidden = true;
      if (seeTransactionsBtn) seeTransactionsBtn.hidden = true;
    
      // ─────────────────────────────────────────────
      // Card selection → set state + reveal button
      // ─────────────────────────────────────────────
      workspace.addEventListener("click", e => {
        const card = e.target.closest(".wallet-card");
        if (!card) return;
      
        activeCardId = card.dataset.cardId || null;
        console.log("💳 Active card:", activeCardId);
      
        // Explicit reveal — HTML was hidden by default
        if (seeTransactionsBtn) {
          seeTransactionsBtn.hidden = false;
        }
      });
    
      // ─────────────────────────────────────────────
      // Explicit user intent → show transactions
      // ─────────────────────────────────────────────
      if (seeTransactionsBtn) {
        seeTransactionsBtn.addEventListener("click", () => {
          console.log("📂 See Transactions clicked for:", activeCardId);
          if (!zoneD || !activeCardId) return;
          zoneD.hidden = false;
        });
      }
    });
  
    // 👇 Explicit user intent: reveal transactions
    if (seeTransactionsBtn) {
      seeTransactionsBtn.addEventListener("click", () => {
        console.log("🧪 See Transactions button clicked");
    
        if (!zoneD) return;
    
        zoneD.hidden = false;
      });
    }
  });
  
  /**
   * 💹 2. Avg Cost per Mile Ticker
   * -----------------------------------------------------------
   * Displays subtle randomized motion of CPM ticker.
   */
  function initializeTicker() {
    const tickerValue = document.getElementById("tickerValue");
    const tickerTrend = document.getElementById("tickerTrend");
    if (!tickerValue || !tickerTrend) return;

    clearInterval(window._tickerInterval);
    let current = parseFloat(tickerValue.dataset.start || "2.13");
    tickerValue.textContent = current.toFixed(2) + "¢";
    tickerTrend.textContent = "▲";
    tickerTrend.className = "good";

    window._tickerInterval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.1;
      current = Math.max(1.5, Math.min(3.5, current + delta));
      const goingDown = delta < 0;
      tickerValue.textContent = current.toFixed(2) + "¢";
      tickerTrend.textContent = goingDown ? "▼" : "▲";
      tickerTrend.className = goingDown ? "bad" : "good";
    }, 3000);

    console.log("💹 Ticker initialized.");
  }

  document.addEventListener("module:ready", e => {
    if (e.detail?.workspace) initializeTicker();
  });

  initializeTicker();

  /**
   * 👋 3. Greeting + Account Dropdown
   * -----------------------------------------------------------
   * Personal greeting and secure dropdown toggle for account menu.
   */
  function initializeHeaderLogic() {
    const welcomeMsg = document.getElementById("welcome-message");
    if (welcomeMsg) {
      const now = new Date();
      const hour = now.getHours();
      const username = window.currentUser || "Jeff";
      const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
      welcomeMsg.textContent = `${greeting}, ${username}.`;
      console.log("👋 Greeting updated:", welcomeMsg.textContent);
    }

    const accountBtn = document.getElementById("accountBtn");
    const accountMenu = accountBtn?.parentElement;
    if (accountBtn && accountMenu) {
      accountBtn.removeEventListener("click", window._accountClickHandler || (() => {}));
      document.removeEventListener("click", window._accountOutsideHandler || (() => {}));

      window._accountClickHandler = () => {
        accountMenu.classList.toggle("active");
        console.log("👤 Account menu toggled:", accountMenu.classList.contains("active"));
      };

      window._accountOutsideHandler = e => {
        if (!accountMenu.contains(e.target)) accountMenu.classList.remove("active");
      };

      accountBtn.addEventListener("click", window._accountClickHandler);
      document.addEventListener("click", window._accountOutsideHandler);
    }
    console.log("✅ Header logic initialized.");
  }

  document.addEventListener("module:ready", e => {
    if (e.detail?.workspace) initializeHeaderLogic();
  });

  initializeHeaderLogic();

  /**
   * 🧩 4. Global Module Loader
   * -----------------------------------------------------------
   * Central nervous system of the console: handles dynamic loading,
   * smooth fade transitions, and lifecycle events.
   */
  function initializeModuleLoader() {
    const workspace = document.getElementById("workspace");
    if (!workspace) {
      console.error("❌ No workspace element found on page load.");
      return;
    }

    if (window._moduleLoaderInitialized) {
      console.log("ℹ️ Module loader already active — skipping reinit.");
      return;
    }
    window._moduleLoaderInitialized = true;

    const routes = {
      "cons-con": "/dev/cons-con.html",
      "wallet-con": "/dev/wallet-con.html",
      "redem-con": "/dev/redem-con.html",
      "prog-con": "/dev/prog-con.html",
      "bonus-con": "/dev/bonus-con.html",
      "hints-con": "/dev/hints-con.html"
    };

    // --- Load CSS with cache-bust (ensures fresh render per module) ---
    function loadCSS(href) {
      // remove existing instance to avoid duplicates
      const existing = [...document.querySelectorAll("link")].find(l =>
        l.href.includes("redem-con.css")
      );
      if (existing) existing.remove();
    
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href + "?_t=" + Date.now();
      document.head.appendChild(link);
    }

    window.loadPage = async function (page) {
      if (!page) return;
        const path = routes[page];
        if (!path) {
          workspace.innerHTML = `<p class="missing">Unknown section: ${page}</p>`;
          return;
        }
        
        // 🔒 Prevent double-load
        if (window._loadingInProgress) return;
        window._loadingInProgress = true;
        
        // 🧹 HARD CLEAR — prevents old module flash
        workspace.replaceChildren();
        workspace.style.transition = "none";
        workspace.style.opacity = "0";
        
        // Allow transition again on next frame
        requestAnimationFrame(() => {
          workspace.style.transition = "opacity 0.3s ease";
        });

        // --- Load module CSS BEFORE fetching HTML ---
        const moduleCSS = {
          "redem-con": [
            "/dev/css/redem-con.css",
          ],
          "wallet-con": [
            "/dev/css/wallet-con.css",
            "/dev/css/wallet-ui.css",
          ],
        };
        
        if (moduleCSS[page]) {
          moduleCSS[page].forEach(loadCSS);
        }

        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        try {

        document.dispatchEvent(new CustomEvent("module:unload", { detail: { previous: page } }));

        const _moduleScripts = Array.from(doc.querySelectorAll('script'));
        workspace.replaceChildren(...doc.body.children);
        // -----------------------------
        // Re-execute captured scripts (robust, cache-bust safe)
        // Uses the scripts snapshot taken from `doc` before we moved nodes into workspace.
        // -----------------------------
          for (const oldScript of _moduleScripts) {
            if (oldScript.src) {
              try {
                // fetch the script text bypassing cache
                const resp = await fetch(oldScript.src, { cache: 'no-store' });
                if (!resp.ok) throw new Error(`Fetch ${oldScript.src} failed: ${resp.status}`);
                const text = await resp.text();
        
                // create a blob URL so browser sees a unique URL & executes it
                const blob = new Blob([text], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
        
                const s = document.createElement('script');
                s.setAttribute('data-temp', '1');
                if (oldScript.async) s.async = true;
                if (oldScript.defer) s.defer = true;
                s.src = blobUrl;
                document.body.appendChild(s);
        
                s.addEventListener('load', () => {
                  try { URL.revokeObjectURL(blobUrl); } catch (e) {}
                });
                setTimeout(() => {
                  try { URL.revokeObjectURL(blobUrl); } catch (e) {}
                }, 60_000);
        
                console.log(`🔁 Re-executed external script via blob: ${oldScript.src}`);
              } catch (err) {
                console.error(`❌ Failed to re-execute external script ${oldScript.src}:`, err);
              }
            } else {
              // Inline script: inject text so it executes in page scope
              try {
                const s = document.createElement('script');
                s.setAttribute('data-temp', '1');
                s.textContent = oldScript.textContent;
                document.body.appendChild(s);
                console.log('🔁 Re-executed inline script');
              } catch (err) {
                console.error('❌ Failed to re-execute inline script:', err);
              }
            }
          }

        workspace.scrollTop = 0;

        // 🔁 Re-activate any <script> tags inside injected module
        doc.querySelectorAll("script").forEach(oldScript => {
          const newScript = document.createElement("script");
        
          if (oldScript.src) {
            newScript.src = oldScript.src;
            newScript.async = false; // preserve order
          } else {
            newScript.textContent = oldScript.textContent;
          }
        
          if (newScript.src) {
          // force a unique cache-buster each load
          const cacheBust = `&_t=${Date.now()}`;
          const srcBase = newScript.src.includes("?")
            ? `${newScript.src}${cacheBust}`
            : `${newScript.src}?_t=${Date.now()}`;
          newScript.src = srcBase;
        }
        document.body.appendChild(newScript);
        });
          
        console.log("⚙️ Re-executed script tags for module:", page);

        requestAnimationFrame(() => {
          workspace.style.opacity = "1";
          workspace.classList.add("fade-in");
          setTimeout(() => workspace.classList.remove("fade-in"), 400);
        });

        document.dispatchEvent(new CustomEvent("module:ready", { detail: { page, workspace } }));
        console.log(`✅ Module injected and ready: ${page}`);
      } catch (err) {
        console.error(`❌ Failed to load module ${page}:`, err);
        workspace.innerHTML = `<p class="error">Failed to load ${page}</p>`;
        workspace.style.opacity = "1";
      } finally {
        window._loadingInProgress = false;
      }
    };

    console.log("✅ Global module loader initialized.");
  }

  initializeModuleLoader();
   
  /**
   * 🍔 5. Hamburger Drawer Logic
   * -----------------------------------------------------------
   * Accessible mobile navigation system with ESC close and scroll lock.
   */
  function initDrawer() {
    const navToggle = document.getElementById("navToggle");
    const sideNav = document.getElementById("sideNav");
    const closeNav = document.getElementById("closeNav");

    if (!navToggle || !sideNav) {
      console.warn("⚠️ Drawer elements missing — skipping init");
      return;
    }

    navToggle.removeEventListener("click", window._drawerToggleHandler || (() => {}));
    closeNav?.removeEventListener("click", window._drawerCloseHandler || (() => {}));
    document.removeEventListener("click", window._drawerOutsideHandler || (() => {}));
    document.removeEventListener("keydown", window._drawerEscHandler || (() => {}));

    window._drawerToggleHandler = () => {
      const isOpen = sideNav.classList.toggle("open");
      document.body.style.overflow = isOpen ? "hidden" : "";
      sideNav.setAttribute("aria-expanded", isOpen);
      console.log(`🍔 Drawer toggled → ${isOpen ? "open" : "closed"}`);
    };

    window._drawerCloseHandler = () => {
      sideNav.classList.remove("open");
      document.body.style.overflow = "";
      sideNav.setAttribute("aria-expanded", "false");
    };

    window._drawerOutsideHandler = e => {
      if (sideNav.classList.contains("open") && !sideNav.contains(e.target) && !navToggle.contains(e.target)) {
        window._drawerCloseHandler();
      }
    };

    window._drawerEscHandler = e => {
      if (e.key === "Escape" && sideNav.classList.contains("open")) {
        window._drawerCloseHandler();
      }
    };

    navToggle.addEventListener("click", window._drawerToggleHandler);
    closeNav?.addEventListener("click", window._drawerCloseHandler);
    document.addEventListener("click", window._drawerOutsideHandler);
    document.addEventListener("keydown", window._drawerEscHandler);

      // 🔗 Nav link routing (single source of truth)
      const navLinks = document.querySelectorAll("#sideNav a[data-page], .nav-link");
    
      navLinks.forEach(link => {
        link.removeEventListener("click", window._navRouteHandler || (() => {}));
      });
    
      window._navRouteHandler = async e => {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        if (!page) return;
    
        console.log(`🧭 Nav → ${page}`);
        await window.loadPage(page);
    
        // close drawer after navigation
        sideNav.classList.remove("open");
        document.body.style.overflow = "";
      };
    
      navLinks.forEach(link =>
        link.addEventListener("click", window._navRouteHandler)
      );
    
    console.log("✅ Drawer logic initialized");
  }

  document.addEventListener("module:ready", () => {
    initDrawer();
  });

  // initial load
  initDrawer();
})();
