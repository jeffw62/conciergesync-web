(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  /* =====================================================
     GLOBAL STATE
  ===================================================== */
  const state = {
    workspace: null,
    currentPage: null
  };

  /* =====================================================
     GLOBAL UI — HAMBURGER / DRAWER (INIT ONCE)
  ===================================================== */
  function initDrawer() {
    const hamburger = document.querySelector("#hamburger");
    const drawer = document.querySelector("#drawer");
    const closeBtn = document.querySelector("#closeNav");

    if (!hamburger || !drawer) {
      console.error("❌ Drawer elements missing");
      return;
    }

    console.log("🍔 Drawer initialized");

    hamburger.addEventListener("click", () => {
      drawer.classList.add("open");
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        drawer.classList.remove("open");
      });
    }
  }

  /* =====================================================
     WORKSPACE LOADER
  ===================================================== */
  async function loadWorkspace(page) {
    const workspace = document.querySelector("#workspace");
    if (!workspace) {
      console.error("❌ Workspace container missing");
      return;
    }

    if (state.currentPage === page) return;

    console.log(`🧭 Loading workspace → ${page}`);
    state.currentPage = page;
    state.workspace = workspace;

    const res = await fetch(`/dev/${page}.html`);
    const html = await res.text();
    workspace.innerHTML = html;

    workspace.dispatchEvent(
      new CustomEvent("workspace:ready", {
        detail: { page, workspace }
      })
    );
  }

  /* =====================================================
     WALLET MODULE
  ===================================================== */
  function initWallet(workspace) {
    console.log("💳 Wallet initialized");

    const cards = workspace.querySelectorAll(".wallet-card");
    const seeBtn = workspace.querySelector("#see-transactions-btn");
    const zoneD = workspace.querySelector("#wallet-zone-d");

    cards.forEach(card => {
      card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("is-active"));
        card.classList.add("is-active");

        if (seeBtn) seeBtn.hidden = false;
        if (zoneD) zoneD.hidden = true;
      });
    });

    if (seeBtn && zoneD) {
      seeBtn.addEventListener("click", () => {
        zoneD.hidden = false;
      });
    }
  }

  /* =====================================================
     DISCOVERY MODULE (STUB — SAFE)
  ===================================================== */
  function initDiscovery() {
    console.log("🛫 Discovery initialized");
  }

  /* =====================================================
     WORKSPACE ROUTER
  ===================================================== */
  document.addEventListener("workspace:ready", e => {
    const { page, workspace } = e.detail;

    if (page === "wallet-con") initWallet(workspace);
    if (page === "redem-con") initDiscovery(workspace);
  });

  /* =====================================================
     BOOTSTRAP (RUN ONCE)
  ===================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initDrawer();

    // default entry
    loadWorkspace("wallet-con");

    // nav wiring
    document.querySelectorAll("[data-nav]").forEach(btn => {
      btn.addEventListener("click", e => {
        const page = e.currentTarget.dataset.nav;
        if (page) loadWorkspace(page);
      });
    });
  });

})();
