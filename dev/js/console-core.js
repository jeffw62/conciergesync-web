(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // ==================================================
  // GLOBAL PAGE ROUTER (SINGLE SOURCE OF TRUTH)
  // ==================================================
  window.loadPage = async function (page) {
    if (!page) {
      console.warn("⚠️ loadPage called without page");
      return;
    }
  
    console.log("🚦 loadPage →", page);
  
    // Find workspace container
    const workspace = document.querySelector("#workspace");
    if (!workspace) {
      console.error("❌ Workspace container not found");
      return;
    }
  
    try {
      // Fetch page HTML
      const res = await fetch(`/dev/${page}.html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      const html = await res.text();
      workspace.innerHTML = html;
  
      // Notify system that workspace is ready
      document.dispatchEvent(
        new CustomEvent("module:ready", {
          detail: { page, workspace }
        })
      );
  
      console.log("🧭 Workspace ready →", page);
  
    } catch (err) {
      console.error("❌ loadPage failed:", err);
    }
  };
  
  // ==================================================
  // GLOBAL DRAWER / NAV (ALWAYS ON — CONSOLE-LEVEL)
  // ==================================================

  document.addEventListener("click", e => {

    // -----------------------------
    // OPEN via hamburger
    // -----------------------------
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

    // -----------------------------
    // CLOSE via X
    // -----------------------------
    const closeBtn = e.target.closest("#closeNav");
    if (closeBtn) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) return;

      drawer.classList.remove("open");
      console.log("❌ Drawer closed");
      return;
    }

    // -----------------------------
    // NAVIGATION via menu link
    // -----------------------------
    const navLink = e.target.closest("a[data-page]");
    if (navLink) {
      e.preventDefault();

      const page = navLink.dataset.page;
      const drawer = document.querySelector("#sideNav");
      if (drawer) drawer.classList.remove("open");

      console.log("🧭 Nav click →", page);

      if (typeof window.loadPage === "function") {
        window.loadPage(page);
      } else {
        console.error("❌ window.loadPage is not defined");
      }

      return;
    }

  });

})();
