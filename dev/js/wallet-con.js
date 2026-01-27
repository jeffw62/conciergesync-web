console.log("🟡 wallet-con.js loaded");

function bindWalletCardHover() {
  const cards = document.querySelectorAll(
    ".wallet-frame .wallet-card"
  );

  console.log("🟡 binding hover to cards:", cards.length);

  cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      card.classList.add("is-hovered");
    });

    card.addEventListener("mouseleave", () => {
      card.classList.remove("is-hovered");
    });
  });
}
