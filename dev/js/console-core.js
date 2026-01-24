(() => {
  "use strict";

  console.log("🧱 console-core.clean.js loaded");

  // -----------------------------
  // ELEMENT REFERENCES
  // -----------------------------
  const hamburger = document.getElementById("hamburger");
  const drawer = document.getElementById("drawer");
  const closeNav = document.getElementById("closeNav");
  const workspace = document.getElementById("workspace");

  if (!hamburger || !drawer || !workspace) {
    console.error("❌ Core elements missing — aborting console core");
    return;
  }

  // -----------------------------
  // HAMBURGER OPEN / CLOSE
  // -----------------------------
  hamburger.addEventListener("click", () => {
    drawer.classList.add("open");
    console.log("🍔 Drawer opened");
  });

  if (closeNav) {
    closeNav.addEventListener("click", () => {
      drawer.classList.remove("open");
      console.log("❌ Drawer closed");
    });
  }

  // -----------------------------
  // NAVIGATION (WORKSPACE SWAP)
  // -----------------------------
  drawer.addEventListener("click", (e) => {
    const link = e.target.closest("[data-target]");
    if (!link) return;

    e.preventDefault();

    const target = link.getAttribute("data-target");
    if (!target) return;

    console.log(`🧭 Navigating to ${target}`);

    fetch(`/dev/${target}.html`)
      .then(res => {
        if (!res.ok) throw new Error("Load failed");
        return res.text();
      })
      .then(html => {
        workspace.innerHTML = html;
        drawer.classList.remove("open");
        console.log(`✅ Loaded ${target}`);
      })
      .catch(err => {
        console.error("❌ Navigation error:", err);
      });
  });

})();
