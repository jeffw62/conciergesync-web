// =====================================================
// ConciergeSync™ Redemption Results Loader (Stable Build)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔎 Loading redemption results…");

  // Try to read saved results from sessionStorage
  const stored = sessionStorage.getItem("latestRedemptionResults");

  if (stored) {
    console.log("✅ Found stored results in sessionStorage");
    const results = JSON.parse(stored);
    renderResults(results);

    // clear storage after render so refresh doesn’t reuse old data
    sessionStorage.removeItem("latestRedemptionResults");
  } else {
    console.warn("⚠️ No stored results found — displaying empty table");
    const body = document.getElementById("resultsBody");
    body.innerHTML =
      '<tr><td colspan="8" style="text-align:center;">No results to display.</td></tr>';
  }
});

// =====================================================
// Render Function
// =====================================================
function renderResults(results) {
  const tbody = document.getElementById("resultsBody");
  const summary = document.getElementById("results-summary");

  tbody.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    summary.textContent = "No results found for this search.";
    return;
  }

  summary.textContent = `${results.length} redemption options found.`;

  results.forEach((r) => {
    const row = document.createElement("tr");
  
    const date = r.date || r.DepartureDate || r.departure_date || "-";
    const origin = r.origin || r.OriginAirport || r.origin_airport || "-";
    const destination = r.destination || r.DestinationAirport || r.destination_airport || "-";
    const program = r.program || r.Source || "-";
    const miles =
      r.milesNeeded ||
      r.mileage_cost ||
      r.YMileageCost ||
      r.JMileageCost ||
      r.FMileageCost ||
      0;
    const taxes = r.taxes ?? r.TotalTaxes ?? "-";
    const seats = r.seats ?? r.RemainingSeatsRaw ?? "-";
    const cpm =
      miles > 0 && taxes !== "-"
        ? ((taxes * 100) / miles).toFixed(2) + "¢"
        : "-";
  
    row.innerHTML = `
      <td>${date}</td>
      <td>${origin}</td>
      <td>${destination}</td>
      <td>${program}</td>
      <td>${miles.toLocaleString()}</td>
      <td>${taxes !== "-" ? "$" + taxes : "-"}</td>
      <td>${seats}</td>
      <td>${cpm}</td>
    `;
  
    tbody.appendChild(row);
  });

}
