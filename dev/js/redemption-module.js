console.log("✅ redemption-module.js loaded into browser");
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session");

  console.log("Loading session:", sessionId);

  const tableBody = document.getElementById("resultsBody");
  const noResults = document.getElementById("noResults");
  const avgValueEl = document.createElement("p");
  avgValueEl.id = "avgValue";
  avgValueEl.style.marginTop = "10px";
  avgValueEl.style.color = "#777";
  avgValueEl.textContent = "Avg Cost per Mile: —";
  document.querySelector(".hero").appendChild(avgValueEl);

  if (!sessionId) {
    console.error("❌ No session ID found in URL.");
    noResults.textContent = "No session ID provided.";
    return;
  }

  try {
    const res = await fetch(`/api/redemption/session/${sessionId}`);
    const data = await res.json();

    if (!data || !Array.isArray(data.results)) {
      throw new Error("Invalid or missing results array");
    }

    displayResults(data.results);
  } catch (err) {
    console.error("❌ Failed to load session data:", err);
    if (noResults) noResults.textContent = "Failed to load results.";
  }

  function displayResults(results) {
    if (!results || results.length === 0) {
      noResults.textContent = "No results to display yet.";
      return;
    }

    noResults.textContent = ""; // hide placeholder

    let totalValue = 0;
    results.forEach(r => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td data-label="Date">${r.date}</td>
        <td data-label="Origin">${r.origin}</td>
        <td data-label="Destination">${r.destination}</td>
        <td data-label="Program">${r.program}</td>
        <td data-label="Points Needed">${r.miles.toLocaleString()}</td>
        <td data-label="Fees">${r.taxes !== "-" ? "$" + r.taxes : "-"}</td>
        <td data-label="Seats Available">${r.seats}</td>
        <td data-label="Value (¢/mile)">${r.cpm}</td>
      `;
      tableBody.appendChild(row);

      const numericValue = parseFloat(r.cpm);
      if (!isNaN(numericValue)) totalValue += numericValue;
      // Make initRedemptionModule globally visible
      window.initRedemptionModule = initRedemptionModule;
    });

    // update avg CPM
    const avg = (totalValue / results.length).toFixed(2);
    avgValueEl.textContent = `Avg Cost per Mile: ${avg}¢`;
  }
});
