(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // ==================================================
  // GLOBAL DRAWER (CONSOLE-LEVEL, NEVER REBUILT)
  // ==================================================

  const accountBtn = document.getElementById("accountBtn");
  const navToggle  = document.getElementById("navToggle");
  const sideNav    = document.getElementById("sideNav");
  const closeNav   = document.getElementById("closeNav");

  if (!sideNav) {
    console.error("❌ sideNav not found — drawer disabled");
    return;
  }

  function openDrawer() {
    sideNav.classList.add("open");
    console.log("🍔 Drawer opened");
  }

  function closeDrawer() {
    sideNav.classList.remove("open");
    console.log("❌ Drawer closed");
  }

  // Open triggers
  if (accountBtn) accountBtn.addEventListener("click", openDrawer);
  if (navToggle)  navToggle.addEventListener("click", openDrawer);

  // Close triggers
  if (closeNav) closeNav.addEventListener("click", closeDrawer);

  // Close drawer when clicking any nav link
  sideNav.addEventListener("click", e => {
    const link = e.target.closest("a[data-page]");
    if (!link) return;
    closeDrawer();
  });

})();
