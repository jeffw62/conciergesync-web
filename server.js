const express = require("express");
const path = require("path");
const app = express();
app.use(express.json()); // <-- add this so we can read JSON bodies
const PORT = process.env.PORT || 3000;

// Serve everything in repo (index.html, /dev, /assets, etc.)
app.use(express.static(path.join(__dirname)));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Redemption API route (mock response for now)
app.post("/api/redemption", (req, res) => {
  console.log("🔔 Redemption request received:", req.body);

  // Mock Seats.aero-style results
  const mockResults = [
    {
      airline: "American Airlines",
      flightNumber: "AA50",
      origin: req.body.origin,
      destination: req.body.destination,
      date: req.body.date,
      cabin: req.body.cabin,
      miles: 57500,
      taxes: 737
    },
    {
      airline: "British Airways",
      flightNumber: "BA192",
      origin: req.body.origin,
      destination: req.body.destination,
      date: req.body.date,
      cabin: req.body.cabin,
      miles: 60000,
      taxes: 850
    },
    {
      airline: "Lufthansa",
      flightNumber: "LH439",
      origin: req.body.origin,
      destination: req.body.destination,
      date: req.body.date,
      cabin: req.body.cabin,
      miles: 70000,
      taxes: 950
    }
  ];

  res.json({ success: true, results: mockResults });
});

app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
