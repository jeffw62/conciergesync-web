// =====================================================
// ConciergeSync™ Redemption Results Loader (Final Build)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔎 Loading redemption results…");

  const stored = localStorage.getItem("latestRedemptionResults");

  if (stored) {
    console.log("✅ Found stored results in localStorage");
    const results = JSON.parse(stored);
    renderResults(results);
  } else {
    console.warn("❌ No results found in localStorage");
    const body = document.getElementById("results-body");
    if (body) {
      body.innerHTML =
        '<tr><td colspan="8" style="text-align:center;">No results to display.</td></tr>';
    }
  }
});

// =====================================================
// Render Function – Multi-Cabin Output
// =====================================================
function renderResults(results) {
  const tbody = document.getElementById("results-body");
  if (!tbody) {
    console.warn("⚠️ Table body not found.");
    return;
  }

  tbody.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" style="text-align:center;">No results found.</td></tr>';
    return;
  }

  results.forEach((r) => {
    const row = document.createElement("tr");

    const date = r.Date || "—";
    const origin = r.Route?.OriginAirport || r.Origin || "—";
    const destination = r.Route?.DestinationAirport || r.Destination || "—";
    const program = r.Source || r.Program || "—";

    // --- Cabin data direct from API ---
    const yMiles = r.YMileageCost || 0;
    const pMiles = r.PMileageCost || 0;
    const jMiles = r.JMileageCost || 0;
    const fMiles = r.FMileageCost || 0;
    const taxes = r.YTotalTaxesRaw && r.YTotalTaxesRaw > 0
      ? (r.YTotalTaxesRaw / 100).toFixed(2)
      : "—";

    row.innerHTML = `
      <td data-label="Date">${date}</td>
      <td data-label="Origin">${origin}</td>
      <td data-label="Destination">${destination}</td>
      <td data-label="Program">${program}</td>
      <td data-label="Economy">${yMiles ? yMiles.toLocaleString() + " pts" : "—"}</td>
      <td data-label="Premium">${pMiles ? pMiles.toLocaleString() + " pts" : "—"}</td>
      <td data-label="Business">${jMiles ? jMiles.toLocaleString() + " pts" : "—"}</td>
      <td data-label="First">${fMiles ? fMiles.toLocaleString() + " pts" : "—"}</td>
      <td data-label="Taxes / Fees">${taxes !== "—" ? "$" + taxes : "—"}</td>
    `;

    tbody.appendChild(row);
  });
}
