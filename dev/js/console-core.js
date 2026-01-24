// --------------------------------------------------
// GLOBAL HAMBURGER / DRAWER (DELEGATED — UNBREAKABLE)
// --------------------------------------------------
document.addEventListener("click", (e) => {
  const hamburger = e.target.closest("#hamburger");
  const closeBtn = e.target.closest("#closeNav");
  const drawer = document.querySelector("#drawer");

  if (!drawer) return;

  if (hamburger) {
    drawer.classList.toggle("open");
    console.log("🍔 Drawer toggled");
  }

  if (closeBtn) {
    drawer.classList.remove("open");
    console.log("❌ Drawer closed");
  }
});
