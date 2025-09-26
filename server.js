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

  /// Cached availability search
  async availabilitySearch({ origin, destination, date, program }) {
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

  // Live search (unused for now)
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
  // --- Bulk Availability test route ---
  app.get("/api/redemption/testBulk", async (req, res) => {
    try {
      const url = `${seatsService.baseUrl}/bulk-availability?sources=aeroplan&month=2025-10`;
  
      console.log("➡️ SA Bulk request URL:", url);
  
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Partner-Authorization": seatsService.apiKey,
          "accept": "application/json"
        }
      });
  
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Seats.aero error ${response.status}: ${text}`);
      }
  
      const data = await response.json();
      console.log("➡️ SA Bulk response sample:", data);
  
      return res.json(data);
    } catch (err) {
      console.error("❌ Bulk API error:", err);
      return res.status(500).json({
        error: "server_error",
        message: err.message
      });
    }
  });


// --- Start server ---
app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
