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

// Fetch accounts for a connected Item
router.get("/accounts", async (req, res) => {
  try {
    const { item_id } = req.query;

    if (!item_id) {
      return res.status(400).json({ error: "missing_item_id" });
    }

    const access_token = globalThis.PLAID_ACCESS_TOKENS?.[item_id];

    if (!access_token) {
      return res.status(400).json({ error: "access_token_not_found" });
    }

    const response = await fetch("https://production.plaid.com/accounts/get", {
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

router.get("/transactions", async (req, res) => {
  try {
    const accessToken = req.headers["x-plaid-access-token"];

    if (!accessToken) {
      return res.status(400).json({ error: "missing_access_token" });
    }

    const response = await fetch("https://production.plaid.com/transactions/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token: accessToken,
        start_date: "2025-12-01",
        end_date: new Date().toISOString().split("T")[0]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "transactions_failed" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: "missing_dates",
        message: "start_date and end_date are required"
      });
    }

    const response = await fetch("https://production.plaid.com/transactions/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token: process.env.PLAID_ACCESS_TOKEN,
        start_date,
        end_date
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("❌ transactions error:", err);
    res.status(500).json({ error: "transactions_failed" });
  }
});

router.get("/debug/items", (req, res) => {
  res.json({
    stored_items: Object.keys(globalThis.PLAID_ACCESS_TOKENS || {})
  });
});

export default router;
