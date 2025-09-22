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
    const { origin, destination, date } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        error: "missing_airports",
        message: "Origin and destination are required.",
      });
    }

    // Call Seats.aero Partner API
    const seatsRes = await fetch("https://seats.aero/partnerapi/routes", {
      method: "GET",
      headers: {
        "Partner-Authorization": process.env.SEATSAERO_KEY,
        "accept": "application/json"
      }
    });

    if (!seatsRes.ok) {
      const text = await seatsRes.text();
      console.error("❌ Seats.aero Partner API error:", seatsRes.status, text);
      return res.status(seatsRes.status).json({
        error: "seats_api_error",
        status: seatsRes.status,
        message: text
      });
    }

    const data = await seatsRes.json();
    return res.json({ results: data });

  } catch (err) {
    console.error("❌ Redemption API error:", err);
    return res.status(500).json({
      error: "server_error",
      message: err.message,
      stack: err.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
