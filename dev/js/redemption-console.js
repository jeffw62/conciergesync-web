(() => {
  console.log(
    "%c🚀 ConciergeSync™ redemption-console.js booting...",
    "color:#f6b93b; font-weight:bold;"
  );

  // -----------------------------------------------
  // 🌿 1. Environment Guards
  // -----------------------------------------------
  const workspace = document.getElementById("workspace");
  if (!workspace) {
    console.warn(
      "⚠️ No #workspace found — not running inside console. Exiting redemption-console.js"
    );
    return;
  }

  // Watch for the search panel (actual injected content)
  const panel = workspace.querySelector("#searchPanel");
  if (!panel) {
    console.warn("⚠️ No #searchPanel found yet — waiting for injection...");

    const observer = new MutationObserver(() => {
      const injected = workspace.querySelector("#searchPanel");
      if (injected) {
        observer.disconnect();
        console.log("✅ Search panel detected post-injection. Initializing handlers...");
        initializeHandlers(injected);
      }
    });

    observer.observe(workspace, { childList: true, subtree: true });
  } else {
    initializeHandlers(panel);
  }

  // -----------------------------------------------
  // 🌿 2. Handler Initialization
  // -----------------------------------------------
  function initializeHandlers(root) {
    const searchBtn = root.querySelector("#searchBtn");
    if (!searchBtn) {
      console.warn("⚠️ Search button not found in injected panel.");
      return;
    }

    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const inputs = root.querySelectorAll("input, select");
      const payload = {};
      inputs.forEach((el) => (payload[el.id] = el.value));

      console.log("✅ Search click captured. Payload:", payload);

      const warning = root.querySelector("#searchWarning");
      if (warning) warning.textContent = "Search event captured successfully.";
    });

    console.log("💡 Redemption console event listener active.");

    // -----------------------------------------------
    // ✈️  Field Initialization (Origin / Destination)
    // -----------------------------------------------
    setupIataAutocomplete(root);

    // -----------------------------------------------
    // 🔁 Step 2 Toggle Logic (Yes/No buttons)
    // -----------------------------------------------
    setupRoutingToggles(root);
  } // <-- this closes initializeHandlers
  

  // --------------------------------------------------
  // ✈️ IATA Autocomplete stub
  // --------------------------------------------------
  function setupIataAutocomplete(root) {
    const fields = ["origin", "destination"];
    fields.forEach((id) => {
      const input = root.querySelector(`#${id}`);
      if (!input) return;

      input.addEventListener("focus", () => {
        console.log(`🛫 ${id.toUpperCase()} input focused — load IATA suggestions here.`);
        const sugg = root.querySelector(`#${id}-suggestions`);
        if (sugg) sugg.textContent = "(autocomplete results would appear here)";
      });
    });
  }

  // --------------------------------------------------
  // 🔁 Step 2 Toggle Logic
  // --------------------------------------------------
  function setupRoutingToggles(root) {
    const groups = ["direct", "multi", "positioning"];

    groups.forEach((key) => {
      const yes = root.querySelector(`#${key}Yes`);
      const no = root.querySelector(`#${key}No`);
      if (!yes || !no) return;

      const activate = (active) => {
        yes.classList.toggle("active", active);
        no.classList.toggle("active", !active);
        yes.dataset.value = active ? "yes" : "no";
        no.dataset.value = active ? "yes" : "no";
      };

      yes.addEventListener("click", () => activate(true));
      no.addEventListener("click", () => activate(false));
    });

    console.log("🔁 Routing toggles initialized.");
  }
})();

