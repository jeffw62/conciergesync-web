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

  /* ==========================================================
   PAGE TITLE SLOT INJECTION (console-owned)
   ========================================================== */

    const pageTitle = document.querySelector("[data-page-title]");
    const titleSlot = document.querySelector(".page-title-slot");

    if (pageTitle && titleSlot) {
      titleSlot.appendChild(pageTitle);
      console.log("🟡 Page title injected into slot");
    } else {
      if (!pageTitle) console.warn("⚠️ data-page-title not found");
      if (!titleSlot) console.warn("⚠️ .page-title-slot not found");
    }

    /* -------------------------------------------------
       GLOBAL ELEMENTS (CONSOLE-LEVEL ONLY)
    ------------------------------------------------- */

    const sideNav        = document.getElementById("sideNav");
    const navToggle      = document.getElementById("navToggle");
    const closeNav       = document.getElementById("closeNav");

    const accountBtn     = document.getElementById("accountBtn");
    const accountMenu    = document.querySelector(".account-menu");

    /* -------------------------------------------------
       SAFETY CHECKS
    ------------------------------------------------- */

    if (!sideNav)   console.warn("⚠️ sideNav not found");
    if (!navToggle) console.warn("⚠️ navToggle not found");
    if (!closeNav)  console.warn("⚠️ closeNav not found");
    if (!accountBtn) console.warn("⚠️ accountBtn not found");
    if (!accountMenu) console.warn("⚠️ accountMenu not found");

    /* -------------------------------------------------
       HAMBURGER / SIDE NAV (ONLY)
    ------------------------------------------------- */

    function openDrawer() {
      sideNav?.classList.add("open");
      console.log("🍔 Drawer opened");
    }

    function closeDrawer() {
      sideNav?.classList.remove("open");
      console.log("❌ Drawer closed");
    }

    navToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      openDrawer();
    });

    closeNav?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeDrawer();
    });

    /* -------------------------------------------------
       SIDE NAV LINK ROUTING
    ------------------------------------------------- */

    sideNav?.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-page]");
      if (!link) return;

      e.preventDefault();
      e.stopPropagation();

      const page = link.dataset.page;
      console.log(`🧭 Nav click → "${page}"`);

      closeDrawer();

      if (typeof window.loadPage === "function") {
        window.loadPage(page);
      } else {
        console.warn("⚠️ loadPage() not defined");
      }
    });

    /* -------------------------------------------------
       ACCOUNT DROPDOWN (SEPARATE CONTROL)
    ------------------------------------------------- */

    accountBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      accountMenu?.classList.toggle("active");
      console.log("👤 accountBtn clicked");
    });

    /* -------------------------------------------------
       CLICK OUTSIDE TO CLOSE ACCOUNT DROPDOWN
    ------------------------------------------------- */

    document.addEventListener("click", () => {
      if (accountMenu?.classList.contains("active")) {
        accountMenu.classList.remove("active");
        console.log("👤 account menu closed (outside click)");
      }
    });

  });
})();
