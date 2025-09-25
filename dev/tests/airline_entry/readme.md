# Airline Entry Tests

This folder contains **test harness scripts** used to validate clean entry/exit 
into airline booking engines. These are **not production code** — their sole purpose 
is to verify that Infinite Sync (IS) can preload search forms, allow a client to 
click "Search," and then confirm the results page loads without triggering security 
blocks (e.g. Akamai).

---

## Purpose
- Ensure we can enter/exit each airline site cleanly.
- Validate that client-initiated clicks are always safe.
- Capture DOM/HTML + screenshot snapshots for Viscan prototyping.
- Log which airlines are stable vs problematic.

---

## Current Scripts
- **aa_entry_test.py** → American Airlines prototype (hardest Akamai case).
- (future) ua_entry_test.py → United Airlines baseline.
- (future) dl_entry_test.py → Delta Air Lines baseline.
- (future) as_entry_test.py → Alaska Airlines baseline.
- (future) wn_entry_test.py → Southwest baseline.

---

## Usage
1. Run the script for the airline you want to test.
2. Browser launches with form preloaded.
3. Client (human) clicks **Search**.
4. Results page loads → script captures snapshot (HTML + screenshot).
5. Overlay logs "Scan complete." Client closes browser tab.

---

## Notes
- These tests are **for validation only**.
- No automation of submit events → client must always click "Search."
- VPN-friendly; all tests run inside real client sessions.
- Outputs saved locally (`.html` + `.png`) for review.

---

## Next Steps
- Expand scripts to multiple airlines.
- Add logging CSV for success/failure tracking.
- Wrap into a simple dashboard once stable.
