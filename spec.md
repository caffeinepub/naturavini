# Specification

## Summary
**Goal:** Add a vintage Year field to the wine form and data model, display the Natura Vini logo in the page header and PDF export, and include the Year column in the PDF.

**Planned changes:**
- Add an optional numeric "Year" field to the Add/Edit Wine modal form, positioned after Wine Name and before Wine Style
- Add an optional/nullable `year` field to the Wine data model in the backend; update `addWine`, `updateWine`, and `getAllWines` accordingly
- Update frontend query hooks to pass and read the `year` field; display the year alongside the wine name in the wine list table
- Display the new Natura Vini logo image in the page header with graceful fallback if it fails to load
- Add the Natura Vini logo to the top of the exported PDF, skipping it gracefully if it cannot be loaded
- Add a "Year" column to the exported PDF table (after Wine Name), showing a dash (—) for wines without a year

**User-visible outcome:** Users can add and edit a vintage year for each wine, see it displayed in the wine list and PDF export, and the page header and PDF now feature the Natura Vini logo.
