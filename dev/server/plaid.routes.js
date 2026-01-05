import express from "express";
import { createLinkToken, exchangePublicToken } from "./plaid.js";

const router = express.Router();

// ==============================
// Plaid Routes (Isolated)
// ==============================

// Create Plaid Link token
router.get("/link-token", createLinkToken);

// Exchange public_token for access_token
router.post("/exchange", exchangePublicToken);

export default router;
