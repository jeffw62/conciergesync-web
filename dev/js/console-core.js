(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // ==================================================
  // GLOBAL DRAWER / NAV — ALWAYS ON (CONSOLE LEVEL)
  // ==================================================

  document.addEventListener("click", e => {
    // Open via hamburger
    const navToggle = e.target.closest("#navToggle");
    if (navToggle) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) {
        console.warn("⚠️ sideNav not found");
        return;
      }
      drawer.classList.add("open");
      console.log("🍔 Drawer opened");
      return;
    }

    // Close via X
    const closeBtn = e.target.closest("#closeNav");
    if (closeBtn) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) return;
      drawer.classList.remove("open");
      console.log("❌ Drawer closed");
      return;
    }

    // Nav link click
    const navLink = e.target.closest("[data-page]");
    if (navLink) {
      e.preventDefault();
      const page = navLink.dataset.page;
      console.log(`🧭 Nav click → "${page}"`);

      const drawer = document.querySelector("#sideNav");
      if (drawer) drawer.classList.remove("open");

      window.loadPage(page);
    }
  });

  // ==================================================
  // PAGE LOADER — SINGLE SOURCE OF TRUTH
  // ==================================================

  window.loadPage = async function loadPage(page) {
    const workspace = document.querySelector("#workspace");
    if (!workspace) {
      console.error("❌ #workspace not found");
      return;
    }

    console.log(`🚦 loadPage → "${page}"`);

    try {
      const res = await fetch(`/dev/${page}.html`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load ${page}.html`);
      }

      const html = await res.text();
      workspace.innerHTML = html;

      // Fire lifecycle event AFTER DOM injection
      requestAnimationFrame(() => {
        document.dispatchEvent(
          new CustomEvent("module:ready", {
            detail: { page, workspace }
          })
        );
      });

    } catch (err) {
      console.error("❌ loadPage error:", err);
      workspace.innerHTML = `
        <div style="padding:40px;color:white;">
          <h2>Failed to load ${page}</h2>
          <p>${err.message}</p>
        </div>
      `;
    }
  };

  // ==================================================
  // MODULE LIFECYCLE — PAGE LOGIC ONLY
  // ==================================================

  document.addEventListener("module:ready", e => {
    const { page, workspace } = e.detail || {};
    if (!page || !workspace) {
      console.warn("⚠️ module:ready missing data");
      return;
    }

    console.log(`⏱️ Workspace ready → "${page}"`);

    switch (page) {
      case "wallet-con":
        initWallet(workspace);
        break;

      case "redem-con":
        initDiscovery(workspace);
        break;

      default:
        console.log("ℹ️ No initializer for page:", page);
    }
  });

  // ==================================================
  // WALLET INIT (VERIFICATION ONLY — SAFE)
  // ==================================================

  function initWallet(workspace) {
    console.log("💳 Wallet initialized");
    // Wallet logic goes here
  }

  // ==================================================
  // DISCOVERY INIT (VERIFICATION ONLY — SAFE)
  // ==================================================

  function initDiscovery(workspace) {
    console.log("✈️ Discovery initialized");
    // Discovery logic goes here
  }

})();
