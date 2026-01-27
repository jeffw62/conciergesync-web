console.log("wallet-con.js loaded");

// Click delegation for injected wallet cards
document.addEventListener("click", (e) => {
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  const cardId = card.dataset.cardId;
  console.log("🃏 Card clicked:", cardId);
});
