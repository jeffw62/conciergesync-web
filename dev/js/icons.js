document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("dashboard-icon");
  const audio = new Audio("/dev/asset/sounds/dashboard.mp3");

  if (dashboard) {
    dashboard.addEventListener("mouseenter", () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });
  }
});
