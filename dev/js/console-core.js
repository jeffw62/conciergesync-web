(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL HAMBURGER / DRAWER (CONSOLE-LEVEL ONLY)
  // --------------------------------------------------
  function initDrawer() {
    const hamburger = document.getElementById("hamburger");
    const drawer = document.getElementById("drawer");
    const closeBtn = document.getElementById("closeNav");

    if (!hamburger || !drawer) {
      console.warn("⚠️ Hamburger or drawer not found");
      return;
    }

    console.log("🍔 Drawer initialized");

    hamburger.addEventListener("click", () => {
      drawer.classList.add("open");
      console.log("🍔 Drawer opened");
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        drawer.classList.remove("open");
        console.log("🍔 Drawer closed");
      });
    }
  }

  // --------------------------------------------------
  // BOOTSTRAP — RUN ONCE, NEVER AGAIN
  // --------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDrawer, { once: true });
  } else {
    initDrawer();
  }

})();
