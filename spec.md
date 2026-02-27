# Specification

## Summary
**Goal:** Fix two bugs in the PDF export of the Naturavini Wine Price List: incorrect country grouping and missing logo.

**Planned changes:**
- Fix the PDF export grouping logic in `WineTable.tsx` so that wines from the same country are merged into a single section (e.g. Italy appears only once with all its wines), matching the intended on-screen grouping behavior.
- Add the Naturavini logo (`frontend/public/assets/generated/naturavini-logo.png`) to the top of the exported PDF, above the wine catalogue content.

**User-visible outcome:** When the user exports the wine price list to PDF, each country appears exactly once as a section header with all its wines listed beneath it, and the Naturavini logo is displayed at the top of the PDF.
