const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// --- Safe fetch import for Render (works on Node 16+)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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

    // 🚨 Sanity filter is OFF for now
    // const filtered = applySanityFilter(apiResponse.data || []);
    // return res.json({ data: filtered });

    return res.json(apiResponse);
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

// --- Start server ---
app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
