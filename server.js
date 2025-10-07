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
app.use(express.static(path.join(__dirname)));
app.use("/dev", express.static(path.join(__dirname, "dev")));

// ===============================================
// Live Redemption Search Endpoint
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

    const apiResponse = await seatsService.searchFlights({
      origin: payload.origin,
      destination: payload.destination,
      startDate: payload.date,
      endDate: payload.date,
      take: 40,
    });

    console.log("🛫 SA search returned:", apiResponse?.data?.length || 0, "results");
    console.log(
      "🧠 RAW SA RESPONSE SAMPLE:",
      JSON.stringify(apiResponse?.data?.slice(0, 3), null, 2)
    );

    // (optional) sanity filter before returning
    const filtered = applySanityFilter(apiResponse.data || []);

    // --- Filter by selected program if provided ---
    let finalResults = filtered;
    if (payload.program) {
      const selectedProgram = payload.program.toLowerCase();
      finalResults = filtered.filter(
        r => r.Source?.toLowerCase() === selectedProgram
      );
    }
    
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
