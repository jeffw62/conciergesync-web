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

  // Cached availability search (Pro users can use this)
  async availabilitySearch({ origin, destination, date, cabin }) {
    const url = `${this.baseUrl}/availability?origin=${origin}&destination=${destination}&date=${date}&cabin=${cabin}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": this.apiKey,
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.aero error ${response.status}: ${text}`);
    }

    return response.json();
  }

  // Your old liveSearch stays here for later if you ever get access
  async liveSearch({ origin, destination, date, program, passengers = 1 }) {
    const response = await fetch(`${this.baseUrl}/live`, {
      method: "POST",
      headers: {
        "Partner-Authorization": this.apiKey,
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        origin_airport: origin,
        destination_airport: destination,
        departure_date: date,
        source: program,
        seat_count: passengers,
        disable_filters: false,
        show_dynamic_pricing: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.aero error ${response.status}: ${text}`);
    }

    return response.json();
  }
}

// Initialize service
const seatsService = new SeatsAeroService(process.env.SEATSAERO_KEY);

// --- Serve static files ---
app.use(express.static(path.join(__dirname)));
app.use('/dev', express.static(path.join(__dirname, 'dev')));

// --- Redemption route ---
app.post("/api/redemption", async (req, res) => {
  try {
    const { origin, destination, date, cabin } = req.body;

    if (!origin || !destination || !date || !cabin) {
      return res.status(400).json({
        error: "missing_parameters",
        message: "Origin, destination, date, and cabin are required."
      });
    }

    const apiResponse = await seatsService.availabilitySearch({
      origin,
      destination,
      date,
      cabin: cabin || "economy"
    });

    // ✅ Fix fees: divide by 100 and ensure two decimals
    const results = (apiResponse.results || []).map((item) => {
      let fees = "0.00";
      if (item.fees !== undefined && item.fees !== null) {
        fees = (Number(item.fees) / 100).toFixed(2);
      }
      return {
        ...item,
        fees
      };
    });

    return res.json({ results });
  } catch (err) {
    console.error("❌ Redemption API error:", err);
    return res.status(500).json({
      error: "server_error",
      message: err.message,
      stack: err.stack
    });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
