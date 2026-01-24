(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL CONSOLE NAV (ALWAYS ON)
  // --------------------------------------------------

  const accountBtn = document.getElementById("accountBtn");
  const sideNav = document.getElementById("sideNav");
  const closeNavBtn = document.getElementById("closeNav");

  if (!accountBtn) {
    console.error("❌ accountBtn not found");
    return;
  }

  if (!sideNav) {
    console.error("❌ sideNav not found");
    return;
  }

  if (!closeNavBtn) {
    console.error("❌ closeNav not found");
    return;
  }

  // --- Open nav via account button ---
  accountBtn.addEventListener("click", () => {
    sideNav.classList.add("open");
    console.log("🍔 Nav opened");
  });

  // --- Close nav via X button ---
  closeNavBtn.addEventListener("click", () => {
    sideNav.classList.remove("open");
    console.log("❌ Nav closed");
  });

})();
