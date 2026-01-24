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

    const accountBtn   = document.getElementById("accountBtn");
    const accountMenu  = document.querySelector(".account-menu");
    const navToggle    = document.getElementById("navToggle");
    const sideNav      = document.getElementById("sideNav");
    const closeNav     = document.getElementById("closeNav");

    if (!accountBtn || !accountMenu || !navToggle || !sideNav || !closeNav) {
      console.error("❌ console-core missing required elements");
      return;
    }

    // -------------------------------
    // Account dropdown (user icon)
    // -------------------------------
    accountBtn.addEventListener("click", e => {
      e.stopPropagation();
      accountMenu.classList.toggle("active");
      console.log("👤 accountBtn toggled");
    });

    // Close account menu when clicking elsewhere
    document.addEventListener("click", () => {
      accountMenu.classList.remove("active");
    });

    // -------------------------------
    // Side navigation (hamburger)
    // -------------------------------
    navToggle.addEventListener("click", () => {
      sideNav.classList.add("open");
      console.log("🍔 sideNav opened");
    });

    closeNav.addEventListener("click", () => {
      sideNav.classList.remove("open");
      console.log("❌ sideNav closed");
    });

  });
})();
