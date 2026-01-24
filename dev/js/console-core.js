/*
========================================================================
⚠️  WARNING — DO NOT MODIFY
========================================================================
This file is LOCKED.

Purpose:
- Global console chrome ONLY
- Header navigation
- Account menu
- Hamburger / side navigation

Explicitly NOT allowed in this file:
- Page logic
- Workspace logic
- Module initialization
- Data fetching
- UI state for sub-pages

Any modification requires:
- Senior engineer review
- Jeff Wynn approval

Violation of this boundary WILL break the console and will
result in immediate termination of your employment!
========================================================================
*/

(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  document.addEventListener("DOMContentLoaded", () => {
    console.log("🧱 console-core.js DOM ready");

    const sideNav    = document.getElementById("sideNav");
    const closeNav   = document.getElementById("closeNav");
    const navToggle  = document.getElementById("navToggle");
    const accountBtn = document.getElementById("accountBtn");

    if (!sideNav) {
      console.warn("⚠️ sideNav not found");
      return;
    }

    /* -------------------------------
       OPEN / CLOSE DRAWER
    -------------------------------- */

    function openDrawer() {
      sideNav.classList.add("open");
      console.log("🍔 Drawer opened");
    }

    function closeDrawer() {
      sideNav.classList.remove("open");
      console.log("❌ Drawer closed");
    }

    navToggle?.addEventListener("click", openDrawer);
    accountBtn?.addEventListener("click", openDrawer);
    closeNav?.addEventListener("click", closeDrawer);

    /* -------------------------------
       NAVIGATION INSIDE DRAWER
       (THIS WAS THE MISSING PIECE)
    -------------------------------- */

    sideNav.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-page]");
      if (!link) return;

      e.preventDefault();

      const page = link.dataset.page;
      console.log(`🧭 Nav click → "${page}"`);

      closeDrawer();

      if (typeof window.loadPage === "function") {
        window.loadPage(page);
      } else {
        console.warn("⚠️ loadPage() not found");
      }
    });

  });
})();
