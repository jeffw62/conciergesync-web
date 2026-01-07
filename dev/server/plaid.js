import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const PLAID_BASE = "https://production.plaid.com";
const TOKENS_PATH = path.resolve("./dev/server/plaid.tokens.json");

/* -----------------------------
   Helpers
--------------------------------*/

function readTokens() {
  if (!fs.existsSync(TOKENS_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
}

function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

/* -----------------------------
   Create Link Token
--------------------------------*/

export async function createLinkToken(req, res) {
  try {
    const response = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        client_name: "ConciergeSync",
        user: { client_user_id: "internal-test-user" },
        products: ["transactions"],
        country_codes: ["US"],
        language: "en"
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "link_token_failed" });
  }
}

/* -----------------------------
   Exchange Public Token
--------------------------------*/

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

   // ================================
   // Persist Plaid access token to disk
   // ================================
   
   const TOKENS_PATH = path.resolve("dev/server/plaid.tokens.json");
   
   // Load existing tokens
   let tokens = {};
   try {
     const file = fs.readFileSync(TOKENS_PATH, "utf8");
     tokens = JSON.parse(file || "{}");
   } catch (err) {
     console.log("No existing token file, creating new one");
   }
   
   // Store token by item_id
   tokens[data.item_id] = data.access_token;
   
   // Write back to disk
   fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
   
   console.log("PLAID ACCESS TOKEN WRITTEN TO FILE");
   console.log("Item ID:", data.item_id);

    res.json({ ok: true, item_id: data.item_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "exchange_failed" });
  }
}

/* -----------------------------
   Get Accounts (latest item)
--------------------------------*/

export async function getAccounts(req, res) {
  try {
    const tokens = readTokens();
    const itemIds = Object.keys(tokens);

    if (itemIds.length === 0) {
      return res.status(400).json({ error: "no_access_tokens" });
    }

    const itemId = itemIds[itemIds.length - 1];
    const access_token = tokens[itemId];

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
    console.error(err);
    res.status(500).json({ error: "accounts_failed" });
  }
}
