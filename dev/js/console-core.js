(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // ==================================================
  // GLOBAL UI — CONSOLE SHELL (RUNS ONCE)
  // ==================================================

  document.addEventListener("click", e => {

    // --- HAMBURGER OPEN ---
    if (e.target.closest("#navToggle")) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) return console.warn("⚠️ sideNav not found");
      drawer.classList.add("open");
      console.log("🍔 Drawer opened");
      return;
    }

    // --- HAMBURGER CLOSE ---
    if (e.target.closest("#closeNav")) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) return;
      drawer.classList.remove("open");
      console.log("❌ Drawer closed");
      return;
    }

    // --- NAVIGATION CLICK ---
    const navLink = e.target.closest("[data-page]");
    if (navLink) {
      e.preventDefault();

      const page = navLink.dataset.page;
      console.log("🧭 Nav click →", page);

      const drawer = document.querySelector("#sideNav");
      if (drawer) drawer.classList.remove("open");

      loadPage(page);
    }
  });

  // ==================================================
  // WORKSPACE LOADER (REPLACES CONTENT ONLY)
  // ==================================================

  async function loadPage(page) {
    console.log("📦 loadPage →", page);

    const workspace = document.querySelector("#workspace");
    if (!workspace) {
      console.error("❌ #workspace not found");
      return;
    }

    const res = await fetch(`/dev/${page}.html`);
    const html = await res.text();

    workspace.innerHTML = html;

    document.dispatchEvent(
      new CustomEvent("module:ready", {
        detail: { page, workspace }
      })
    );
  }

  // ==================================================
  // PAGE LIFECYCLE — SINGLE SOURCE OF TRUTH
  // ==================================================

  document.addEventListener("module:ready", e => {
    const { page, workspace } = e.detail || {};

    if (!page || !workspace) {
      console.warn("⚠️ module:ready without context");
      return;
    }

    console.log("⚙️ Workspace ready →", page);

    switch (page) {
      case "wallet-con":
        initWallet(workspace);
        break;

      case "redem-con":
        initDiscovery(workspace);
        break;

      default:
        console.log("ℹ️ No initializer for", page);
    }
  });

  // ==================================================
  // WALLET INIT (SCOPED ONLY)
  // ==================================================

  function initWallet(workspace) {
    console.log("💳 Wallet initialized");

    const cards = workspace.querySelectorAll(".wallet-card");
    const txBtn = workspace.querySelector("#see-transactions-btn");
    const txZone = workspace.querySelector("#transactions");

    if (txBtn) txBtn.hidden = true;
    if (txZone) txZone.hidden = true;

    cards.forEach(card => {
      card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        if (txBtn) txBtn.hidden = false;
        console.log("🪪 Active card:", card.dataset.cardId || "unknown");
      });
    });

    if (txBtn && txZone) {
      txBtn.addEventListener("click", () => {
        txZone.hidden = false;
        console.log("📄 Transactions revealed");
      });
    }
  }

  // ==================================================
  // DISCOVERY INIT (SCOPED ONLY)
  // ==================================================

  function initDiscovery(workspace) {
    console.log("✈️ Discovery initialized");
    // Existing discovery logic goes here
  }

})();
