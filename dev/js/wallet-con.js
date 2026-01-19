// wallet-con.js
document.addEventListener('DOMContentLoaded', () => {
  const rail = document.querySelector('.wallet-left-rail');
  if (!rail) return;

  const cards = rail.querySelectorAll('.card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
      rail.classList.add('has-active');
    });
  });
});
