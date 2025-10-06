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

    const miles = r.milesNeeded || r.mileage_cost || 0;
    const taxes = r.taxes !== undefined ? r.taxes : r.TotalTaxes || "-";
    const cpm =
      miles > 0 && taxes !== "-" ? ((taxes * 100) / miles).toFixed(2) + "¢" : "-";

    row.innerHTML = `
      <td>${r.date || r.departure_date || "-"}</td>
      <td>${r.origin || r.origin_airport || "-"}</td>
      <td>${r.destination || r.destination_airport || "-"}</td>
      <td>${r.program || r.Source || "-"}</td>
      <td>${miles.toLocaleString()}</td>
      <td>${taxes !== "-" ? "$" + taxes : "-"}</td>
      <td>${r.seats !== undefined ? r.seats : r.RemainingSeatsRaw || "-"}</td>
      <td>${cpm}</td>
    `;

    tbody.appendChild(row);
  });
}
