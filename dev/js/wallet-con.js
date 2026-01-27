console.log("🟡 wallet-con.js loaded");

const walletCards = document.querySelectorAll('.wallet-card');
const workspace = document.getElementById('workspace');

walletCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.classList.add('is-hovered');

    if (workspace) {
      workspace.classList.add('is-hovered');
    }
  });

  card.addEventListener('mouseleave', () => {
    card.classList.remove('is-hovered');

    if (workspace) {
      workspace.classList.remove('is-hovered');
    }
  });
});
