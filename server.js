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
        source: program, // e.g. "united", "delta", "aeroplan"
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
    const { origin, destination, date, program, passengers } = req.body;

    if (!origin || !destination || !date || !program) {
      return res.status(400).json({
        error: "missing_parameters",
        message: "Origin, destination, date, and program are required."
      });
    }

    // Step 2 integration stub: later we’ll replace `program` with user’s profile data
    // For now, just use the program passed from frontend
    const results = await seatsService.liveSearch({ origin, destination, date, program, passengers });

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
