console.log("wallet-con.js loaded");

// ===============================
// WALLET CARD SELECTION
// ===============================
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

// ===============================
// TRANSACTIONS TOGGLE
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('transactionsToggle');
  const zoneD = document.getElementById('wallet-zone-d');

  if (!toggle || !zoneD) return;

  const indicator = toggle.querySelector('.toggle-indicator');

  toggle.addEventListener('click', () => {
    const expanded = zoneD.classList.toggle('is-expanded');
    zoneD.classList.toggle('is-collapsed', !expanded);
    indicator.textContent = expanded ? '−' : '+';
  });
});
