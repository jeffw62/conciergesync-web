(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL HAMBURGER / DRAWER (ALWAYS-ON)
  // --------------------------------------------------
  function initDrawer() {
    const hamburger = document.querySelector("#hamburger");
    const drawer = document.querySelector("#drawer");

    if (!hamburger || !drawer) {
      console.warn("⚠️ Hamburger or drawer not found in DOM");
      return;
    }

    console.log("🍔 Hamburger bound");

    hamburger.addEventListener("click", () => {
      drawer.classList.toggle("open");
      console.log(
        drawer.classList.contains("open")
          ? "🍔 Drawer opened"
          : "🍔 Drawer closed"
      );
    });
  }

  // --------------------------------------------------
  // BOOTSTRAP — RUN ONCE, IMMEDIATELY
  // --------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDrawer);
  } else {
    initDrawer();
  }

})();
