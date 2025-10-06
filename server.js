const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// --- Service class for Seats.aero Partner API ---
class SeatsAeroService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://seats.aero/partnerapi";
  }

  /// Flight search using /search endpoint
  async searchFlights({ origin, destination, startDate, endDate, take = 500 }) {
    const url = `${this.baseUrl}/search?origin_airport=${origin}&destination_airport=${destination}&start_date=${startDate}&end_date=${endDate}&take=${take}&include_trips=false&only_direct_flights=false&include_filtered=false`;

    console.log("➡️ SA search request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": this.apiKey,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.aero error ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log(`➡️ SA returned ${data.data?.length || 0} records`);
    return data; // { data: [...] }
  }
}

// Initialize service
const seatsService = new SeatsAeroService(process.env.SEATSAERO_KEY);

// --- ARE YOU OUT OF YOUR MIND filter (simplified) ---
function applySanityFilter(results) {
  return results.filter(r => {
    const miles = parseInt(
      r.YMileageCost || r.JMileageCost || r.FMileageCost || 0,
      10
    );
    const fees = r.TotalTaxes ? r.TotalTaxes / 100 : 0;

    if (!miles || miles <= 0) return false;   // no mileage cost
    if (miles > 500000) return false;         // absurd unicorn
    if (fees < 0) return false;               // impossible fee

    return true; // keep everything else
  });
}

// --- Serve static files ---
app.use(express.static(path.join(__dirname)));
app.use("/dev", express.static(path.join(__dirname, "dev")));

// --- Redemption route (frontend calls this) ---
app.post("/api/redemption", async (req, res) => {
  try {
    const { origin, destination, startDate, endDate } = req.body;

    if (!origin || !destination || !startDate || !endDate) {
      return res.status(400).json({
        error: "missing_parameters",
        message: "Origin, destination, startDate, and endDate are required.",
      });
    }

    // Call SA
    const apiResponse = await seatsService.searchFlights({
      origin,
      destination,
      startDate,
      endDate,
    });

    // Apply sanity filter
    const filtered = applySanityFilter(apiResponse.data || []);

    console.log(
      `➡️ Filtered results: ${filtered.length} of ${
        apiResponse.data?.length || 0
      }`
    );

    return res.json({ results: filtered });
  } catch (err) {
    console.error("❌ Redemption API error:", err);
    return res.status(500).json({
      error: "server_error",
      message: err.message,
      stack: err.stack,
    });
  }
});

// --- Bulk test route (optional, may still be restricted) ---
app.get("/api/redemption/testBulk", async (req, res) => {
  try {
    const url = `${seatsService.baseUrl}/bulk-availability?sources=aeroplan&region=NorthAmerica-Europe&month=2025-10`;
    console.log("➡️ SA Bulk request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": seatsService.apiKey,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.aero error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("❌ Bulk API error:", err);
    return res.status(500).json({
      error: "server_error",
      message: err.message,
    });
  }
});
// --- Temporary session route to prevent 404 ---
app.get("/api/redemption/session/:id", (req, res) => {
  const { id } = req.params;
  console.log(`Session request received for ID: ${id}`);
  // Send a minimal dummy payload for now
  res.json({
    sessionId: id,
    status: "ok",
    results: []
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
