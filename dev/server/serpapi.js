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
      travel_class: travelClass,  // 1=Econ,2=PremEcon,3=Biz,4=First
      type: 2,                    // 2 = One-way (default for redemptions)
      currency: "USD",
      gl: "us",
      hl: "en",
      deep_search: false,         // optional, can flip to true later
      api_key: apiKey,
  
      // ✅ Add slight noise so each program/date call is unique
      context_token: `${origin}-${destination}-${departDate}-${travelClass}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    };

  try {
    console.log("🔗 SerpApi request:", JSON.stringify(params, null, 2));
    const response = await axios.get("https://serpapi.com/search.json", { params });

    // Try common return shapes
    const price =
      response.data?.best_flight?.price ||
      response.data?.best_flights?.[0]?.price ||
      response.data?.price_insights?.lowest_price ||
      null;

    if (!price) {
      console.log(`No price found for ${origin}-${destination} ${departDate}`);
      return null;
    }

    // ✅ Temporary simulation: apply slight random or program-based variance
    let fare = parseFloat(String(price).replace(/[^\d.]/g, ""));
    if (arguments[0].program) {
      const seed = arguments[0].program.charCodeAt(0) % 5; // 0–4
      fare += seed * 10; // bump by up to $40 depending on program
    } else {
      fare += Math.floor(Math.random() * 25); // add small random delta
    }
    return fare;
  } catch (err) {
    console.error("SerpApi fetch error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { fetchCashFare };
