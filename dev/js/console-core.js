(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL DRAWER (ALWAYS-ON)
  // --------------------------------------------------
  document.addEventListener("click", e => {
    // Open via hamburger
    const hamburger = e.target.closest("#navToggle");
    if (hamburger) {
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
  });

  // --------------------------------------------------
  // SINGLE LIFECYCLE ENTRY (PAGE LOGIC ONLY)
  // --------------------------------------------------
  document.addEventListener("module:ready", e => {
    console.log("🚨 module:ready FIRED", e.detail);
    const { page, workspace } = e.detail || {};
    if (!page || !workspace) return;

    console.log(`🧭 module:ready → ${page}`);

    if (page === "wallet-con") {
      initWallet(workspace);
    }
  });

  // --------------------------------------------------
  // WALLET INIT (VERIFICATION ONLY — NO FEATURES YET)
  // --------------------------------------------------
  function initWallet(workspace) {
    console.log("💳 Wallet initialized");
  }

  // --------------------------------------------------
  // WORKSPACE LIFECYCLE — SINGLE SOURCE OF TRUTH
  // --------------------------------------------------
  document.addEventListener("module:ready", e => {
    const { page, workspace } = e.detail || {};
  
    if (!workspace || !page) {
      console.warn("⚠️ module:ready fired without page/workspace");
      return;
    }
  
    console.log("🧭 Workspace ready →", page);
  
    // Page-specific wiring ONLY
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

})();
