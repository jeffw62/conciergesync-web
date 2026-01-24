/* ============================================================
   ConciergeSync™ Console Core (LOCKED)
   Purpose: Global chrome only (nav + account)
   ============================================================ */

(() => {
  "use strict";

  // ---- Element refs (explicit, no guessing) ----
  const accountBtn = document.getElementById("accountBtn");
  const accountDropdown = document.querySelector(".account-dropdown");

  const navToggle = document.getElementById("navToggle");
  const sideNav = document.getElementById("sideNav");
  const closeNav = document.getElementById("closeNav");

  if (!accountBtn || !accountDropdown || !navToggle || !sideNav || !closeNav) {
    console.error("Console core: missing required elements");
    return;
  }

  // ---- Account dropdown logic ----
  function closeAccountDropdown() {
    accountDropdown.classList.remove("open");
  }

  function toggleAccountDropdown(e) {
    e.stopPropagation();
    accountDropdown.classList.toggle("open");
  }

  accountBtn.addEventListener("click", toggleAccountDropdown);

  document.addEventListener("click", (e) => {
    if (!accountDropdown.contains(e.target) && e.target !== accountBtn) {
      closeAccountDropdown();
    }
  });

  // ---- Side navigation logic ----
  function openSideNav() {
    sideNav.classList.add("open");
  }

  function closeSideNav() {
    sideNav.classList.remove("open");
  }

  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    openSideNav();
  });

  closeNav.addEventListener("click", (e) => {
    e.stopPropagation();
    closeSideNav();
  });

})();
