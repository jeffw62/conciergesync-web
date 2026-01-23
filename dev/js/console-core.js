(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL DRAWER (ALWAYS-ON, CONTRACT-BASED)
  // --------------------------------------------------
  document.addEventListener("click", e => {
    // Open via hamburger
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

    // Close via X
    const closeBtn = e.target.closest("#closeNav");
    if (closeBtn) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) return;

      drawer.classList.remove("open");
      console.log("❌ Drawer closed");
      return;
    }
  });

})();
