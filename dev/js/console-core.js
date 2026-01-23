(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL HAMBURGER / DRAWER (ALWAYS-ON)
  // --------------------------------------------------
  document.addEventListener("click", e => {
  const hamburger = e.target.closest("#navToggle");
  if (!hamburger) return;

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
});

})();
