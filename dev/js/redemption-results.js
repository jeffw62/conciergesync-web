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
  if (!tbody) {
    console.warn("⚠️ Table body not found.");
    return;
  }

  tbody.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;">No results found.</td></tr>';
    return;
  }

  // Economy by default
  const prefix = "Y";

  results.forEach((r) => {
    const row = document.createElement("tr");

    const date = r.Date || "—";
    const origin = r.Route?.OriginAirport || "—";
    const destination = r.Route?.DestinationAirport || "—";
    const program = r.Source || "—";
    const miles = r[`${prefix}MileageCostRaw`] || 0;
    const taxes = r[`${prefix}TotalTaxesRaw`]
      ? (r[`${prefix}TotalTaxesRaw`] / 100).toFixed(2)
      : "—";
    const seats = r[`${prefix}RemainingSeatsRaw`] || "—";

    // Calculate cents per mile (Value column)
    let cpm = "—";
    if (miles && typeof miles === "number" && miles > 0) {
      const feeDollars = typeof taxes === "string" ? parseFloat(taxes) : taxes;
      if (!isNaN(feeDollars)) {
        const centsPerMile = ((feeDollars * 100) / miles).toFixed(2);
        cpm = `${centsPerMile}¢`;
      }
    }

    row.innerHTML = `
      <td data-label="Date">${date}</td>
      <td data-label="Origin">${origin}</td>
      <td data-label="Destination">${destination}</td>
      <td data-label="Airline">${program}</td>
      <td data-label="Miles Needed">${miles.toLocaleString()}</td>
      <td data-label="Taxes/Fees">${taxes !== "—" ? "$" + taxes : "—"}</td>
      <td data-label="Seats Available">${seats}</td>
      <td data-label="Value (¢/mile)">${cpm}</td>
    `;

    tbody.appendChild(row);
  });
}
