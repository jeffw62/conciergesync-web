console.log("wallet-con.js loaded");

/*
=================================================
WALLET INTERACTION CONTROLLER
Single source of truth for:
- Card selection
- Transactions toggle (+ / −)
- Reset to Portfolio Summary
=================================================
*/

document.addEventListener("click", (e) => {

  /* =============================================
     TRANSACTIONS TOGGLE CLICK (+ / −)
     ============================================= */
  const txToggle = e.target.closest("#transactionsToggle");
  if (txToggle) {
    const zoneD = document.getElementById("wallet-zone-d");
    const indicator = txToggle.querySelector(".toggle-indicator");

    if (!zoneD) return;

    const isExpanded = zoneD.classList.toggle("is-expanded");
    zoneD.classList.toggle("is-collapsed", !isExpanded);

    if (indicator) {
      indicator.textContent = isExpanded ? "−" : "+";
    }

    return; // ⛔ STOP — do not fall into card logic
  }

  /* =============================================
     CONCIERGESYNC™ CARD — HARD RESET
     ============================================= */
  const csCard = e.target.closest(".wallet-card.cs-card");
  if (csCard) {
    console.log("♾️ ConciergeSync™ card clicked — reset");

    // Clear selected card image
    const slot = document.querySelector(".wallet-selected-card-slot");
    if (slot) slot.innerHTML = "";

    // Hide transactions toggle
    const toggle = document.getElementById("transactionsToggle");
    if (toggle) toggle.setAttribute("hidden", "");

    // Collapse transactions
    const zoneD = document.getElementById("wallet-zone-d");
    if (zoneD) {
      zoneD.classList.remove("is-expanded");
      zoneD.classList.add("is-collapsed");
    }

    // Reset indicator
    const indicator = toggle?.querySelector(".toggle-indicator");
    if (indicator) indicator.textContent = "+";

    return; // ⛔ STOP
  }

  /* =============================================
     WALLET CARD SELECTION (NON-CS CARDS)
     ============================================= */
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  const cardId = card.dataset.cardId;
  console.log("💳 Card clicked:", cardId);

  // Inject selected card image (hard-coded for now)
  const slot = document.querySelector(".wallet-selected-card-slot");
  if (!slot) return;

  slot.innerHTML = `
    <img
      src="/dev/asset/images/amex_biz_plat-01.svg"
      alt="${cardId}"
      class="wallet-selected-card"
    />
  `;

  // Show TRANSACTIONS +
  const toggle = document.getElementById("transactionsToggle");
  if (toggle) toggle.removeAttribute("hidden");

  // Reset transactions state on card change
  const zoneD = document.getElementById("wallet-zone-d");
  if (zoneD) {
    zoneD.classList.remove("is-expanded");
    zoneD.classList.add("is-collapsed");
  }

  // Reset indicator
  const indicator = toggle?.querySelector(".toggle-indicator");
  if (indicator) indicator.textContent = "+";
});
