import fetch from "node-fetch"; 

const PLAID_BASE = "https://production.plaid.com";

export async function createLinkToken(req, res) {
  try {
    const response = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        client_name: "ConciergeSync",
        user: {
          client_user_id: "internal-test-user"
        },
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
        redirect_uri: "https://conciergesync.ai/plaid-redirect"
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "link_token_failed" });
  }
}

export async function exchangePublicToken(req, res) {
  const { public_token } = req.body;

  try {
    const response = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        public_token
      })
    });

    const data = await response.json();

    // TEMP: log only, do not store yet
    console.log("ACCESS TOKEN:", data.access_token);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "exchange_failed" });
  }
}
