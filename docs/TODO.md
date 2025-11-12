# ConciergeSync™ — Active TODO Framework

_Last updated: November 11, 2025_

---

## 🧭 System Snapshot

**Environment:**  
Live on Render (Port 10000 confirmed)

**APIs:**  
✅ Seats.aero — OK and integrated via `/dev/server/partners.js`  
✅ Duffel — OK, returning live offer data  
✅ SerpApi — OK, cash-fare sync verified  
⚙️ Plaid — Approved, currently stubbed (awaiting live card linking)

**Repository:**  
GitHub live and ready — Homer Aguas < homer.aguas@gmail.com > to be added as collaborator  
Server structure: `/dev/server/` contains `partners.js` unified bridge + individual modules

---

## 🧹 Repository Cleanup — Pending Tasks

| Task | Status | Notes |
|------|:------:|------|
| Move inline `// TODO:` notes into `/docs/TODO.md` | ⏳ | Centralizes task tracking |
| Remove unused or legacy files (`old-*`, `/test/`) | ⏳ | Confirm before deletion |
| Review `/assets/` for large or unused media | ⏳ | Archive if uncertain |
| Standardize naming conventions (`redem-con.js`, etc.) | ⏳ | Maintain clarity |
| Add `.env.example` for environment variables | ⏳ | Document required API keys |
| Confirm `/docs/TODO.md` reflects latest milestone | ✅ | Phase 2 baseline complete |


## 🧱 Current Core Tasks — Week of Nov 11 → Nov 18  2025

| Status | Task | Owner | Notes |
|:------:|:-----|:------|:------|
| ✅ | Convert partners into unified export hub (`partners.js`) | Jeff | Completed and verified live |
| 🔄 | Wire Plaid live token exchange & balance pull | Jeff / Homer | Awaiting Plaid keys + sandbox test |
| 🧠 | Add IATA groupings for US/CA gateways + dynamic autocomplete | Jeff | Autocomplete JS pending data map |
| 🎛️ | Enable flex-days dropdown + budget-airline toggle + auto-toggles (form) | Jeff | JS logic partially implemented |
| 🧾 | Create `/docs/TODO.md` (this file) | Jeff | ✅ Complete |
| 🧩 | Migrate existing inline task notes into structured GitHub Issues | Homer / Jeff | Next → after branch setup |
| ✅ | Merge Plaid integration stub into dev | Jeff | First feature branch successfully merged via PR #1 |

---

## 🧩 Module Notes

### Server / API Layer
- `partners.js` now serves as the unified export hub for all partner APIs.  
- Need to modularize Plaid connector into its own `/modules/plaid.js` with async error handling.  
- Confirm concurrency limits and logging within Render environment.

### Front-End / Console
- Search form validation logic live and stable.  
- Next: add flex-day selector + budget toggle + auto-toggle interlocks.  
- Continue verifying workspace injection (`workspace.replaceChildren` flow).

### Integrations
- **Plaid** → awaiting token exchange & balance pull.  
- **Seats.aero** → successfully returns award-availability payloads.  
- **Duffel** → returns cash offers.  
- **SerpApi** → live for cash-fare comparison.

### Infrastructure / Render
- Live deployment confirmed on port 10000.  
- Add environment variable placeholders for Plaid & future APIs.  
- Next: enable GitHub branch auto-deploy from `main` only (dev manual).

---

## 👨‍💻 For Homer (Aguas) — Tech Advisor Onboarding

1. **Review current repo structure** and comment inline on `/dev/server/`.  
2. **Establish branch discipline** — use `feature/*` branches; PRs to `dev`; merges → `main`.  
3. **Help define Project Board** (JIRA or GitHub Projects).  
4. **Set up test framework** + modularization guidelines.  
5. Confirm architecture meets scalability standards: async control, error handling, and API concurrency.

---

## 📅 Next Milestones (2-Week Window)

| Target Date | Milestone | Owner |
|:------------:|:----------|:------|
| Nov 15 | Plaid sandbox token exchange live → return balances | Jeff |
| Nov 18 | Add Homer as collaborator + establish branch structure | Jeff / Homer |
| Nov 20 | Create JIRA board or GitHub Project for task tracking | Homer |
| Nov 25 | Deploy first Plaid live balance pull to Render | Jeff / Homer |

---

## 🪜 Backlog / Future Ideas
- 🔍 Integrate Iscan™ session logic for visual scanning consent modal.  
- 🌍 Add global airport JSON map for autocomplete + route discovery.  
- 📊 Begin Wallet Console build (credit-card aggregation module).  
- 🧩 Develop Seats.aero + cash-fare fusion comparison view.  
- ⚙️ Add auto-reporting for Render errors to Slack or Discord hook.  

---

**Document Steward:** Jeff Wynn  
**Technical Advisor:** Homer Aguas  
