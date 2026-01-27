console.log("wallet-con.js loaded");

function bindWalletCardClick() {
  const cards = document.querySelectorAll('.wallet-card');

  if (!cards.length) {
    console.warn("No wallet cards found to bind.");
    return;
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const cardId = card.dataset.cardId;
      console.log("🃏 Card clicked:", cardId);
    });
  });
}

// Expose for injected-page lifecycle
window.bindWalletCardClick = bindWalletCardClick;

// Run immediately for now (safe because wallet-con.js
// is only loaded when wallet page is injected)
bindWalletCardClick();
