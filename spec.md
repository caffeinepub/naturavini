# Specification

## Summary
**Goal:** Restore lost wine data in the backend and remove the logo from the PDF export.

**Planned changes:**
- Re-seed the backend with sample wines (Croatia and Italy, at least 3 per country) so the wine list is not empty on load.
- Ensure wine data persists across canister upgrades using stable variables in `backend/main.mo`.
- Remove the Naturavini logo from the PDF export in `WineTable.tsx`; the rest of the PDF content (wine catalogue grouped by country with all columns) remains intact.

**User-visible outcome:** The wine list shows populated wine entries on first load, data survives upgrades, and exporting to PDF produces a logo-free document with the full wine catalogue.
