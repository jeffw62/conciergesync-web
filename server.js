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

  /// Cached availability search (Pro users can use this)
    async availabilitySearch({ origin, destination, date, cabin, program }) {
  let url = `${this.baseUrl}/availability?origin=${origin}&destination=${destination}&date=${date}`;

  if (program) {
    url += `&sources=${program}`;
  }

  console.log("➡️ SA base request URL:", url);

  let allResults = [];
  let cursor = null;
  let skip = 0;
  let keepGoing = true;

  while (keepGoing) {
    let pageUrl = url;
    if (cursor) {
      pageUrl += `&skip=${skip}&cursor=${cursor}`;
    }

    console.log("➡️ Fetching:", pageUrl);

    const response = await fetch(pageUrl, {
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

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    if (results.length > 0) {
      allResults = allResults.concat(results);
      cursor = data.cursor;
      skip += results.length;
    } else {
      keepGoing = false;
    }
  }

  console.log(`➡️ Total results pulled: ${allResults.length}`);
  return { results: allResults };
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
      const { origin, destination, date, cabin, program } = req.body;
  
      if (!origin || !destination || !date || !cabin) {
        return res.status(400).json({
          error: "missing_parameters",
          message: "Origin, destination, date, and cabin are required."
        });
      }
  
      const apiResponse = await seatsService.availabilitySearch({
      origin: "DFW",
      destination: "LHR",
      date: "2025-10-15",
      cabin: "Y",         // economy as single letter
      program: "aeroplan" // known-good program
    });
  
      console.log("➡️ Full SA response object:", apiResponse);
  
      const results = Array.isArray(apiResponse)
        ? apiResponse
        : apiResponse.results || apiResponse.data || [];
  
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
