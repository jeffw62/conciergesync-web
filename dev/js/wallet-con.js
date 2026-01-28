console.log("wallet-con.js loaded");

// =====================================================
// WALLET CARD SELECTION
// =====================================================
document.addEventListener("click", (e) => {
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  const cardId = card.dataset.cardId;
  console.log("🪪 Card clicked:", cardId);

  const slot = document.querySelector(".wallet-selected-card-slot");
  if (!slot) {
    console.warn("⚠️ wallet-selected-card-slot not found");
    return;
  }

  // Inject selected card image
  slot.innerHTML = `
    <img
      src="/dev/asset/images/amex_biz_plat-01.svg"
      alt="${cardId}"
      class="wallet-selected-card"
    />
  `;

  // Show transactions toggle
  const toggle = document.getElementById("transactionsToggle");
  if (toggle) {
    toggle.removeAttribute("hidden");
  }
  
  // Reset transactions state on every card click
  const zoneD = document.getElementById("wallet-zone-d");
  if (zoneD) {
    zoneD.classList.remove("is-expanded");
    zoneD.classList.add("is-collapsed");
  }
  
  // Reset indicator to +
  const indicator = toggle?.querySelector(".toggle-indicator");
  if (indicator) {
    indicator.textContent = "+";
  }
});


// =====================================================
// TRANSACTIONS TOGGLE (+ / −)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("transactionsToggle");
  const zoneD = document.getElementById("wallet-zone-d");

  if (!toggle || !zoneD) {
    console.warn("⚠️ Transactions toggle or zone D not found");
    return;
  }

  const indicator = toggle.querySelector(".toggle-indicator");

  toggle.addEventListener("click", () => {
    const isExpanded = zoneD.classList.toggle("is-expanded");
    zoneD.classList.toggle("is-collapsed", !isExpanded);

    if (indicator) {
      indicator.textContent = isExpanded ? "−" : "+";
    }
  });
});


// =====================================================
// RESET TO PORTFOLIO SUMMARY (ConciergeSync™ Card)
// =====================================================
document.addEventListener("click", (e) => {
  const csCard = e.target.closest(".wallet-card.cs-card");
  if (!csCard) return;

  console.log("♾️ ConciergeSync card clicked — reset");

  // Clear selected card
  const slot = document.querySelector(".wallet-selected-card-slot");
  if (slot) {
    slot.innerHTML = "";
  }

  // Hide transactions toggle
  const toggle = document.getElementById("transactionsToggle");
  if (toggle) {
    toggle.classList.add("hidden");
  }

  // Collapse transactions
  const zoneD = document.getElementById("wallet-zone-d");
  if (zoneD) {
    zoneD.classList.remove("is-expanded");
    zoneD.classList.add("is-collapsed");
  }

  // Reset indicator
  const indicator = toggle?.querySelector(".toggle-indicator");
  if (indicator) {
    indicator.textContent = "+";
  }
});
