// ===============================================
// ConciergeSync Web Service (Seats.Aero Integration)
// ===============================================
const express = require("express");
const path = require("path");
// SerpApi helper (fetches indicative cash fares)
const { fetchCashFare } = require("./dev/server/serpapi.js");

// ===========================================
// Simple in-memory cache for SerpApi results
// ===========================================
const serpCache = new Map();

// helper: builds a unique key
function serpKey(origin, destination, date, travelClass) {
  return `${origin}-${destination}-${date}-${travelClass}`;
}

console.log("SerpApi key detected:", !!process.env.SERP_API_KEY);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// ===============================================
// Seats.Aero Partner Service Class
// ===============================================
class SeatsAeroService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://seats.aero/partnerapi";
  }

  async searchFlights({ origin, destination, startDate, endDate, take = 40 }) {
    const url = `${this.baseUrl}/search?origin_airport=${origin}&destination_airport=${destination}&start_date=${startDate}&end_date=${endDate}&take=${take}&include_trips=false&only_direct_flights=false&include_filtered=false`;

    console.log("➡️  SA search request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.Aero error ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log(`➡️  SA returned ${data.data?.length || 0} records`);
    return data; // { data: [...] }
  }
}

const seatsService = new SeatsAeroService(process.env.SEATSAERO_KEY);

// ===============================================
// Utility Filter (Optional sanity pass)
// ===============================================
function applySanityFilter(results) {
  return results.filter(r => {
    const miles = parseInt(
      r.YMileageCost || r.JMileageCost || r.FMileageCost || 0,
      10
    );
    const fees = r.TotalTaxes ? r.TotalTaxes / 100 : 0;
    if (!miles || miles <= 0) return false;
    if (miles > 500000) return false;
    if (fees < 0) return false;
    return true;
  });
}

app.get("/api/test", (req, res) => {
  res.json({ ok: true, message: "✅ API test route working." });
});

// ===============================================
// Live Redemption Search Endpoint (dynamic window)
// ===============================================
app.post("/api/redemption", async (req, res) => {
  let outboundDateStr = null;
  try {
    if (!req.body) {
      console.warn("⚠️ No body received at /api/redemption");
      return res.status(400).json({
        error: "no_body",
        message: "No request body received.",
      });
    }

    console.log("🧭 Raw body before destructure:", req.body);
    const payload = req.body || {};
    console.log("🧭 Received redemption payload:", payload);
    
    // Define safe fallbacks for both frontends
    const origin = payload.origin || payload.from;
    const destination = payload.destination || payload.to;

    // Validate required inputs
    if (!origin || !destination) {
      return res.status(400).json({
        error: "missing_parameters",
        message: "Origin and destination are required.",
      });
    }
 
    // === Expand flexDays into individual search dates ===
    const baseDate = new Date(payload.departDate || payload.date);
    let range = parseInt(payload.flexDays) || 0;
    
    /// 🌍 Determine flex behavior based on button selection
    const searchMode = payload.flexMode || payload.mode;
    if (searchMode === "flexible") {
      range = parseInt(payload.flexDays) || 0; // allow dropdown value (1, 3, 5, etc.)
    } else {
      range = 0; // exact-date searches only
    }
        
    const dateList = [];
  
    for (let offset = -range; offset <= range; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      dateList.push(d.toISOString().split("T")[0]);
    }
  
    console.log("📅 Expanded searchDates:", dateList);
  
    // === Iterate over each date ===
    for (const travelDate of dateList) {
      console.log(`🔍 Searching ${payload.origin} → ${payload.destination} on ${travelDate}`);
      // Seats.Aero / SerpApi logic will go here later
    }
    
    // Use our expanded dateList directly (no need for searchDates variable)
    const datesToSearch = dateList.length > 0 ? dateList : [payload.departDate || payload.date];
    
    console.log("📅 Dates to search:", datesToSearch);


    let allResults = [];

    // === Simulate running redemption searches for each expanded date ===
    for (const travelDate of datesToSearch) {
      let outboundDateStr = null; // ✅ visible to entire loop
      console.log(`🧠 Running redemption search for ${payload.origin} → ${payload.destination} on ${travelDate}`);
      
      console.log("📅 datesToSearch array:", datesToSearch);
      console.log("🔁 Iterating travelDate:", travelDate, "type:", typeof travelDate);
      
      try {
        // Define travel class map before any usage
        const travelClassMap = { economy: 1, premium: 2, business: 3, first: 4 };
        const travelClass = travelClassMap[(payload.cabin || "economy").toLowerCase()] || 1;

        // --- Ensure outboundDateStr is defined properly ---
        
        if (!outboundDateStr || typeof outboundDateStr !== "string") {
          outboundDateStr =
            typeof travelDate === "string"
              ? travelDate
              : payload.departDate ||
                payload.date ||
                (Array.isArray(datesToSearch) && datesToSearch.length > 0
                  ? datesToSearch[0]
                  : new Date().toISOString().split("T")[0]);
        }
        
        // Convert to safe YYYY-MM-DD format (defensive)
        if (outboundDateStr instanceof Date) {
          outboundDateStr = new Date(travelDate).toISOString().split("T")[0];
        }

        console.log("🧭 travelDate raw:", travelDate);
        console.log("🧭 outboundDateStr computed:", outboundDateStr);
        
        const serpPayload = {
          engine: "google_flights",
          departure_id: payload.origin,
          arrival_id: payload.destination,
          outbound_date: outboundDateStr || payload.departDate || payload.date || new Date().toISOString().split("T")[0],
          return_date: payload.returnDate || null,
          travel_class: travelClass,
          type: 1,
          currency: "USD",
          gl: "us",
          hl: "en",
          deep_search: true,
          api_key: process.env.SERP_API_KEY,
          context_token: `${payload.origin}-${payload.destination}-${outboundDateStr}-${Math.random().toString(36).slice(2, 8)}`
        };

    
        console.log("🔗 SerpApi request:", JSON.stringify(serpPayload, null, 2));

        // 🧠 Running redemption search for ...
        let cashValue = null; // ✅ define once here
        
        // ⚙️ Verify outboundDateStr before calling fetch
        console.log("🟢 outboundDateStr check before fetch:", outboundDateStr);
        
        console.log("outboundDateStr before SerpApi payload:", outboundDateStr, "travelDate:", travelDate);
        console.log("🧭 outboundDateStr just before fetchCashFare =", outboundDateStr);

        // 🟢 Reactivated live SerpApi call for cash fare lookup
        try {
          cashValue = await fetchCashFare({
            origin: payload.origin,
            destination: payload.destination,
            departDate: outboundDateStr,
            outbound_date: outboundDateStr,
            travelClass,
          });
        
          if (cashValue?.error) {
            console.warn("⚠️ SerpApi returned error:", cashValue.error);
            cashValue = null;
          } else {
            console.log("💰 Live SerpApi fare fetched:", cashValue);
          }
        } catch (err) {
          console.error("❌ fetchCashFare() failed:", err);
          cashValue = null;
        }

        serpCache.set(`${payload.origin}-${payload.destination}-${travelDate}`, cashValue);
        console.log(`💵 Cached SerpApi value for ${travelDate}:`, cashValue);
    
      } catch (err) {
        console.error("❌ SerpApi fetch error:", err);
      }
    }
    
    // Temporary placeholder response
    //res.status(200).json({
    //  ok: true,
    //  message: "🧭 Redemption route completed successfully (placeholder response).",
    //  searchDates: datesToSearch
    //});

     const travelClassMap = {
        economy: 1,
        premium: 2,
        business: 3,
        first: 4,
      };
      const travelClass =
        travelClassMap[(payload.cabin || "economy").toLowerCase()] || 1;
      
      const cacheKey = serpKey(payload.origin, payload.destination, payload.date, travelClass);
      
      let cashValue = null; // ✅ Define it once above everything

      if (serpCache.has(cacheKey)) {
        cashValue = serpCache.get(cacheKey);
        console.log(`♻️ Using cached SerpApi value for ${cacheKey}:`, cashValue);
      } else {
        try {
          // --- Build SerpApi payload ---
          const serpPayload = {
            engine: "google_flights",
            departure_id: payload.origin,
            arrival_id: payload.destination,
            outbound_date: outboundDateStr,
            return_date: payload.returnDate || null,
            travel_class: travelClass,
            type: 1, // ✅ keep only type 1
            currency: "USD",
            gl: "us",
            hl: "en",
            deep_search: false, // ✅ or remove this line entirely
            api_key: process.env.SERP_API_KEY,
            context_token: `${payload.origin}-${payload.destination}-${outboundDateStr}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
          };
          console.log("🔗 SerpApi request:", JSON.stringify(serpPayload, null, 2));

          if (payload.date || outboundDateStr) {
          cashValue = await fetchCashFare({
            origin: payload.origin,
            destination: payload.destination,
            departDate: outboundDateStr,
            outbound_date: outboundDateStr,
            travelClass,
          });
        
          // 🧩 Optional safety check
          if (cashValue?.error) {
            console.warn("⚠️ SerpApi returned:", cashValue.error);
            cashValue = null;
          }
        } else {
          console.warn("⚠️ Skipping extra SerpApi call — no outbound_date available");
        }

          serpCache.set(cacheKey, cashValue);
          console.log(`💵 Cached new SerpApi value for ${cacheKey}:`, cashValue);
        } catch (err) {
          console.error("❌ Redemption search error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              error: "server_error",
              message: err.message
            });
          }
        }
    }

        //console.log("🚀 Final results payload:", JSON.stringify(allResults, null, 2));
        // Temporary placeholder response until full CPM enrichment is reactivated
        //return res.json({
        //  success: true,
        //  message: "Search complete (placeholder response)",
        //});

        // determine search window based on mode (exact vs flexible)
        const flexDays = parseInt(payload.flexDays || 0, 10);
        const mode = payload.mode || "exact";
        const windowDays = mode === "flex" ? flexDays : 0;
    
        const base = new Date((payload.departDate || payload.date) + "T00:00:00");
        const start = new Date(base);
        start.setDate(start.getDate() - windowDays);
        const end = new Date(base);
        end.setDate(end.getDate() + windowDays);
    
        const toDateStr = d =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;
    
        const results = [];
        let day = new Date(start);
    
        console.log(
          `📅 Mode: ${mode.toUpperCase()} | Window: ${windowDays} days | Range: ${toDateStr(
            start
          )} → ${toDateStr(end)}`
        );
    
        // loop daily if flex mode, single call if exact
        while (day <= end) {
          const dateStr = toDateStr(day);
          console.log(`🔍 Fetching ${dateStr}`);
          try {
            const resp = await seatsService.searchFlights({
              origin: payload.origin,
              destination: payload.destination,
              startDate: dateStr,
              endDate: dateStr,
              take: 40,
            });
            if (resp?.data?.length) results.push(...resp.data);
          } catch (innerErr) {
            console.warn(`⚠️  Failed on ${dateStr}:`, innerErr.message);
          }
          if (mode === "exact") break; // stop after one iteration
          day.setDate(day.getDate() + 1);
        }
    
        console.log(`🧩 Combined ${results.length} results total`);
    
        // (optional) sanity filter before returning
        const filtered = applySanityFilter(results);
    
        // --- Cabin filter and normalization ---
        const cabin = (payload.cabin || "Economy").toLowerCase();
        
        const cabinFieldMap = {
          economy: "YMileageCost",
          premium: "PMileageCost",
          business: "JMileageCost",
          first: "FMileageCost",
        };
        
        // Determine which field to read for miles
        const cabinField = cabinFieldMap[cabin] || "YMileageCost";
        
        // Replace generic MilesNeeded with cabin-specific value
        const cabinAdjusted = filtered.map(r => {
          const miles = r[cabinField] || r.YMileageCost || 0;
          return { ...r, MilesNeeded: miles };
        });

    
        // Attach indicative cash value from serpCache for each record individually
        const withCashValues = cabinAdjusted.map(r => {
          const key = serpKey(
            r.OriginAirportCode || payload.origin,
            r.DestinationAirportCode || payload.destination,
            r.DepartureDate || payload.date,
            travelClass
          );
          const cachedFare = serpCache.get(key);
          return {
            ...r,
            cashValue: cachedFare || cashValue || null,
          };
        });

    
        // Compute CPM (cents per mile)
        const withCpm = withCashValues.map(r => {
          const miles = r.MilesNeeded || 0;
          const fees = parseFloat(r.TaxesAndFeesUSD || 0);
          const cash = parseFloat(r.cashValue || 0);
          const cpm = miles > 0 && cash > 0 ? ((cash - fees) / miles) * 100 : null;
          return { ...r, CPM: cpm };
        });
    
        // --- Filter by selected program if provided ---
        const selectedProgram = (payload.program || "").toLowerCase();
        const finalResults = selectedProgram
          ? withCpm.filter(r => r.Source?.toLowerCase() === selectedProgram)
          : withCpm;
        
        allResults.push(...finalResults);
        
        // ✅ Respond back once all loops complete
        console.log(`✅ Aggregated ${allResults.length} total results across ${datesToSearch.length} days.`);
        
        // prevent double-send
        if (res.headersSent) {
          console.warn("⚠️ Response already sent — skipping duplicate send.");
          return;
        }

        return res.json({
          success: true,
          results: allResults,
        });
        
    // ----------------------------------------------
    // Attach cashValue and compute CPM for each result
    // ----------------------------------------------
    const enrichedResults =
    (globalThis.finalResults && Array.isArray(globalThis.finalResults))
      ? globalThis.finalResults.map(r => {
          const miles = r.MilesNeeded || 0;
          const fees = parseFloat(r.TaxesAndFeesUSD || 0);
          const cash = parseFloat(cashValue || 0);
          const cpm = miles > 0 && cash > 0 ? ((cash - fees) / miles) * 100 : null;
          return { ...r, cashValue, CPM: cpm };
        })
      : [];

    // ✅ Normalize cashValue and CPM fields for all records before sending
    enrichedResults.forEach(r => {
      if (r.cashValue == null || r.cashValue === undefined) r.cashValue = cashValue || 0;
      if (r.CPM == null || r.CPM === undefined) {
        const miles = r.MilesNeeded || 0;
        const fees = parseFloat(r.TaxesAndFeesUSD || 0);
        const cash = parseFloat(r.cashValue || 0);
        r.CPM = miles > 0 && cash > 0 ? ((cash - fees) / miles) * 100 : null;
      }
    });

    console.log("📊 Enriched sample record (post-normalization):", enrichedResults[0]);

    // ----------------------------------------------
    // Attach live cash fare and CPM to each result
    // ----------------------------------------------
    for (const r of (globalThis.finalResults || [])) {
      const travelClassMap = { economy: 1, premium: 2, business: 3, first: 4 };
      const travelClass =
        travelClassMap[(r.cabin || "economy").toLowerCase()] || 1;
    
      const key = serpKey(
        r.origin || payload.origin,
        r.destination || payload.destination,
        r.date || payload.date,
        `${travelClass}-${r.program || payload.program || "default"}`
      );
    
      // Reuse cache first
      let cashValue = serpCache.get(key);
      if (!cashValue) {
//        try {
//          cashValue = await fetchCashFare({
//            origin: r.origin || payload.origin,
//            destination: r.destination || payload.destination,
//            departDate: r.date || payload.date,
//            travelClass,
//            program: r.program || payload.program || null
//          });
//          serpCache.set(key, cashValue);
//          console.log(`💵 Cached SerpApi fare for ${key}:`, cashValue);
//        } catch (err) {
//          console.warn("⚠️ SerpApi fetch failed in fusion loop:", err.message);
//        }
      }
    
      const miles = r.MilesNeeded || 0;
      const fees = parseFloat(r.TaxesAndFeesUSD || 0);
      const cash = parseFloat(cashValue || 0);
      const cpm = miles > 0 && cash > 0 ? ((cash - fees) / miles) * 100 : null;
    
      r.cashValue = cashValue;
      r.CPM = cpm;
    }

    console.log("📊 Enriched sample record:", enrichedResults[0]);
    
//    res.status(200).json({
//      sessionId: Date.now(),
//     results: finalResults,
//  });

    console.log("🧩 Debug checkpoint reached — preparing to respond to client...");

     } catch (err) {
        console.error("❌ Redemption route error:", err);
        res.status(500).json({
      error: "server_error",
      message: err.message
    });
  }
});

// ===============================================
// Bulk Test Route (optional diagnostic)
// ===============================================
app.get("/api/redemption/testBulk", async (req, res) => {
  try {
    const url = `${seatsService.baseUrl}/bulk-availability?sources=aeroplan&region=NorthAmerica-Europe&month=2025-10`;
    console.log("📦 SA Bulk request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": seatsService.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Seats.Aero error ${response.status}: ${text}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("❌ testBulk route error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =====================================================
// Dynamic SerpApi test route
// Usage: /api/test-serp?origin=JFK&destination=LAX&date=2025-11-05
// =====================================================
app.get("/api/test-serp", async (req, res) => {
  try {
    const origin = (req.query.origin || "DFW").toUpperCase();
    const destination = (req.query.destination || "LHR").toUpperCase();
    const departDate = req.query.date || "2025-12-01";

    console.log(`🧭 Test SerpApi lookup: ${origin} → ${destination} (${departDate})`);

    const outboundDateStr = departDate || new Date().toISOString().split("T")[0];
    
    const result = await fetchCashFare({
      origin,
      destination,
      departDate: outboundDateStr,   // ✅ for our own function
      outbound_date: outboundDateStr, // ✅ for SerpApi compatibility
    });

    res.json({ origin, destination, departDate, cashValue: result });
  } catch (err) {
    console.error("❌ Test /api/test-serp error:", err);
    res.status(500).json({ error: err.message });
  }
});
// =====================================================
// Fusion Test Route (browser friendly)
// Simulates a redemption call and returns CPM output
// =====================================================
app.get("/api/test-fusion", async (req, res) => {
  try {
    const origin = (req.query.origin || "JFK").toUpperCase();
    const destination = (req.query.destination || "LAX").toUpperCase();
    const departDate = req.query.date || "2025-11-05";
    const cabin = (req.query.cabin || "business").toLowerCase();

    // Map cabin to SerpApi travel_class
    const travelClassMap = { economy: 1, premium: 2, business: 3, first: 4 };
    const travelClass = travelClassMap[cabin] || 1;

    // get cash baseline
    const cashValue = await fetchCashFare({
      origin,
      destination,
      departDate: outboundDateStr,
      outbound_date: outboundDateStr,
      travelClass
    });

    // mock example Seats.Aero award data
    const award = {
      origin,
      destination,
      date: departDate,
      MilesNeeded: 57000,
      TaxesAndFeesUSD: 87.6,
      cabin
    };

    // compute CPM
    const miles = award.MilesNeeded || 0;
    const fees = parseFloat(award.TaxesAndFeesUSD || 0);
    const cash = parseFloat(cashValue || 0);
    const cpm = miles > 0 && cash > 0 ? ((cash - fees) / miles) * 100 : null;

    res.json({
      origin,
      destination,
      cabin,
      cashValue,
      award,
      CPM: cpm
    });

  } catch (err) {
    console.error("❌ Fusion test error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================================
// Static File Handling (must come after all APIs)
// ===============================================
app.use("/dev", express.static(path.join(__dirname, "dev")));

// ===============================================
// Start Server
// ===============================================
app.listen(PORT, () => {
  console.log(`ConciergeSync Web running on port ${PORT}`);
});
