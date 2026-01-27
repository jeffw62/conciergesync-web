console.log("wallet-con.js loaded");

// Click delegation for injected wallet cards
document.addEventListener("click", (e) => {
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  const cardId = card.dataset.cardId;
  console.log("🃏 Card clicked:", cardId);

  const slot = document.querySelector(".wallet-selected-card-slot");
  if (!slot) {
    console.warn("⚠️ wallet-selected-card-slot not found");
    return;
  }

  slot.innerHTML = `
    <img
      src="/dev/asset/images/amex_biz_plat-01.svg"
      alt="${cardId}"
      class="wallet-selected-card"
    />
  `;
});
