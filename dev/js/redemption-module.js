function initRedemptionModule() {
  setupRedemptionModule();
}
// document.addEventListener("DOMContentLoaded", setupRedemptionModule);
// make the gold-card sequence callable on demand
window.launchGoldCard = setupRedemptionModule;

// --- Airport Autocomplete (IATA/ICAO) ---
let airports = [];

let spinnerBridge;  // global reference for ConciergeSync™ spinner bridge
let goldCard;       // global reference for ConciergeSync™ gold card

function loadAirports() {
  fetch("/dev/asset/iata-icao.json")
    .then(res => res.json())
    .then(data => {
      airports = data;
      console.log("🛫 Loaded airports:", airports.length);
    })
    .catch(err => console.error("❌ Failed to load airports:", err));
}

function setupRedemptionModule() {
  if (window._redemptionInitialized) return;
  window._redemptionInitialized = true;
  console.log("💗 Redemption module initializing...");

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
  if (typeof spinnerBridge === "undefined" || !spinnerBridge) {
    spinnerBridge = document.createElement("div");
    spinnerBridge.id = "spinner-bridge";
  } else {
    spinnerBridge.id = "spinner-bridge";
  }
    
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

  // --- Center spinner bridge within the search form ---
  const formContainerCenter = document.querySelector("#redemption-form");
  if (formContainerCenter) {
    formContainerCenter.style.position = "relative";
    formContainerCenter.style.display = "flex";
    formContainerCenter.style.alignItems = "center";
    formContainerCenter.style.justifyContent = "center";
  
    spinnerBridge.style.position = "absolute";
    spinnerBridge.style.inset = 0;
    spinnerBridge.style.display = "flex";
    spinnerBridge.style.alignItems = "center";
    spinnerBridge.style.justifyContent = "center";
  
    formContainerCenter.appendChild(spinnerBridge);
  } else {
    // fallback if form not found
    document.body.appendChild(spinnerBridge);
  }

  // === attach bridge inside search form container ===
  const formContainer = document.querySelector("#redemption-form");
  if (formContainer) {
    formContainer.style.position = "relative";
    formContainer.appendChild(spinnerBridge);
  } else {
    // fallback: full-screen center
    document.body.appendChild(spinnerBridge);
  }
  
  // === Gold Card ===
  goldCard = document.createElement("div");
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
    borderRadius: "8px",       // same radius as shimmer overlay
    overflow: "hidden",
    clipPath: "inset(0 round 8px)"  // ensures the image itself respects radius
  });
  goldCard.appendChild(cardImg);

  // Global shimmer loop counter (persistent)
    let shimmerCount = 0;
  // === Scoped shimmer overlay (locked to card face) ===
  function attachShimmer() {
        
    // Wait until the shimmer element exists in the DOM
    document.addEventListener('animationiteration', (e) => {
      if (e.target.id === 'shimmer-overlay') {
      shimmerCount++;
      console.log(`✨ Shimmer cycle #${shimmerCount}`);
    
      // === Fade trigger after 3 passes ===
      if (shimmerCount === 3) {
        console.log("🌙 3 shimmer cycles complete — beginning fade-out.");
    
        const goldCard = document.querySelector('.gold-card');
        const shimmerEl = document.getElementById('shimmer-overlay');
    
        if (goldCard) {
          goldCard.style.transition = 'opacity 1.2s ease';
          goldCard.style.opacity = '0';
        }
        if (shimmerEl) {
          shimmerEl.style.transition = 'opacity 1.2s ease';
          shimmerEl.style.opacity = '0';
        }
        
        // === Fade out the on-card message ===
        const msg = document.getElementById("card-message");
        if (msg) {
        msg.style.transition = "opacity 0.8s ease";
        msg.style.opacity = "0";
        }
        
        setTimeout(() => {
        console.log("🚀 Transition handoff triggered.");
        proceedToNextStage();
        }, 1300);
    
        // stop further counting once fade starts
        e.target.style.animationIterationCount = '0';
        }
      } 
    });

    // === Placeholder for next screen transition ===
    function proceedToNextStage() {
      console.log("🪄 Transitioning to flight cards view...");
    
      // Option A – Inline fade-in (if flight cards are a hidden container in same DOM)
      const nextPanel = document.getElementById('flight-results');
      if (nextPanel) {
        nextPanel.style.opacity = 0;
        nextPanel.style.display = 'block';
        nextPanel.style.transition = 'opacity 1.2s ease';
        setTimeout(() => {
          nextPanel.style.opacity = 1;
          console.log("✈️  Flight cards revealed.");
        }, 100);
      }
    
     // ✅ Load flight cards internally inside console workspace
      fetch("/dev/flight-cards-con.html")
        .then(r => r.text())
        .then(resHTML => {
          const workspace = document.getElementById("workspace");
          if (workspace) {
            workspace.innerHTML = resHTML;
            console.log("Loaded flight cards into console workspace.");
          } else {
            console.warn("Workspace not found — fallback to full page load.");
            window.location.assign("/dev/flight-cards.html");
          }
        })
        .catch(err => console.error("Failed to load flight cards internally:", err));
    
      // Keep form hidden and maintain opaque cover during fade-out
      const bridge = document.getElementById("spinner-bridge");
      const card = document.querySelector(".gold-card");
    
      if (bridge) {
        // keep bridge opaque so the form never reappears
        bridge.style.background = "rgba(10,26,51,1)";
        bridge.style.transition = "opacity 1s ease";
        bridge.style.opacity = "1";
        bridge.style.pointerEvents = "none";
      }
    
      if (card) {
        // fade the gold card only
        card.style.transition = "opacity 1s ease";
        card.style.opacity = "0";
      }
    
      // wait for fade to finish before redirect
      setTimeout(() => {
        window.location.href = "/dev/flight-cards.html";
      }, 1000);
    }
    }
    
    const shimmer = document.createElement("div");
    shimmer.id = "shimmer-overlay";
    Object.assign(shimmer.style, {
      position: "absolute",
      inset: "0",                     // pin to all edges of the card
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
  
    // Append shimmer after the card is sized
    const waitForCard = () => {
      if (goldCard.offsetWidth > 0) {
        goldCard.appendChild(shimmer);
      } else {
        requestAnimationFrame(waitForCard);
      }
    };
    waitForCard();

  // ensure spinnerBridge is defined globally once
  spinnerBridge = document.getElementById("spinner-bridge") || document.createElement("div");
  spinnerBridge.id = "spinner-bridge";
    }
      
  function attachShimmer() {
    const goldCard = document.querySelector(".gold-card");
    if (!goldCard) return;
    
    const shimmerEl = document.createElement("div");
    shimmerEl.className = "card-shimmer";
    shimmerEl.style.position = "absolute";
    shimmerEl.style.top = 0;
    shimmerEl.style.left = 0;
    shimmerEl.style.width = "100%";
    shimmerEl.style.height = "100%";
    shimmerEl.style.background = "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)";
    shimmerEl.style.animation = "shimmerMove 3s infinite";
  
    goldCard.appendChild(shimmerEl);
  }

  
  // ensure shimmer matches the card’s real painted size
    window.addEventListener("load", () => {
    const cardImg = document.querySelector("#gold-card");
    if (cardImg) {
      cardImg.onload = () => {
        const shimmerEl = document.getElementById("shimmer-overlay");
        if (shimmerEl) {
          shimmerEl.style.width = cardImg.offsetWidth + "px";
          shimmerEl.style.height = cardImg.offsetHeight + "px";
        }
      };
    } else {
      console.warn("⚠ gold-card image not found; skipping onload assignment.");
    }
  });

  // ensure shimmer alignment relative to card only
  goldCard = document.querySelector(".gold-card");
  if (goldCard) {
    goldCard.style.position = "relative";
    goldCard.style.overflow = "hidden";
  } else {
    console.warn("⚠️ gold-card not found; shimmer alignment skipped.");
  }
  
  // wait for card to be painted, then attach shimmer
  requestAnimationFrame(() => {
    setTimeout(attachShimmer, 300); // delay guarantees card is visible
  });
  
  // === Keyframes (single global instance) ===
  (() => {
    const id = "shimmer-style";
    const css = `
       @keyframes shimmerMove {
        0% {
          background-position: -120% 0;
          opacity: 0;
        }
        15% {
          opacity: 1;
        }
        85% {
          opacity: 1;
        }
        100% {
          background-position: 120% 0;
          opacity: 0;
        }
      }
    `;
    let styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  })();
  
  // === Add bridge & card to DOM safely ===
  if (spinnerBridge && goldCard) {
    spinnerBridge.appendChild(goldCard);
    document.body.appendChild(spinnerBridge);
    console.log("✅ Spinner bridge & gold card injected");
  } else {
    if (!spinnerBridge) {
      console.warn("⚠️ spinnerBridge missing; creating dynamically");
      spinnerBridge = document.createElement("div");
      spinnerBridge.id = "spinner-bridge";
      document.body.appendChild(spinnerBridge);
    }
    if (!goldCard) console.warn("⚠️ goldCard missing at DOM injection time");
  }

  // === Add processing text overlay to gold card ===
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
    zIndex: "10000"
  });
  
  goldCard.appendChild(cardMessage);
  
  // === Fade in message after card is visible ===
  setTimeout(() => {
    const msg = document.getElementById("card-message");
    if (msg) msg.style.opacity = "1";
  }, 500);

  // === Hard hide redemption form and its container ===
  const formContainerDeep = document.querySelector('#redem-con-form, .redem-con-form, #search-form, .search-form');
  if (formContainerDeep) {
    console.log("🧱 Locking form container completely...");
    formContainerDeep.style.setProperty('display', 'none', 'important');
    formContainerDeep.style.setProperty('visibility', 'hidden', 'important');
    formContainerDeep.style.setProperty('opacity', '0', 'important');
    formContainerDeep.style.setProperty('pointer-events', 'none', 'important');
    
    // Deep recursion — hide all parent containers up the chain that might be visible
    let parent = formContainer.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      if (parent.matches('section, div, form')) {
        parent.style.setProperty('visibility', 'hidden', 'important');
        parent.style.setProperty('opacity', '0', 'important');
      }
      parent = parent.parentElement;
    }
  
    // Kill any fade-in classes that might reappear
    formContainer.classList.forEach(cls => {
      if (cls.toLowerCase().includes('fade') || cls.toLowerCase().includes('show')) {
        formContainer.classList.remove(cls);
      }
    });
  }

  // === Fade-out and cleanup for Spinner Bridge ===
  const fadeOutBridge = () => {
    // fade the message slightly before bridge fades
    const msg = document.getElementById("card-message");
    if (msg) {
      msg.style.transition = "opacity 0.8s ease";
      msg.style.opacity = "0";
    }
  
    spinnerBridge.style.transition = "opacity 0.8s ease-in-out";
    spinnerBridge.style.opacity = "0";
  
    setTimeout(() => {
      if (spinnerBridge.parentElement) spinnerBridge.remove();
    }, 800);
  };
  
  // Watch for the redemption form returning
  const observer = new MutationObserver(() => {
    const form = document.querySelector("#redemption-form");
    if (form && form.style.display !== "none") {
      fadeOutBridge();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  
  // --- Continue normal initialization ---
  loadAirports(); // fetch airport list
  
  // activate autocompletes
  setupAutocomplete("origin", "origin-suggestions");
  setupAutocomplete("destination", "destination-suggestions");
  
  // --- Routing Preference Button Logic (moved from redem-con.html) ---
  const directGroup = document.getElementById("directStop");
  const multiGroup  = document.getElementById("multiConn");
  const posGroup    = document.getElementById("posFlight");
  
  function activate(btn, group) {
    group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }
  
  // Direct Non-stop buttons
  if (directGroup && multiGroup) {
    directGroup.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activate(btn, directGroup);
        if (btn.dataset.val === "yes") {
          const noBtn = multiGroup.querySelector('button[data-val="no"]');
          if (noBtn) {
            multiGroup.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            noBtn.classList.add("active");
          }
        }
      });
    });
  
    // Multiple Connections buttons
    multiGroup.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activate(btn, multiGroup);
        if (btn.dataset.val === "yes") {
          const noBtn = directGroup.querySelector('button[data-val="no"]');
          if (noBtn) {
            directGroup.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            noBtn.classList.add("active");
          }
        }
      });
    });
  }
  
  // Positioning Flight Allowed buttons
  if (posGroup) {
    posGroup.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activate(btn, posGroup);
      });
    });
  }
  
  const searchBtn = document.getElementById("searchBtn");
  const warning = document.getElementById("searchWarning");


  // ---- toggle groups (Step 2)
  document.querySelectorAll(".toggle-group").forEach(group => {
    const btns = group.querySelectorAll("button");
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        btns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        validateStep2();
      });
    });
  });

  function validateStep2() {
    const filled = [...document.querySelectorAll(".toggle-group")].every(g =>
      g.querySelector("button.active")
    );
    searchBtn.disabled = !filled;
    warning.style.display = filled ? "none" : "block";
  }

  // ---- date mode toggle
  const exactBtn = document.getElementById("exactBtn");
  const flexBtn = document.getElementById("flexBtn");
  const flexPicker = document.getElementById("flexPicker");
  if (exactBtn && flexBtn && flexPicker) {
    exactBtn.onclick = () => {
      exactBtn.classList.add("active");
      flexBtn.classList.remove("active");
      flexPicker.style.display = "none";
    };
    flexBtn.onclick = () => {
      flexBtn.classList.add("active");
      exactBtn.classList.remove("active");
      flexPicker.style.display = "block";
    };
  }

  // ---- search click
  searchBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (searchBtn.disabled) return;

    const payload = {
      origin: document.getElementById("origin").value.trim().toUpperCase(),
      destination: document.getElementById("destination").value.trim().toUpperCase(),
      passengers: document.getElementById("passengers").value,
      cabin: document.getElementById("cabin").value,
      program: document.getElementById("program").value,
      date: document.getElementById("departDate").value,
      flexDays: document.getElementById("flexDays")?.value || 0,
      mode: flexBtn.classList.contains("active") ? "flex" : "exact",
      direct: document.querySelector("#directStop button.active")?.dataset.val,
      multi: document.querySelector("#multiConn button.active")?.dataset.val,
      positioning: document.querySelector("#posFlight button.active")?.dataset.val,
    };

    // Expand flexDays into a date array
    const departDate = document.getElementById("departDate").value;
    const flexRange = parseInt(document.getElementById("flexDays").value) || 0;
    const searchDates = [];
    
    for (let i = -flexRange; i <= flexRange; i++) {
      const d = new Date(departDate);
      d.setDate(d.getDate() + i);
      searchDates.push(d.toISOString().split("T")[0]);
    }
    
    // Replace single date with array for the API payload
    payload.searchDates = searchDates;
    delete payload.date;

    
    if (!payload.origin || !payload.destination || !payload.searchDates?.length) {
      alert("Please complete all Step 1 fields before searching.");
      return;
    }

    console.log("IS outbound search payload:", payload);

    try {
      const res = await fetch("/api/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      console.log("🧠 Redemption API response:", data);

      // --- Save the API results for the results page ---
      localStorage.setItem("latestRedemptionResults", JSON.stringify(data.results));
      console.log("✅ sessionStorage write complete:", sessionStorage.getItem("latestRedemptionResults"));
      
      // --- Redirect after short delay ---
      setTimeout(() => {
        console.log("Redirecting to results page...");
        window.location.href = "https://conciergesync.ai/dev/redemption-results.html";
      }, 500);

      localStorage.setItem(
        "latestRedemptionResults",
        JSON.stringify(data.results || [])
      );
      
      const sessionId = data.sessionId || Date.now();
      window.location.href = "/dev/redemption-results.html";
    } catch (err) {
      console.error("❌ Redemption fetch error:", err);
      alert("Search failed – check console for details.");
    }
  });

  // --- Autocomplete Setup Function ---
function setupAutocomplete(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);
  if (!input || !suggestions) return;

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    suggestions.innerHTML = "";
    if (query.length < 2) return;

    const matches = airports
      .filter(a =>
        a.iata.toLowerCase().includes(query) ||
        a.airport.toLowerCase().includes(query) ||
        (a.region_name && a.region_name.toLowerCase().includes(query))
      )
      .slice(0, 10);

    matches.forEach(match => {
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

  // Hide dropdown when clicking elsewhere
  document.addEventListener("click", e => {
    if (!suggestions.contains(e.target) && e.target !== input) {
      suggestions.innerHTML = "";
    }
  });
}
