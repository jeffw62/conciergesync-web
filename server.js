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

  const { origin, destination, date, passengers, cabin } = req.body;

  try {
    const response = await fetch("https://seats.aero/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SEATSAERO_KEY}`  // <-- your API key in Render
      },
      body: JSON.stringify({
        origin,
        destination,
        date,
        passengers,
        cabin
      })
    });

    if (!response.ok) {
      throw new Error(`Seats.aero API error: ${response.status}`);
    }

    const results = await response.json();
    console.log("✅ Seats.aero response:", results);

    res.json({ success: true, results });

  } catch (err) {
    console.error("❌ Redemption API error:", err);
    res.status(500).json({ success: false, error: "Seats.aero request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
