// dev/server/duffel.js
import fetch from "node-fetch";

export async function testDuffelSearch(req, res) {
  try {
    const response = await fetch("https://api.duffel.com/air/offer_requests", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DUFFEL_API_KEY}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: {
          slices: [
            { origin: "DFW", destination: "LHR", departure_date: "2025-12-05" }
          ],
          passengers: [{ type: "adult" }],
          cabin_class: "business"
        }
      })
    });

    const data = await response.json();
    console.log("Duffel Test Search →", data);
    res.status(200).json(data);
  } catch (err) {
    console.error("Duffel API error:", err);
    res.status(500).json({ error: err.message });
  }
}
