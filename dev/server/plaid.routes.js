import express from "express";
import fetch from "node-fetch";
import { createLinkToken, exchangePublicToken } from "./plaid.js";

const router = express.Router();

// ==============================
// Plaid Routes (Isolated)
// ==============================

// Create Plaid Link token
router.get("/link-token", createLinkToken);

// Exchange public_token for access_token
router.post("/exchange", exchangePublicToken);

// Fetch accounts (read-only test)
router.get("/accounts", async (req, res) => {
  try {
    const response = await fetch("https://production.plaid.com/accounts/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token: process.env.PLAID_TEST_ACCESS_TOKEN
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
