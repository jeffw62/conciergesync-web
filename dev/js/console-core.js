(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL ELEMENTS (ALWAYS PRESENT IN console.html)
  // --------------------------------------------------
  const sideNav = document.getElementById("sideNav");
  const closeNavBtn = document.getElementById("closeNav");
  const accountBtn = document.getElementById("accountBtn");

  if (!sideNav) {
    console.error("❌ sideNav not found");
    return;
  }

  // --------------------------------------------------
  // NAV OPEN / CLOSE
  // --------------------------------------------------
  function openNav() {
    sideNav.classList.add("open");
    console.log("🍔 Nav opened");
  }

  function closeNav() {
    sideNav.classList.remove("open");
    console.log("🍔 Nav closed");
  }

  // --------------------------------------------------
  // EVENT BINDINGS
  // --------------------------------------------------
  if (accountBtn) {
    accountBtn.addEventListener("click", openNav);
  }

  if (closeNavBtn) {
    closeNavBtn.addEventListener("click", closeNav);
  }

  // Optional: click outside nav closes it
  document.addEventListener("click", (e) => {
    if (!sideNav.contains(e.target) && !accountBtn?.contains(e.target)) {
      closeNav();
    }
  });

})();
