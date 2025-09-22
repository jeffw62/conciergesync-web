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

// Redemption API route (live Seats.Aero)
app.post("/api/redemption", async (req, res) => {
  console.log("🔔 Redemption request received:", req.body);

  const { origin, destination } = req.body; // for now keep it simple

  try {
    const url = `https://seats.aero/partnerapi/routes?origin=${origin}&destination=${destination}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Partner-Authorization": process.env.SEATSAERO_KEY
      }
    });

    console.log("📡 Seats.aero status:", response.status);

    const results = await response.json();
    console.log("✅ Seats.aero response JSON:", results);

    res.json({ success: true, results });

  } catch (err) {
    console.error("❌ Redemption API error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
