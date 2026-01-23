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
    console.warn("⚠️ Drawer elements not found in workspace");
    return;
  }

  console.log("🍔 Drawer initialized");

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
  document.addEventListener("module:ready", () => {
    initDrawer();
  });

})();
