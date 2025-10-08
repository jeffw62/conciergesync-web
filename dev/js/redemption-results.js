// =====================================================
// ConciergeSync™ Redemption Results Loader (Stable Build)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔎 Loading redemption results…");

  // --- Load redemption results from localStorage ---
  const stored = localStorage.getItem("latestRedemptionResults");

  if (stored) {
    console.log("✅ Found stored results in localStorage");
    const results = JSON.parse(stored);
    renderResults(results);
  } else {
    console.warn("❌ No results found in localStorage");
    const body = document.getElementById("resultsBody");
    if (body) {
      body.innerHTML =
        '<tr><td colspan="8" style="text-align:center;">No results to display.</td></tr>';
    }
  }
});

// =====================================================
// Render Function
// =====================================================
function renderResults(results) {
  const tbody = document.getElementById("resultsBody");
  const summary = document.getElementById("results-summary");

  if (!tbody) {
    console.warn("⚠️ Table body not found.");
    return;
  }

  tbody.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    if (summary) summary.textContent = "No results found for this search.";
    return;
  }

  if (summary)
    summary.textContent = `${results.length} redemption options found.`;

  results.forEach((r) => {
    const row = document.createElement("tr");

    // --- Adjust field mappings to your actual JSON structure ---
    const date =
      r.date ||
      r.DepartureDate ||
      r.departure_date ||
      r.FlightDate ||
      "-";

    const origin =
      r.origin ||
      r.Origin ||
      r.OriginAirport ||
      r.origin_airport ||
      "-";

    const destination =
      r.destination ||
      r.Destination ||
      r.DestinationAirport ||
      r.destination_airport ||
      "-";

    const program =
      r.program ||
      r.Program ||
      r.Source ||
      r.Airline ||
      "-";

    const miles =
      r.MilesNeeded ||
      r.milesNeeded ||
      r.Miles ||
      r.mileage_cost ||
      r.YMileageCost ||
      r.JMileageCost ||
      r.FMileageCost ||
      0;

    const taxes = r.taxes ?? r.TotalTaxes ?? r.Taxes ?? "-";
    const seats = r.seats ?? r.RemainingSeatsRaw ?? r.Seats ?? "-";

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
