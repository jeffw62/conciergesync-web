console.log("🟡 wallet-con.js loaded");

function bindWalletCardHover() {
  const walletCards = document.querySelectorAll('.wallet-card');

  if (!walletCards.length) return;

  walletCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('is-hovered');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-hovered');
    });
  });

  console.log("✨ Wallet card hover bound");
}

// Watch for injected wallet content
const observer = new MutationObserver(() => {
  const cardsExist = document.querySelector('.wallet-card');
  if (cardsExist) {
    bindWalletCardHover();
    observer.disconnect(); // bind once, then stop
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
