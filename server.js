const express = require("express");
const path = require("path");
const app = express();
app.use(express.json()); // <-- add this so we can read JSON bodies
const PORT = process.env.PORT || 3000;

// Serve everything in repo (index.html, /dev/, /assets/, etc.)
app.use(express.static(path.join(__dirname)));

// Explicitly serve /dev folder
app.use('/dev', express.static(path.join(__dirname, 'dev')));

// POST /api/redemption
app.post("/api/redemption", async (req, res) => {
  try {
    const { origin, destination, date, passengers, cabin, flexMode, flexDays, routing } = req.body;

    // Validation
    if (!origin || !destination) {
      return res.status(400).json({
        error: "missing_airports",
        message: "Origin and destination are required.",
        received: { origin, destination }
      });
    }

    // ---- Seats.aero API call ----
    const seatsRes = await fetch("https://api.seats.aero/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SEATSAERO_KEY}` // <-- use your key
      },
      body: JSON.stringify({
        origin,
        destination,
        date,
        passengers,
        cabin,
        flexMode,
        flexDays,
        routing
      }),
    });

    if (!seatsRes.ok) {
      const text = await seatsRes.text(); // log raw text for debugging
      console.error("❌ Seats.aero API error:", seatsRes.status, text);
      return res.status(seatsRes.status).json({
        error: "seats_api_error",
        status: seatsRes.status,
        message: text
      });
    }

    const data = await seatsRes.json();

    // ✅ Always return JSON to frontend
    return res.json({ results: data });

  } catch (err) {
    console.error("❌ Redemption API error:", err);
    return res.status(500).json({
      error: "server_error",
      message: err.message
    });
  }
});
app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
