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
    const baseDate = new Date(payload.date);
    const range = parseInt(payload.flexDays) || 0;
    const dateList = [];
  
    for (let offset = -range; offset <= range; offset++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + offset);
      dateList.push(d.toISOString().split("T")[0]);
    }
  
    console.log("📅 Expanded searchDates:", dateList);
  
    // === Iterate over each date ===
    for (const travelDate of dateList) {
      console.log(`🔍 Searching ${origin} → ${destination} on ${travelDate}`);
      // Seats.Aero / SerpApi logic will go here later
    }

    const datesToSearch =
      Array.isArray(searchDates) && searchDates.length > 0
        ? searchDates
        : [payload.date || new Date().toISOString().split("T")[0]];

    console.log("📅 Dates to search:", datesToSearch);

    let allResults = [];

    // This loop replaces the single-day search
    for (const date of datesToSearch) {
      console.log(`🔍 Running redemption search for ${origin} → ${destination} on ${date}`);

      // Create a shallow copy of payload for this date
      const singleSearch = { ...rest, origin, destination, date };

     let cashValue = null;
      const travelClassMap = {
        economy: 1,
        premium: 2,
        business: 3,
        first: 4,
      };
      const travelClass =
        travelClassMap[(payload.cabin || "economy").toLowerCase()] || 1;
      
      const cacheKey = serpKey(payload.origin, payload.destination, payload.date, travelClass);
      
      if (serpCache.has(cacheKey)) {
        cashValue = serpCache.get(cacheKey);
        console.log(`♻️ Using cached SerpApi value for ${cacheKey}:`, cashValue);
      } else {
        try {
          cashValue = await fetchCashFare({
            origin: payload.origin,
            destination: payload.destination,
            departDate: payload.date,
            travelClass,
          });
          serpCache.set(cacheKey, cashValue);
          console.log(`💵 Cached new SerpApi value for ${cacheKey}:`, cashValue);
        } catch (err) {
          console.warn("⚠️ SerpApi call failed:", err.message);
        }
      }

        console.log("✅ Redemption route completed. Returning response...");

        // Temporary placeholder response until full CPM enrichment is reactivated
        return res.json({
          success: true,
          message: "Search complete (placeholder response)",
        });

        // determine search window based on mode (exact vs flexible)
        const flexDays = parseInt(payload.flexDays || 0, 10);
        const mode = payload.mode || "exact";
        const windowDays = mode === "flex" ? flexDays : 0;
    
        const base = new Date(payload.date + "T00:00:00");
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
    
        // Attach indicative cash value to each record
        const withCashValues = cabinAdjusted.map(r => ({
          ...r,
          cashValue: cashValue,
        }));
    
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
      }

      console.log(`✅ Aggregated ${allResults.length} total results across ${datesToSearch.length} days.`);
      // Send the combined results back
      return res.json({ success: true, results: allResults });

      } catch (err) {
          console.error("❌ Redemption search error:", err);
          res.status(500).json({ error: "internal_error", message: err.message });
      }
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

    // catch (err) {
    //  console.error("❌ Redemption API error:", err);
    //  res.status(500).json({
    //    error: "server_error",
    //    message: err.message,
    //    stack: err.stack,
    //    });
    //  }
    // });

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

    console.log(`🔍 Test SerpApi lookup: ${origin} → ${destination} (${departDate})`);

    const result = await fetchCashFare({ origin, destination, departDate });

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
    const cashValue = await fetchCashFare({ origin, destination, departDate, travelClass });

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


