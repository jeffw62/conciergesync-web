import fetch from "node-fetch";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const PLAID_BASE = "https://production.plaid.com";
const TOKENS_PATH = path.join(process.cwd(), "dev/server/plaid.tokens.json");

// ==============================
// Create Plaid Link Token
// ==============================
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

// ==============================
// Exchange Public Token → Access Token
// ==============================
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

    // Firestore write — canonical persistence
    const db = admin.firestore();
    
    await db.collection("plaid_items").doc(data.item_id).set({
      access_token: data.access_token,
      institution: data.institution_id || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("🔥 PLAID TOKEN STORED IN FIRESTORE");
    console.log("Item ID:", data.item_id);

    let tokens = {};
    try {
      tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    } catch {}

    tokens[data.item_id] = data.access_token;
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));

    console.log("PLAID ACCESS TOKEN WRITTEN TO FILE");
    console.log("Item ID:", data.item_id);

    res.json({ ok: true, item_id: data.item_id });
  } catch (err) {
    console.error("🔥 FIRESTORE WRITE ERROR:");
    console.error(err);
    console.error("message:", err?.message);
    console.error("code:", err?.code);
    console.error("stack:", err?.stack);
  
    res.status(500).json({
      error: "firestore_write_failed",
      message: err?.message || null,
      code: err?.code || null
    });
  }
}

// ==============================
// Fetch Accounts for Item
// ==============================
export async function getAccounts(req, res) {
  try {
    const { item_id } = req.query;
    if (!item_id) {
      return res.status(400).json({ error: "missing_item_id" });
    }

    const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    const access_token = tokens[item_id];

    if (!access_token) {
      return res.status(400).json({ error: "access_token_not_found" });
    }

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
export async function firestoreTest(req, res) {
  try {
    await db.collection("plaid_items").add({
      test_from_server: true,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "firestore_write_failed" });
  }
}
