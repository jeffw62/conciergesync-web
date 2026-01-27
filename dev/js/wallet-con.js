console.log("wallet-con.js loaded");

// Click delegation for injected wallet cards
document.addEventListener("click", (e) => {
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  const cardId = card.dataset.cardId;
  console.log("🃏 Card clicked:", cardId);

  const assetBase = `${window.location.origin}/dev/asset/images`;

slot.innerHTML = `
  <img
    src="${assetBase}/${cardId}-01.svg"
    alt="${cardId}"
    class="wallet-selected-card"
  />
`;
  }
});
