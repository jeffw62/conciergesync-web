/* =========================================================
   Console Core — Clean Canonical Build
   ========================================================= */

/* -------------------------
   Global UI
-------------------------- */

function initDrawer() {
  const hamburger = document.querySelector("#hamburger");
  const drawer = document.querySelector("#drawer");

  if (!hamburger || !drawer) return;

  hamburger.addEventListener("click", () => {
    drawer.classList.toggle("open");
  });
}

function initializeFooterAndNav() {
  // Placeholder for future global UI hooks
}

/* -------------------------
   Wallet
-------------------------- */

function initWallet(workspace) {
  if (!workspace) return;

  const cards = workspace.querySelectorAll(".wallet-card");
  const seeTxBtn = workspace.querySelector("#see-transactions-btn");
  const transactions = workspace.querySelector("#transactions");

  if (seeTxBtn) seeTxBtn.hidden = true;
  if (transactions) transactions.hidden = true;

  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      if (seeTxBtn) seeTxBtn.hidden = false;
    });
  });

  if (seeTxBtn && transactions) {
    seeTxBtn.addEventListener("click", () => {
      transactions.hidden = false;
    });
  }
}

/* -------------------------
   Discovery (redem-con)
-------------------------- */

function initDiscovery(workspace) {
  if (!workspace) return;
  // Discovery logic lives here
}

/* -------------------------
   Lifecycle (SINGLE SOURCE)
-------------------------- */

document.addEventListener("module:ready", e => {
  const { page, workspace } = e.detail || {};
  if (!page) return;

  // Always-on UI
  initDrawer();
  initializeFooterAndNav();

  // Page-specific
  if (page === "wallet-con") {
    initWallet(workspace);
  }

  if (page === "redem-con") {
    initDiscovery(workspace);
  }
});

  console.log("🧭 Wallet init");

  const cards = workspace.querySelectorAll(".wallet-card");
  const seeTxBtn = workspace.querySelector("#see-transactions-btn");
  const transactions = workspace.querySelector("#transactions");

  if (seeTxBtn) seeTxBtn.hidden = true;
  if (transactions) transactions.hidden = true;

  cards.forEach(card => {
    card.addEventListener("click", () => {
      // clear previous state
      cards.forEach(c => c.classList.remove("active"));

      // set active
      card.classList.add("active");

      // reveal CTA
      if (seeTxBtn) seeTxBtn.hidden = false;

      console.log("🪪 Active card:", card.dataset.cardId || "unknown");
    });
  });

  if (seeTxBtn && transactions) {
    seeTxBtn.addEventListener("click", () => {
      transactions.hidden = false;
      console.log("📄 Transactions revealed");
    });
  }

