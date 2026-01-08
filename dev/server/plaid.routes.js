import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { createLinkToken, exchangePublicToken, firestoreTest } from "./plaid.js";
import admin from "./firebase.js";

const router = express.Router();
const PLAID_BASE = "https://production.plaid.com";
const TOKENS_PATH = path.resolve("dev/server/plaid.tokens.json");

// 🔍 DEBUG — list stored Plaid items from Firestore
router.get("/firestore-items", async (req, res) => {
  try {
    const admin = (await import("firebase-admin")).default;
    const db = admin.firestore();

    const snap = await db.collection("plaid_items").get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ count: items.length, items });
  } catch (err) {
    console.error("❌ FIRESTORE READ FAILED:", err);
    res.status(500).json({ error: "firestore_read_failed" });
  }
});

// --------------------------------
// Ensure token file exists
// --------------------------------
function loadTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

router.get("/firestore-test", firestoreTest);

// --------------------------------
// Create Link Token
// --------------------------------
router.get("/link-token", async (req, res) => {
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
});

console.log("🧭 ROUTE REGISTERED: /exchange");
// --------------------------------
// Exchange public_token → access_token
// --------------------------------
router.post("/exchange", async (req, res) => {
  console.log("🚪 /exchange handler ENTERED");
  console.log("📦 RAW EXCHANGE REQUEST BODY:", req.body);
  
  const { public_token, institution } = req.body;
  console.log("🏦 INSTITUTION FROM CLIENT:", institution);

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

    // ==============================
    // Resolve institution via Plaid (server-truth)
    // ==============================
    let institution_id = null;
    let institution_name = null;
    
    try {
      const itemResp = await fetch(`${PLAID_BASE}/item/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.PLAID_CLIENT_ID,
          secret: process.env.PLAID_SECRET,
          access_token: data.access_token
        })
      });
    
      const itemData = await itemResp.json();
      institution_id = itemData?.item?.institution_id || null;
    
      if (institution_id) {
        const instResp = await fetch(`${PLAID_BASE}/institutions/get_by_id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: process.env.PLAID_CLIENT_ID,
            secret: process.env.PLAID_SECRET,
            institution_id,
            country_codes: ["US"]
          })
        });
    
        const instData = await instResp.json();
        institution_name = instData?.institution?.name || null;
      }
    
      console.log("🏦 INSTITUTION (server):", institution_id, institution_name);
    } catch (err) {
      console.error("❌ INSTITUTION RESOLUTION FAILED:", err);
    }

    if (!data.item_id || !data.access_token) {
      return res.status(400).json({ error: "invalid_exchange_response", data });
    }

    const tokens = loadTokens();
    tokens[data.item_id] = data.access_token;
    saveTokens(tokens);

    console.log("PLAID ACCESS TOKEN WRITTEN TO FILE");
    console.log("Item ID:", data.item_id);
    
    // 🔌 WIRING STEP — Firestore persistence
    try {
      const db = admin.firestore();
    
      await db.collection("plaid_items").doc(data.item_id).set({
        plaid_item_id: data.item_id,
        access_token: data.access_token,
      
        institution_id: institution?.institution_id || null,
        institution_name: institution?.name || null,
      
        linked_at: admin.firestore.FieldValue.serverTimestamp(),
        status: "active"
      });
    
      console.log("🔥 PLAID TOKEN WRITTEN TO FIRESTORE");
      console.log("Item ID:", data.item_id);
    } catch (err) {
      console.error("❌ FIRESTORE TOKEN WRITE FAILED:", err);
    }
    
    res.json({ ok: true, item_id: data.item_id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "exchange_failed" });
  }
});

// --------------------------------
// Get Accounts for Item
// --------------------------------
router.get("/accounts", async (req, res) => {
  const { item_id } = req.query;

  if (!item_id) {
    return res.status(400).json({ error: "missing_item_id" });
  }

  const tokens = loadTokens();
  const access_token = tokens[item_id];

  if (!access_token) {
    return res.status(400).json({ error: "access_token_not_found" });
  }

  try {
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
});

export default router;
