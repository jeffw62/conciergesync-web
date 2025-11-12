# 🧭 ConciergeSync™ Web — Repository Overview

**Purpose**  
This repository contains the **live ConciergeSync™ console and web experience** — including all front-end modules, server logic, partner API integrations, and internal documentation.  
All code here is production-bound and deployed via **Render**.

---

## 📁 Folder Structure Overview

| Path | Purpose |
|------|----------|
| `/dev/` | Core development environment for all active modules |
| `/dev/js/` | Front-end logic: form control, console navigation, redemption engine |
| `/dev/server/` | Node/Express server modules for partner APIs and internal routes |
| `/dev/server/partners.js` | Unified bridge integrating Seats.Aero, Duffel, SerpApi, and Plaid |
| `/assets/` | Static assets — images, icons, CSS, branding elements |
| `/docs/` | Internal documentation (TODO.md, role definitions, architecture notes) |
| `/fonts/` | Brand font files |
| `/test/` *(if present)* | Temporary sandbox for experiments — will be deprecated |
| `/index.html` | Main site entry point |
| `/package.json` | Node dependencies and project configuration |
| `/render.yaml` | Render deployment manifest |
| `.gitignore` | Excluded files (env vars, logs, cache, etc.) |

---

## 🧹 Cleanup Checklist

| Task | Status | Notes |
|------|:------:|------|
| Move inline `// TODO:` notes into `/docs/TODO.md` | ⏳ | Centralizes task tracking |
| Remove unused or legacy files (`old-*`, `/test/`) | ⏳ | Confirm before deletion |
| Review `/assets/` for large or unused media | ⏳ | Archive if uncertain |
| Standardize naming conventions (`redem-con.js`, etc.) | ⏳ | Maintain clarity |
| Add `.env.example` for environment variables | ⏳ | Document required API keys |
| Confirm `/docs/TODO.md` reflects latest milestone | ✅ | Phase 2 baseline complete |

---

## 👨‍💻 Collaboration Notes (for Homer)

- Primary working branch: `dev`  
- `main` branch is protected and requires review for all merges  
- Advisory role only — code contributions optional  
- Architectural, performance, and security feedback always welcome  
- Coordinate with Jeff before modifying repo structure or deleting files  

---
📎 **See also:** [Repository Cleanup Tasks →](/docs/TODO.md#repository-cleanup--pending-tasks)

**Last Updated:** November 12, 2025  
**Maintainer:** Jeff Wynn  
