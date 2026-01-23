(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // ==================================================
  // GLOBAL DRAWER — SINGLE SOURCE OF TRUTH
  // ==================================================
  // This NEVER depends on workspace.
  // This NEVER reinitializes.
  // This NEVER breaks unless IDs change.
  // ==================================================

  const DRAWER_ID = "#sideNav";
  const TOGGLE_ID = "#navToggle";
  const CLOSE_ID  = "#closeNav";

  document.addEventListener("click", e => {
    const drawer = document.querySelector(DRAWER_ID);
    if (!drawer) {
      console.warn("⚠️ sideNav not found");
      return;
    }

    // OPEN via hamburger
    if (e.target.closest(TOGGLE_ID)) {
      drawer.classList.add("open");
      console.log("🍔 Drawer opened");
      return;
    }

    // CLOSE via X
    if (e.target.closest(CLOSE_ID)) {
      drawer.classList.remove("open");
      console.log("❌ Drawer closed");
      return;
    }

    // CLOSE via nav link click
    const navLink = e.target.closest("a[data-page]");
    if (navLink) {
      drawer.classList.remove("open");
      console.log("🧭 Nav click → drawer closed");
      return;
    }
  });

  // ==================================================
  // WORKSPACE LIFECYCLE — PAGE LOGIC ONLY
  // ==================================================
  // This does NOT touch hamburger.
  // ==================================================

  document.addEventListener("module:ready", e => {
    const { page, workspace } = e.detail || {};
    if (!page || !workspace) {
      console.warn("⚠️ module:ready without page/workspace");
      return;
    }

    console.log("🧭 Workspace ready →", page);

    switch (page) {
      case "wallet-con":
        initWallet(workspace);
        break;

      case "redem-con":
        initDiscovery(workspace);
        break;

      default:
        console.log("ℹ️ No page initializer for", page);
    }
  });

  // ==================================================
  // WALLET — VERIFICATION ONLY (SAFE)
  // ==================================================

  function initWallet(workspace) {
    console.log("💳 Wallet initialized");
  }

  // ==================================================
  // DISCOVERY — VERIFICATION ONLY (SAFE)
  // ==================================================

  function initDiscovery(workspace) {
    console.log("🔍 Discovery initialized");
  }

})();
