(() => {
  "use strict";

  /**********************************************************
   * BOOT
   **********************************************************/
  console.log("🧱 console-core.js loaded");

  /**********************************************************
   * GLOBAL DRAWER / HAMBURGER (CONSOLE-LEVEL, ALWAYS ON)
   * Survives workspace swaps
   **********************************************************/
  document.addEventListener("click", e => {
    // OPEN via hamburger
    const openBtn = e.target.closest("#navToggle");
    if (openBtn) {
      const sideNav = document.querySelector("#sideNav");
      if (!sideNav) {
        console.warn("⚠️ sideNav not found");
        return;
      }
      sideNav.classList.add("open");
      console.log("🍔 Drawer opened");
      return;
    }

    // CLOSE via X
    const closeBtn = e.target.closest("#closeNav");
    if (closeBtn) {
      const sideNav = document.querySelector("#sideNav");
      if (!sideNav) return;
      sideNav.classList.remove("open");
      console.log("❌ Drawer closed");
      return;
    }

    // CLOSE via nav click
    const navLink = e.target.closest("[data-page]");
    if (navLink) {
      const page = navLink.dataset.page;
      const sideNav = document.querySelector("#sideNav");
      if (sideNav) {
        sideNav.classList.remove("open");
        console.log("🧭 Nav click →", page);
      }
      loadPage(page);
      return;
    }
  });

  /**********************************************************
   * ROUTER (SINGLE SOURCE OF TRUTH)
   **********************************************************/
  window.loadPage = async function (page) {
    if (!page) return;

    console.log("📦 loadPage →", page);

    const workspace = document.querySelector("#workspace");
    if (!workspace) {
      console.error("❌ workspace not found");
      return;
    }

    try {
      const res = await fetch(`/dev/${page}.html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      workspace.innerHTML = html;

      console.log("⚡ Workspace injected →", page);

      document.dispatchEvent(
        new CustomEvent("module:ready", {
          detail: { page, workspace }
        })
      );
    } catch (err) {
      console.error("❌ loadPage failed:", err);
    }
  };

  /**********************************************************
   * MODULE LIFECYCLE (ONE LISTENER)
   **********************************************************/
  document.addEventListener("module:ready", e => {
    const { page, workspace } = e.detail || {};
    if (!page || !workspace) {
      console.warn("⚠️ module:ready missing data");
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
        console.log("ℹ️ No initializer for", page);
    }
  });

  /**********************************************************
   * WALLET
   **********************************************************/
  function initWallet(workspace) {
    console.log("💳 Wallet initialized");

    const cards = workspace.querySelectorAll(".wallet-card");
    const txBtn = workspace.querySelector("#see-transactions-btn");
    const txPanel = workspace.querySelector("#transactions");

    if (txBtn) txBtn.hidden = true;
    if (txPanel) txPanel.hidden = true;

    let activeCard = null;

    cards.forEach(card => {
      card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");

        activeCard = card.dataset.cardId || null;
        console.log("💳 Active card:", activeCard);

        if (txBtn) txBtn.hidden = false;
      });
    });

    if (txBtn && txPanel) {
      txBtn.addEventListener("click", () => {
        if (!activeCard) return;
        txPanel.hidden = false;
        console.log("📄 Transactions shown for", activeCard);
      });
    }
  }

  /**********************************************************
   * DISCOVERY / FLIGHT DECK
   **********************************************************/
  function initDiscovery(workspace) {
    console.log("🛫 Discovery initialized");
    // Existing discovery logic lives here
  }

})();
