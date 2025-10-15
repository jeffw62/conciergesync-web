// ==========================================================
// ConciergeSync™ SerpApi Integration Helper (CommonJS)
// ==========================================================
// Purpose: Fetch indicative cash fares for redemption routes
// using the secure SERP_API_KEY stored in Render's environment.
// ==========================================================

const axios = require("axios");

async function fetchCashFare({ origin, destination, departDate }) {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  Missing SERP_API_KEY in environment");
    return null;
  }

  const params = {
    engine: "google_flights",
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departDate,
    currency: "USD",
    api_key: apiKey,
  };

  try {
    console.log("🔗 SerpApi request params:", JSON.stringify(params, null, 2));
    const response = await axios.get("https://serpapi.com/search.json", { params });
    // Try both shapes (depends on route richness)
    const priceRaw =
      response.data?.best_flight?.price ||
      response.data?.best_flights?.[0]?.price;

    if (!priceRaw) {
      console.log(`No fare returned for ${origin}-${destination} ${departDate}`);
      return null;
    }

    const price = parseFloat(String(priceRaw).replace(/[^\d.]/g, ""));
    return isFinite(price) ? price : null;
  } catch (err) {
    console.error("SerpApi fetch error:", err.message);
    return null;
  }
}

module.exports = { fetchCashFare };
