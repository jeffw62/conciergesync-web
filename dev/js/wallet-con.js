document.addEventListener('DOMContentLoaded', () => {
  const walletCards = document.querySelectorAll('.wallet-card');

  walletCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('is-hovered');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-hovered');
    });
  });
});
