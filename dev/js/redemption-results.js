document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session");

  console.log("🧩 Loading session:", sessionId);

  fetch(`/api/redemption/session/${sessionId}`)
    .then(res => res.json())
    .then(data => {
      displayResults(data);
    })
    .catch(err => {
      console.error("❌ Failed to load session data:", err);
      const body = document.getElementById("resultsBody");
      body.innerHTML = `<tr><td colspan="8" style="text-align:center;">Failed to load results</td></tr>`;
    });
});

function displayResults(data) {
  const tbody = document.getElementById("resultsBody");
  const summary = document.getElementById("results-summary");
  tbody.innerHTML = "";

  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    summary.textContent = "No results found for this search.";
    return;
  }

  summary.textContent = `${data.results.length} redemption options found.`;

  data.results.forEach(r => {
    const row = document.createElement("tr");
  
    const miles = r.milesNeeded || 0;
    const taxes = r.taxes !== undefined ? r.taxes : "-";
    const cpm = miles > 0 && taxes !== "-" ? ((taxes * 100) / miles).toFixed(2) + "¢" : "-";
  
    row.innerHTML = `
      <td>${r.date || "-"}</td>
      <td>${r.origin || "-"}</td>
      <td>${r.destination || "-"}</td>
      <td>${r.program || "-"}</td>
      <td>${miles.toLocaleString()}</td>
      <td>${taxes !== "-" ? "$" + taxes : "-"}</td>
      <td>${r.seats !== undefined ? r.seats : "-"}</td>
      <td>${cpm}</td>
    `;
  
    tbody.appendChild(row);
  });

}
