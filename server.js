// ===============================================
// ConciergeSync Web Service (Seats.Aero Integration)
// ===============================================
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// ===============================================
// Seats.Aero Partner Service Class
// ===============================================
class SeatsAeroService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://seats.aero/partnerapi";
  }

  async searchFlights({ origin, destination, startDate, endDate, take = 40 }) {
    const url = `${this.baseUrl}/search?origin_airport=${origin}&destination_airport=${destination}&start_date=${startDate}&end_date=${endDate}&take=${take}&include_trips=false&only_direct_flights=false&include_filtered=false`;

    console.log("➡️  SA search request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.Aero error ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log(`➡️  SA returned ${data.data?.length || 0} records`);
    return data; // { data: [...] }
  }
}

const seatsService = new SeatsAeroService(process.env.SEATSAERO_KEY);

// ===============================================
// Utility Filter (Optional sanity pass)
// ===============================================
function applySanityFilter(results) {
  return results.filter(r => {
    const miles = parseInt(
      r.YMileageCost || r.JMileageCost || r.FMileageCost || 0,
      10
    );
    const fees = r.TotalTaxes ? r.TotalTaxes / 100 : 0;
    if (!miles || miles <= 0) return false;
    if (miles > 500000) return false;
    if (fees < 0) return false;
    return true;
  });
}

// ===============================================
// Static File Handling
// ===============================================
// Serve static files from the dev directory
app.use("/dev", express.static(path.join(__dirname, "dev")));

// ===============================================
// Live Redemption Search Endpoint (dynamic window)
// ===============================================
app.post("/api/redemption", async (req, res) => {
  try {
    const payload = req.body;
    console.log("📦 Received redemption payload:", payload);

    if (!payload.origin || !payload.destination || !payload.date) {
      return res.status(400).json({
        error: "missing_parameters",
        message: "Origin, destination, and date are required.",
      });
    }

    // determine search window based on mode (exact vs flexible)
    const flexDays = parseInt(payload.flexDays || 0, 10);
    const mode = payload.mode || "exact";
    const windowDays = mode === "flex" ? flexDays : 0;

    const base = new Date(payload.date + "T00:00:00");
    const start = new Date(base);
    start.setDate(start.getDate() - windowDays);
    const end = new Date(base);
    end.setDate(end.getDate() + windowDays);

    const toDateStr = d =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const results = [];
    let day = new Date(start);

    console.log(
      `📅 Mode: ${mode.toUpperCase()} | Window: ${windowDays} days | Range: ${toDateStr(
        start
      )} → ${toDateStr(end)}`
    );

    // loop daily if flex mode, single call if exact
    while (day <= end) {
      const dateStr = toDateStr(day);
      console.log(`🔍 Fetching ${dateStr}`);
      try {
        const resp = await seatsService.searchFlights({
          origin: payload.origin,
          destination: payload.destination,
          startDate: dateStr,
          endDate: dateStr,
          take: 40,
        });
        if (resp?.data?.length) results.push(...resp.data);
      } catch (innerErr) {
        console.warn(`⚠️  Failed on ${dateStr}:`, innerErr.message);
      }
      if (mode === "exact") break; // stop after one iteration
      day.setDate(day.getDate() + 1);
    }

    console.log(`🧩 Combined ${results.length} results total`);

    // (optional) sanity filter before returning
    const filtered = applySanityFilter(results);

    // --- Cabin filter and normalization ---
    const cabin = (payload.cabin || "Economy").toLowerCase();
    
    const cabinFieldMap = {
      economy: "YMileageCost",
      premium: "PMileageCost",
      business: "JMileageCost",
      first: "FMileageCost",
    };
    
    // Determine which field to read for miles
    const cabinField = cabinFieldMap[cabin] || "YMileageCost";
    
    // Replace generic MilesNeeded with cabin-specific value
    const cabinAdjusted = filtered.map(r => {
      const miles = r[cabinField] || r.YMileageCost || 0;
      return { ...r, MilesNeeded: miles };
    });
    
    // --- Filter by selected program if provided ---
    const selectedProgram = payload.program.toLowerCase();
    const finalResults = selectedProgram
      ? cabinAdjusted.filter(r => r.Source?.toLowerCase() === selectedProgram)
      : cabinAdjusted;

    res.status(200).json({
      sessionId: Date.now(),
      results: finalResults,
    });
  } catch (err) {
    console.error("❌ Redemption API error:", err);
    res.status(500).json({
      error: "server_error",
      message: err.message,
      stack: err.stack,
    });
  }
});

// ===============================================
// Bulk Test Route (optional diagnostic)
// ===============================================
app.get("/api/redemption/testBulk", async (req, res) => {
  try {
    const url = `${seatsService.baseUrl}/bulk-availability?sources=aeroplan&region=NorthAmerica-Europe&month=2025-10`;
    console.log("➡️  SA Bulk request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": seatsService.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.Aero error ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log("🔍 SA sample record:", data[0] || data.results?.[0]);
    res.json(data);
  } catch (err) {
    console.error("❌ Bulk API error:", err);
    res.status(500).json({
      error: "server_error",
      message: err.message,
    });
  }
});

// ===============================================
// Start Server
// ===============================================
app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
