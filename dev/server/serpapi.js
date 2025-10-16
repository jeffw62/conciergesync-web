// ==========================================================
// ConciergeSync™ SerpApi Integration Helper (Google Flights)
// ==========================================================
// Fetches indicative cash fares by route/date/class
// using SerpApi's Google Flights engine
// ==========================================================

const axios = require("axios");

async function fetchCashFare({ origin, destination, departDate, travelClass = 1 }) {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  Missing SERP_API_KEY");
    return null;
  }

  const params = {
    engine: "google_flights",
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departDate,
    travel_class: travelClass, // 1=Econ,2=PremEcon,3=Biz,4=First
    type: 2,                   // 2 = One-way (default for redemptions)
    currency: "USD",
    gl: "us",
    hl: "en",
    deep_search: true,          // ensures fresh live data, not cached
    api_key: apiKey,

    // Context token keeps each lookup unique in SerpApi logs
    context_token: `${origin}-${destination}-${departDate}-${travelClass}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  };

  try {
    console.log("🔗 SerpApi request:", JSON.stringify(params, null, 2));
    const response = await axios.get("https://serpapi.com/search.json", { params });
    console.log("🧭 SerpApi raw response keys:", Object.keys(response.data || {}));

    // ----------------------------------------------------------
    // Parse all possible SerpApi price shapes accurately
    // ----------------------------------------------------------
    let price = null;

    // 1. Try "best_flights" array first
    if (Array.isArray(response.data?.best_flights) && response.data.best_flights.length > 0) {
      price = response.data.best_flights[0]?.price || null;
    }

    // 2. If missing, check price_insights
    if (!price && response.data?.price_insights?.lowest_price) {
      price = response.data.price_insights.lowest_price;
    }

    // 3. As a fallback, check nested structures in "best_flights[0].flights"
    if (!price && Array.isArray(response.data?.best_flights?.[0]?.flights)) {
      const inner = response.data.best_flights[0].flights.find(f => f.price);
      if (inner) price = inner.price;
    }

    // 4. Final fallback — top-level price
    if (!price && typeof response.data?.price === "number") {
      price = response.data.price;
    }

    console.log("💰 Parsed SerpApi fare:", {
      origin,
      destination,
      departDate,
      travelClass,
      price,
    });

    if (!price) {
      console.log(`No price found for ${origin}-${destination} ${departDate}`);
      return null;
    }

    // Return the verified numeric price
    return parseFloat(String(price).replace(/[^\d.]/g, ""));

  } catch (err) {
    console.error("SerpApi fetch error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { fetchCashFare };
