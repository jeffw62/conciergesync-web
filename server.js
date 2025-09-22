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

// Redemption API route (echo for now)
app.post("/api/redemption", (req, res) => {
  console.log("🔔 Redemption request received:", req.body);
  res.json({
    success: true,
    received: req.body
  });
});

app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
