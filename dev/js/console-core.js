(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL HAMBURGER / DRAWER (ALWAYS-ON)
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

      drawer.classList.toggle("open");
      console.log(
        drawer.classList.contains("open")
          ? "🍔 Drawer opened"
          : "🍔 Drawer closed"
      );
      return;
    }

    // Close via X button
    const closeBtn = e.target.closest("#closeToggle");
    if (closeBtn) {
      const drawer = document.querySelector("#sideNav");
      if (!drawer) return;

      drawer.classList.remove("open");
      console.log("❌ Drawer closed via X");
      return;
    }
  });

})();
