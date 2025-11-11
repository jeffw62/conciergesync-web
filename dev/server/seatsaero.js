// dev/server/seatsaero.js
import fetch from "node-fetch";

// === Seats.Aero Partner Service Class ===
export class SeatsAeroService {
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
    return data;
  }
}

// === Optional sanity filter ===
export function applySanityFilter(results) {
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
