(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL HAMBURGER / DRAWER (ALWAYS-ON)
  // --------------------------------------------------
  document.addEventListener("click", e => {
  const hamburger = e.target.closest("#hamburger");
  if (!hamburger) return;

  const drawer = document.querySelector("#drawer");
  if (!drawer) {
    console.warn("⚠️ Drawer not found at click time");
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
