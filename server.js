const express = require("express");
const path = require("path");
const app = express();
app.use(express.json()); // <-- add this so we can read JSON bodies
const PORT = process.env.PORT || 3000;

// Serve everything in repo (index.html, /dev/, /assets/, etc.)
app.use(express.static(path.join(__dirname)));

// Explicitly serve /dev folder
app.use('/dev', express.static(path.join(__dirname, 'dev')));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Example Express backend for /api/redemption
  app.post("/api/redemption", async (req, res) => {
    try {
      const { origin, destination, date } = req.body;
  
      // Validation check
      if (!origin || !destination) {
        return res.status(400).json({
          error: "missing_airports",
          message: "Origin and destination are required.",
        });
      }
  
      // ---- Seats.aero call (simplified) ----
      const seatsRes = await fetch("https://seats.aero/api/whatever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
  
      if (!seatsRes.ok) {
        return res.status(500).json({
          error: "seats_api_error",
          status: seatsRes.status,
        });
      }
  
      const data = await seatsRes.json();
  
      // Send results back to frontend
      return res.json({ results: data });
    } catch (err) {
      console.error("Redemption API error:", err);
      return res.status(500).json({
        error: "server_error",
        message: err.message,
      });
    }
  });
  
  app.listen(PORT, () => {
    console.log(`ConciergeSync Web running on port ${PORT}`);
  });
