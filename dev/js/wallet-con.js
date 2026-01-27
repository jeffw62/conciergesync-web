console.log("wallet-con.js loaded");
console.log(`🃏 Card clicked: "${cardId}"`);

const slot = document.querySelector('.wallet-selected-card-slot');
if (slot) {
  slot.textContent = cardId;
}

// Click delegation for injected wallet cards
document.addEventListener("click", (e) => {
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  const cardId = card.dataset.cardId;
  console.log("🃏 Card clicked:", cardId);
});
