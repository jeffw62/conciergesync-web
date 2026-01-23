(() => {
  "use strict";

  console.log("🧱 console-core.js loaded");

  // --------------------------------------------------
  // GLOBAL HAMBURGER / DRAWER (ALWAYS-ON)
  // --------------------------------------------------
  function waitForDrawer() {
    const hamburger = document.querySelector("#hamburger");
    const drawer = document.querySelector("#drawer");
  
    if (hamburger && drawer) {
      console.log("🍔 Drawer DOM detected");
      initDrawer();
      return;
    }
  
    const observer = new MutationObserver(() => {
      const h = document.querySelector("#hamburger");
      const d = document.querySelector("#drawer");
  
      if (h && d) {
        console.log("🍔 Drawer DOM detected (observer)");
        observer.disconnect();
        initDrawer();
      }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

  // --------------------------------------------------
  // BOOTSTRAP — RUN ONCE, IMMEDIATELY
  // --------------------------------------------------
  waitForDrawer();

})();
