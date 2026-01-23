(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  /* =========================================================
     GLOBAL NAV DRAWER — ALWAYS ON, NEVER REBOUND
     ========================================================= */

  document.addEventListener("click", e => {
    // OPEN via hamburger
    const openBtn = e.target.closest("#navToggle");
    if (openBtn) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) {
        console.warn("⚠️ sideNav not found");
        return;
      }
      drawer.classList.add("open");
      console.log("🍔 Drawer opened");
      return;
    }

    // CLOSE via X
    const closeBtn = e.target.closest("#closeNav");
    if (closeBtn) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) return;
      drawer.classList.remove("open");
      console.log("❌ Drawer closed");
      return;
    }
  });

  /* =========================================================
     WORKSPACE LIFECYCLE — PAGE LOGIC ONLY
     ========================================================= */

  document.addEventListener("module:ready", e => {
    const { page, workspace } = e.detail || {};

    if (!page || !workspace) {
      console.warn("⚠️ module:ready fired without page/workspace");
      return;
    }

    console.log(`🧭 Workspace ready → ${page}`);

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

  /* =========================================================
     WALLET (SAFE / VERIFICATION ONLY)
     ========================================================= */

  function initWallet(workspace) {
    console.log("💳 Wallet initialized");
    // features intentionally minimal for now
  }

  /* =========================================================
     DISCOVERY (PLACEHOLDER)
     ========================================================= */

  function initDiscovery(workspace) {
    console.log("🧭 Discovery initialized");
  }

})();
