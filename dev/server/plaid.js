import fetch from "node-fetch";

const PLAID_BASE = "https://production.plaid.com";

/**
 * 1) Create a Plaid Link token
 */
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
        language: "en"
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Link token error:", err);
    res.status(500).json({ error: "link_token_failed" });
  }
}

/**
 * 2) Exchange public_token → access_token
 *    Store in memory (DEV ONLY)
 */
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

    // Initialize memory store if needed
    globalThis.PLAID_ACCESS_TOKENS = globalThis.PLAID_ACCESS_TOKENS || {};

    // Store by item_id
    globalThis.PLAID_ACCESS_TOKENS[data.item_id] = data.access_token;

    console.log("PLAID ACCESS TOKEN STORED");
    console.log("Item ID:", data.item_id);

    res.json({ ok: true, item_id: data.item_id });
  } catch (err) {
    console.error("Public token exchange error:", err);
    res.status(500).json({ error: "exchange_failed" });
  }
}

/**
 * 3) Fetch accounts using most recent access token
 */
export async function getAccounts(req, res) {
  try {
    const tokens = globalThis.PLAID_ACCESS_TOKENS || {};
    const itemIds = Object.keys(tokens);

    if (itemIds.length === 0) {
      return res.status(400).json({ error: "no_access_tokens" });
    }

    // Use most recently stored item
    const latestItemId = itemIds[itemIds.length - 1];
    const access_token = tokens[latestItemId];

    const response = await fetch(`${PLAID_BASE}/accounts/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Accounts fetch error:", err);
    res.status(500).json({ error: "accounts_failed" });
  }
}
