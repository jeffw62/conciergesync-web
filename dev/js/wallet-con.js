console.log("🟡 wallet-con.js loaded");

document.addEventListener("mouseover", (e) => {
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  card.classList.add("is-hovered");
});

document.addEventListener("mouseout", (e) => {
  const card = e.target.closest(".wallet-card");
  if (!card) return;

  card.classList.remove("is-hovered");
});

(function () {
  const workspace = document.getElementById('workspace');
  if (!workspace) return;

  function bindHover() {
    const cards = workspace.querySelectorAll('.wallet-card');
    if (!cards.length) return false;

    console.log(`🃏 Wallet cards found: ${cards.length}`);

    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.classList.add('is-hovered');
        workspace.classList.add('is-hovered');
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-hovered');
        workspace.classList.remove('is-hovered');
      });
    });

    return true;
  }

  // Try immediately (covers refresh / hard load)
  if (bindHover()) return;

  // Otherwise observe injection
  const observer = new MutationObserver(() => {
    if (bindHover()) {
      observer.disconnect();
      console.log('✅ Wallet hover bound via MutationObserver');
    }
  });

  observer.observe(workspace, { childList: true, subtree: true });
})();
