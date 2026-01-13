import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import admin from "./firebase.js";

const router = express.Router();
const PLAID_BASE = "https://production.plaid.com";
const TOKENS_PATH = path.resolve("dev/server/plaid.tokens.json");

/* --------------------------------------------------
   Local token file helpers (dev-only)
-------------------------------------------------- */
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

/* --------------------------------------------------
   Create Plaid Link Token
-------------------------------------------------- */
router.get("/link-token", async (req, res) => {
   console.log("🧭 /exchange HIT");
   console.log("📦 RAW BODY:", req.body);
   console.log("👤 CS USER ID (server):", req.body?.cs_user_id);
   
  try {
    const response = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        client_name: "ConciergeSync",
        user: { client_user_id: "cs-session-user" },
        products: ["transactions"],
        country_codes: ["US"],
        language: "en"
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ LINK TOKEN FAILED:", err);
    res.status(500).json({ error: "link_token_failed" });
  }
});

console.log("🧭 ROUTE REGISTERED: /exchange");

/* --------------------------------------------------
   Exchange public_token → access_token
-------------------------------------------------- */
router.post("/exchange", async (req, res) => {
   const { public_token } = req.body;
     console.log("🚪 /exchange handler ENTERED");
     console.log("📦 RAW EXCHANGE REQUEST BODY:", req.body);

 // 🔒 TEMPORARY HARD-WIRED CS USER (REMOVE WHEN AUTH IS LIVE)
   const cs_user_id = "cs_e9e66863d68388548ba1";

  /* ----------------------------------------------
     HARD REQUIREMENT — USER CONTEXT
  ---------------------------------------------- */
  if (!cs_user_id) {
     console.warn("⚠️ cs_user_id missing — proceeding without user binding");
   }

  try {
    /* ------------------------------------------
       Exchange public token
    ------------------------------------------ */
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
   // Validate Plaid exchange
   // ==============================
   if (!data.item_id || !data.access_token) {
     return res.status(400).json({
       error: "invalid_exchange_response",
       data
     });
   }
   
   // ==============================
   // Firestore — baseline write (known-good)
   // ==============================
   const db = admin.firestore();
   
   await db.collection("plaid_items").doc(data.item_id).set({
      plaid_item_id: data.item_id,
      access_token: data.access_token,
      institution_id: req.body.institution?.institution_id || null,
      institution_name: req.body.institution?.name || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
   });
   
   console.log("🔥 PLAID ITEM WRITTEN TO FIRESTORE:", data.item_id);
   
   // ==============================
   // Respond success
   // ==============================
   res.json({
     ok: true,
     plaid_item_id: data.item_id
   });

  } catch (err) {
    console.error("❌ EXCHANGE FAILED:", err);
    res.status(500).json({ error: "exchange_failed" });
  }
});

/* --------------------------------------------------
   Get Accounts
-------------------------------------------------- */
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
    console.error("❌ ACCOUNTS FAILED:", err);
    res.status(500).json({ error: "accounts_failed" });
  }
});

export default router;
