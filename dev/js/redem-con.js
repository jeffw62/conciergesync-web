console.log("🔥 redem-con.js loaded (CCT Clean Build)");

// =====================================================================
// GLOBAL STATE (SAFE, NON-LEAKING)
// =====================================================================
let moduleInitialized = false;
let iataData = [];
let iataLoaded = false;
let iataBound = false;

// =====================================================================
// MAIN INITIALIZER (RUNS EXACTLY ONCE)
// =====================================================================
function initRedemptionModule(root) {
  if (!root || moduleInitialized) return;
  moduleInitialized = true;

  console.log("🔧 INIT: Redemption Module (CCT Build)");

  // -------------------------------------------------------------------
  // ELEMENT HOOKS
  // -------------------------------------------------------------------
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

  const allowBudget = root.querySelector("#allowBudget");
  const partnerSpace = root.querySelector("#partnerSpace");
  const program = root.querySelector("#program");

  const directGroup = root.querySelector("#directStop");
  const multiGroup = root.querySelector("#multiConn");
  const posGroup = root.querySelector("#posFlight");

  const searchBtn = root.querySelector("#searchBtn");
  const searchWarning = root.querySelector("#searchWarning");

  const spinner = root.querySelector("#spinner-overlay");

  // =====================================================================
  // LOAD IATA (CCT SAFE)
  // =====================================================================
  async function loadIATA() {
    try {
      console.log("⏳ Loading IATA Index…");
      const res = await fetch("/dev/asset/iata-icao.json");
      const data = await res.json();

      iataData = data || [];
      iataLoaded = true;

      console.log(`✅ IATA Ready (${iataData.length} entries)`);

      if (!iataBound) bindAllIATA();
    } catch (err) {
      console.error("❌ IATA Load Failed:", err);
    }
  }

  // =====================================================================
  // BIND AUTOCOMPLETE TO A FIELD
  // =====================================================================
  function bindIATAField(input, list) {
    input.addEventListener("input", () => {
      if (!iataLoaded) return;

      const q = input.value.trim().toUpperCase();
      if (!q) {
        list.innerHTML = "";
        return;
      }

      const matches = iataData
        .filter((a) => {
          const code = a.code?.toUpperCase() || "";
          const city = a.city?.toUpperCase() || "";
          const name = a.name?.toUpperCase() || "";

          return (
            code.startsWith(q) ||
            city.startsWith(q) ||
            name.startsWith(q)
          );
        })
        .slice(0, 8);

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

    input.addEventListener("blur", () =>
      setTimeout(() => (list.innerHTML = ""), 150)
    );
  }

  // =====================================================================
  // BIND AUTOCOMPLETE TO BOTH FIELDS
  // =====================================================================
  function bindAllIATA() {
    if (iataBound) return;

    console.log("🔗 Binding IATA Autocomplete");
    bindIATAField(originInput, originList);
    bindIATAField(destInput, destList);

    iataBound = true;
  }

  loadIATA();

  // =====================================================================
  // ROUTING LOGIC (CCT CORRECT)
  // =====================================================================
  function setActive(group, val) {
    const yes = group.querySelector('[data-val="yes"]');
    const no = group.querySelector('[data-val="no"]');

    if (val === "yes") {
      yes.classList.add("active");
      no.classList.remove("active");
    } else {
      no.classList.add("active");
      yes.classList.remove("active");
    }
  }

  function getVal(group) {
    return group.querySelector("button.active")?.dataset.val || "no";
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

    // DIRECT = YES
    if (direct === "yes") {
      // Multi: forced NO, but NOT dim
      setActive(multiGroup, "no");
      enableGroup(multiGroup);

      // Positioning: forced NO + dim
      setActive(posGroup, "no");
      disableGroup(posGroup);

      return;
    }

    // MULTI = YES
    if (multi === "yes") {
      // Direct: forced NO + dim
      setActive(directGroup, "no");
      disableGroup(directGroup);

      // Positioning: active
      enableGroup(posGroup);

      return;
    }

    // BOTH = NO
    enableGroup(directGroup);
    enableGroup(multiGroup);

    setActive(posGroup, "no");
    disableGroup(posGroup);
  }

  directGroup.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      setActive(directGroup, b.dataset.val);
      applyRoutingRules();
      validateReady();
    })
  );

  multiGroup.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      setActive(multiGroup, b.dataset.val);
      applyRoutingRules();
      validateReady();
    })
  );

  posGroup.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      setActive(posGroup, b.dataset.val);
      validateReady();
    })
  );

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
  // READINESS CHECK
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
  // SEARCH PAYLOAD
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
      flexDays: flexDays.value || null,
    };
  }

  // =====================================================================
  // SEARCH EXECUTION
  // =====================================================================
  searchBtn.addEventListener("click", async () => {
    if (searchBtn.disabled) return;

    const payload = buildPayload();
    console.log("🔍 SEARCH:", payload);

    spinner.style.display = "flex";

    try {
      const res = await fetch("/api/redemption/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      spinner.style.display = "none";

      sessionStorage.setItem(
        "latestRedemptionResults",
        JSON.stringify(data)
      );

      document.dispatchEvent(
        new CustomEvent("workspace:navigate", {
          detail: { target: "redemption-results" },
        })
      );
    } catch (err) {
      console.error("❌ Search Error:", err);
      spinner.style.display = "none";
    }
  });

  applyRoutingRules();
  validateReady();
}

// =====================================================================
// UNIVERSAL BOOTSTRAP (CCT GUARANTEED INIT)
// =====================================================================

// A) module:ready → console injection
document.addEventListener("module:ready", (ev) => {
  const root =
    ev.detail?.root ||
    ev.detail?.element ||
    document.querySelector(".redem-con");

  if (root) initRedemptionModule(root);
});

// B) DOM ready → direct load
window.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".redem-con");
  if (root) initRedemptionModule(root);
});

// C) MutationObserver → late injection
const mo = new MutationObserver(() => {
  const root = document.querySelector(".redem-con");
  if (root) {
    initRedemptionModule(root);
    mo.disconnect();
  }
});
mo.observe(document.body, { childList: true, subtree: true });
