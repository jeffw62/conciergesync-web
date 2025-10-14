// === Redemption Module Entry Points ===

// document.addEventListener("DOMContentLoaded", setupRedemptionModule); // disabled
// Expose on-demand trigger
window.launchGoldCard = setupRedemptionModule;

// --- Airport Autocomplete (IATA/ICAO) ---
let airports = [];

function loadAirports() {
  fetch("/dev/asset/iata-icao.json")
    .then(res => res.json())
    .then(data => {
      airports = data;
      console.log("🛫 Loaded airports:", airports.length);
    })
    .catch(err => console.error("❌ Failed to load airports:", err));
}

// === Core Setup ===
function setupRedemptionModule() {
  // prevent double-initialization
  if (window._redemptionInitialized) return;
  window._redemptionInitialized = true;
  console.log("💗 Redemption module initializing...");

  // ensure form is visible before overlay runs
  document.querySelectorAll("#spinner-bridge, #gold-card, #shimmer-overlay")
    .forEach(el => el.remove());

  // --- Ensure redemption form centers spinner bridge correctly ---
  const centerFixStyle = document.createElement("style");
  centerFixStyle.textContent = `
    #redemption-form {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
  document.head.appendChild(centerFixStyle);

  // === ConciergeSync™ Spinner Bridge + Gold Card Overlay ===
  const spinnerBridge = document.createElement("div");
  spinnerBridge.id = "spinner-bridge";
  Object.assign(spinnerBridge.style, {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(180deg, rgba(10,26,51,0.98) 0%, rgba(10,26,51,1) 100%)",
    zIndex: 9998,
    overflow: "hidden"
  });

  // place bridge inside form if present
  const formContainer = document.querySelector("#redemption-form");
  if (formContainer) {
    formContainer.style.position = "relative";
    formContainer.appendChild(spinnerBridge);
  } else {
    document.body.appendChild(spinnerBridge);
  }

  // === Gold Card ===
  const goldCard = document.createElement("div");
  goldCard.id = "gold-card";
  Object.assign(goldCard.style, {
    position: "relative",
    width: "260px",
    height: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 9999
  });

  // Card image
  const cardImg = document.createElement("img");
  cardImg.src = "/dev/asset/CS_logo_vert_gold_card.png";
  cardImg.alt = "ConciergeSync™ Gold Card";
  Object.assign(cardImg.style, {
    width: "260px",
    height: "auto",
    display: "block",
    borderRadius: "8px",
    overflow: "hidden",
    clipPath: "inset(0 round 8px)"
  });
  goldCard.appendChild(cardImg);

  // add processing message
  const cardMessage = document.createElement("div");
  cardMessage.id = "card-message";
  cardMessage.textContent =
    "Analyzing your award miles across routes and partners — please stand by.";
  Object.assign(cardMessage.style, {
    position: "absolute",
    top: "80%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    textAlign: "center",
    color: "#0a1a33",
    fontSize: "1.05rem",
    fontWeight: "500",
    textShadow: "0 0 6px rgba(0,0,0,0.3)",
    opacity: "0",
    transition: "opacity 1.2s ease",
    pointerEvents: "none",
    zIndex: 10000
  });
  goldCard.appendChild(cardMessage);

  // shimmer setup
  const shimmer = document.createElement("div");
  shimmer.id = "shimmer-overlay";
  Object.assign(shimmer.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(100deg, transparent 10%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 52%, transparent 90%)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "200% 100%",
    backgroundPosition: "-100% 0",
    mixBlendMode: "overlay",
    animation: "shimmerMove 5s ease-in-out infinite",
    pointerEvents: "none",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 2
  });

  // add bridge + card to DOM
  spinnerBridge.appendChild(goldCard);
  console.log("✅ Spinner bridge & gold card injected");

  // fade in text
  setTimeout(() => {
    cardMessage.style.opacity = "1";
  }, 500);

  // shimmer loop
  let shimmerCount = 0;
  document.addEventListener("animationiteration", (e) => {
    if (e.target.id !== "shimmer-overlay") return;
    shimmerCount++;
    console.log(`✨ Shimmer cycle #${shimmerCount}`);

    if (shimmerCount === 3) {
      console.log("🌙 3 shimmer cycles complete — beginning fade-out.");
      cardMessage.style.transition = "opacity 0.8s ease";
      cardMessage.style.opacity = "0";
      goldCard.style.transition = "opacity 1.2s ease";
      goldCard.style.opacity = "0";

      setTimeout(() => {
        console.log("🚀 Transition handoff triggered.");
        proceedToNextStage();
      }, 1300);
    }
  });

  goldCard.appendChild(shimmer);

  // keyframes once
  (() => {
    const id = "shimmer-style";
    const css = `
      @keyframes shimmerMove {
        0% { background-position: -120% 0; opacity: 0; }
        15%,85% { opacity: 1; }
        100% { background-position: 120% 0; opacity: 0; }
      }`;
    let styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  })();

  // === next stage logic ===
  function proceedToNextStage() {
    console.log("🪄 Transitioning to flight cards view...");

    const nextPanel = document.getElementById("flight-results");
    if (nextPanel) {
      nextPanel.style.opacity = 0;
      nextPanel.style.display = "block";
      nextPanel.style.transition = "opacity 1.2s ease";
      setTimeout(() => {
        nextPanel.style.opacity = 1;
        console.log("✈️  Flight cards revealed.");
      }, 100);
      return;
    }

    // redirect fallback
    console.log("🔁 Redirecting to /dev/flight-cards.html ...");
    const bridge = document.getElementById("spinner-bridge");
    const card = document.querySelector(".gold-card");
    if (bridge) {
      bridge.style.background = "rgba(10,26,51,1)";
      bridge.style.transition = "opacity 1s ease";
      bridge.style.opacity = "1";
      bridge.style.pointerEvents = "none";
    }
    if (card) {
      card.style.transition = "opacity 1s ease";
      card.style.opacity = "0";
    }
    setTimeout(() => {
      window.location.href = "/dev/flight-cards.html";
    }, 1000);
  }

  // hide form only when sequence runs
  const formContainerDeep = document.querySelector(
    "#redem-con-form, .redem-con-form, #search-form, .search-form"
  );
  if (formContainerDeep) {
    formContainerDeep.style.setProperty("display", "none", "important");
    formContainerDeep.style.setProperty("visibility", "hidden", "important");
    formContainerDeep.style.setProperty("opacity", "0", "important");
    formContainerDeep.style.setProperty("pointer-events", "none", "important");
  }

  // continue normal setup
  loadAirports();
  setupAutocomplete("origin", "origin-suggestions");
  setupAutocomplete("destination", "destination-suggestions");
}

// --- Autocomplete helper ---
function setupAutocomplete(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);
  if (!input || !suggestions) return;

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    suggestions.innerHTML = "";
    if (query.length < 2) return;

    const matches = airports
      .filter(
        (a) =>
          a.iata.toLowerCase().includes(query) ||
          a.airport.toLowerCase().includes(query) ||
          (a.region_name && a.region_name.toLowerCase().includes(query))
      )
      .slice(0, 10);

    matches.forEach((match) => {
      const div = document.createElement("div");
      div.classList.add("suggestion-item");
      div.innerHTML = `<span class="iata">${match.iata}</span> – <span class="airport">${match.airport}</span>`;
      div.addEventListener("click", () => {
        input.value = match.iata;
        suggestions.innerHTML = "";
      });
      suggestions.appendChild(div);
    });
  });

  document.addEventListener("click", (e) => {
    if (!suggestions.contains(e.target) && e.target !== input) {
      suggestions.innerHTML = "";
    }
  });
}
