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

  // --------------------------------------------------
  // DOM READY GATE (REQUIRED)
  // --------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    console.log("🧱 console-core.js DOM ready");

    // ----------------------------
    // REQUIRED ELEMENTS
    // ----------------------------
    const accountBtn = document.getElementById("accountBtn");
    const accountDropdown = document.querySelector(".account-dropdown");

    const navToggle = document.getElementById("navToggle");
    const sideNav = document.getElementById("sideNav");
    const closeNav = document.getElementById("closeNav");

    console.table({
      accountBtn,
      accountDropdown,
      navToggle,
      sideNav,
      closeNav
    });

    if (
      !accountBtn ||
      !accountDropdown ||
      !navToggle ||
      !sideNav ||
      !closeNav
    ) {
      console.error("❌ console-core missing required elements");
      return;
    }

    // --------------------------------------------------
    // ACCOUNT MENU (👤)
    // --------------------------------------------------
    accountBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("👤 accountBtn clicked");
      accountDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (
        accountDropdown.classList.contains("open") &&
        !accountDropdown.contains(e.target) &&
        e.target !== accountBtn
      ) {
        accountDropdown.classList.remove("open");
      }
    });

    // --------------------------------------------------
    // SIDE NAV (☰)
    // --------------------------------------------------
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("☰ navToggle clicked");
      sideNav.classList.add("open");
    });

    closeNav.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("❌ closeNav clicked");
      sideNav.classList.remove("open");
    });

  });

})();
