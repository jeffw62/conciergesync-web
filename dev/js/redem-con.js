console.log("🔥 redem-con.js loaded, file executed");

// =====================================================================
// GLOBAL STATE (SAFE, NON-LEAKING)
// =====================================================================
let iataData = null;
let iataReady = false;
let iataBound = false;
let moduleInitialized = false;

// =====================================================================
// UNIVERSAL INITIALIZER (Runs exactly once)
// =====================================================================
function initRedemptionModule(root) {
  if (moduleInitialized) return;
  moduleInitialized = true;

  if (!root) return;
  console.log("🔧 INIT: Redemption Module Starting");

  // --- Elements ---
  const originInput = root.querySelector("#origin");
  const originList = root.querySelector("#origin-suggestions");

  const destInput = root.querySelector("#destination");
  const destList = root.querySelector("#destination-suggestions");

  const passengers = root.querySelector("#passengers");
  const serviceClass = root.querySelector("#serviceClass");
  const departDate = root.querySelector("#departDate");
  const returnDate = root.querySelector("#returnDate");

  const exactBtn = root.querySelector("#exactBtn");
  const flexBtn = root.querySelector("#flexBtn");
  const modeInput = root.querySelector("#mode");
  const flexPicker = root.querySelector("#flexPicker");
  const flexDays = root.querySelector("#flexDays");

  const partnerSpace = root.querySelector("#partnerSpace");
  const program = root.querySelector("#program");
  const allowBudget = root.querySelector("#allowBudget");

  const directGroup = root.querySelector("#directStop");
  const multiGroup = root.querySelector("#multiConn");
  const posGroup = root.querySelector("#posFlight");

  const searchBtn = root.querySelector("#searchBtn");
  const searchWarning = root.querySelector("#searchWarning");

  const spinner = root.querySelector("#spinner-overlay");

  // =====================================================================
  // IATA LOAD
  // =====================================================================
  async function loadIATA() {
    console.log("⏳ Loading IATA...");
    try {
      const res = await fetch("/dev/asset/iata-icao.json");
      const data = await res.json();
      iataData = data;
      iataReady = true;
      console.log("✅ IATA Loaded:", iataData.length, "records");

      if (!iataBound) bindIATA();
    } catch (err) {
      console.error("❌ IATA Load Failed:", err);
    }
  }

  // =====================================================================
  // IATA AUTOCOMPLETE
  // =====================================================================
  function bindField(input, list) {
    input.addEventListener("input", () => {
      if (!iataReady || !Array.isArray(iataData)) return;

      const q = input.value.trim().toUpperCase();
      if (!q) {
        list.innerHTML = "";
        return;
      }

      const matches = iataData.filter(
        (a) =>
          a.code.startsWith(q) ||
          (a.city && a.city.toUpperCase().startsWith(q)) ||
          (a.name && a.name.toUpperCase().startsWith(q))
      ).slice(0, 8);

      list.innerHTML = matches
        .map(
          (a) => `
          <div class="suggestion-item" data-code="${a.code}">
            <strong>${a.code}</strong> — ${a.city || ""} ${a.name || ""}
          </div>`
        )
        .join("");

      list.querySelectorAll(".suggestion-item").forEach((item) => {
        item.addEventListener("click", () => {
          input.value = item.dataset.code;
          list.innerHTML = "";
          validateReady();
        });
      });
    });

    input.addEventListener("blur", () => {
      setTimeout(() => (list.innerHTML = ""), 150);
    });
  }

  function bindIATA() {
    if (!iataReady || iataBound) return;
    console.log("🔗 Binding IATA Autocomplete");
    bindField(originInput, originList);
    bindField(destInput, destList);
    iataBound = true;
  }

  loadIATA();

  // =====================================================================
  // ROUTING TOGGLES
  // =====================================================================
  function setActive(group, val) {
    const yesBtn = group.querySelector('[data-val="yes"]');
    const noBtn = group.querySelector('[data-val="no"]');

    if (val === "yes") {
      yesBtn.classList.add("active");
      noBtn.classList.remove("active");
    } else {
      noBtn.classList.add("active");
      yesBtn.classList.remove("active");
    }
  }

  function getVal(group) {
    const b = group.querySelector("button.active");
    return b ? b.dataset.val : "no";
  }

  function disableGroup(group) {
    group.classList.add("disabled-toggle");
    group.querySelectorAll("button").forEach((b) => (b.disabled = true));
  }

  function enableGroup(group) {
    group.classList.remove("disabled-toggle");
    group.querySelectorAll("button").forEach((b) => (b.disabled = false));
  }

  function applyRoutingRules() {
    const direct = getVal(directGroup);
    const multi = getVal(multiGroup);

    // Direct YES → Multi forced NO, Positioning disabled
    if (direct === "yes") {
      setActive(multiGroup, "no");
      disableGroup(multiGroup);

      setActive(posGroup, "no");
      disableGroup(posGroup);
      return;
    }

    // Multi YES → Direct forced NO, Positioning enabled
    if (multi === "yes") {
      setActive(directGroup, "no");
      disableGroup(directGroup);

      enableGroup(posGroup);
      return;
    }

    // Both NO → Positioning forced NO + disabled
    if (direct === "no" && multi === "no") {
      enableGroup(directGroup);
      enableGroup(multiGroup);

      setActive(posGroup, "no");
      disableGroup(posGroup);
      return;
    }
  }

  directGroup.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      setActive(directGroup, b.dataset.val);
      applyRoutingRules();
      validateReady();
    });
  });

  multiGroup.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      setActive(multiGroup, b.dataset.val);
      applyRoutingRules();
      validateReady();
    });
  });

  posGroup.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      setActive(posGroup, b.dataset.val);
      validateReady();
    });
  });

  // =====================================================================
  // EXACT / FLEX MODE
  // =====================================================================
  exactBtn.addEventListener("click", () => {
    modeInput.value = "exact";
    exactBtn.classList.add("active");
    flexBtn.classList.remove("active");
    flexPicker.style.display = "none";
    validateReady();
  });

  flexBtn.addEventListener("click", () => {
    modeInput.value = "flex";
    flexBtn.classList.add("active");
    exactBtn.classList.remove("active");
    flexPicker.style.display = "block";
    validateReady();
  });

  // =====================================================================
  // FORM READINESS
  // =====================================================================
  function validateReady() {
    const o = originInput.value.trim();
    const d = destInput.value.trim();
    const dep = departDate.value;
    const svc = serviceClass.value;

    const direct = getVal(directGroup);
    const multi = getVal(multiGroup);
    const pos = getVal(posGroup);

    let ok = true;

    if (!o || !d || !dep || !svc) ok = false;
    if (direct !== "yes" && multi !== "yes") ok = false;
    if (multi === "yes" && pos !== "yes") ok = false;

    if (modeInput.value === "flex" && !flexDays.value) ok = false;

    searchBtn.disabled = !ok;
    searchWarning.style.display = ok ? "none" : "block";
  }

  passengers.addEventListener("input", validateReady);
  serviceClass.addEventListener("change", validateReady);
  departDate.addEventListener("change", validateReady);
  flexDays.addEventListener("change", validateReady);

  // =====================================================================
  // PAYLOAD BUILDER
  // =====================================================================
  function buildPayload() {
    return {
      origin: originInput.value.trim(),
      destination: destInput.value.trim(),
      departDate: departDate.value,
      returnDate: returnDate.value || null,
      passengers: passengers.value,
      serviceClass: serviceClass.value,
      allowBudget: allowBudget.checked,
      partnerSpace: partnerSpace.checked,
      program: program.value,

      direct: getVal(directGroup),
      multi: getVal(multiGroup),
      pos: getVal(posGroup),

      mode: modeInput.value,
      flexDays: flexDays.value || null
    };
  }

  // =====================================================================
  // SEARCH EXECUTION
  // =====================================================================
  searchBtn.addEventListener("click", async () => {
    if (searchBtn.disabled) return;

    const payload = buildPayload();
    console.log("🔍 SEARCH PAYLOAD:", payload);

    spinner.style.display = "flex";

    try {
      const res = await fetch("/api/redemption/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      spinner.style.display = "none";

      sessionStorage.setItem(
        "latestRedemptionResults",
        JSON.stringify(data)
      );

      document.dispatchEvent(
        new CustomEvent("workspace:navigate", {
          detail: { target: "redemption-results" }
        })
      );
    } catch (err) {
      console.error("❌ Search Error:", err);
      spinner.style.display = "none";
    }
  });

  // Final readiness pass
  applyRoutingRules();
  validateReady();
}

// =====================================================================
// UNIVERSAL BOOTSTRAP LAYER (Works in all environments)
// =====================================================================

// 1) module:ready event (console injection)
document.addEventListener("module:ready", (ev) => {
  const root =
    ev.detail?.root ||
    ev.detail?.element ||
    document.querySelector(".redem-con");

  if (root) initRedemptionModule(root);
});

// 2) DOMContentLoaded (direct page load)
window.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".redem-con");
  if (root) initRedemptionModule(root);
});

// 3) MutationObserver fallback (headless workspace)
const mo = new MutationObserver(() => {
  const root = document.querySelector(".redem-con");
  if (root) {
    initRedemptionModule(root);
    mo.disconnect();
  }
});
mo.observe(document.body, { childList: true, subtree: true });

