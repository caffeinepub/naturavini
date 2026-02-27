# Specification

## Summary
**Goal:** Add a "Sold Out" flag to wines that can be toggled in the edit form, displayed as a badge in the wine table, and shown as a marker in the PDF export.

**Planned changes:**
- Add a `soldOut` boolean field to the Wine data model in the backend, with a default of `false` for all existing and new wines
- Update `addWine` and `updateWine` backend functions to accept and store the `soldOut` field; ensure `getAllWines` returns it
- Add a "Sold Out" checkbox/toggle to the Add/Edit Wine modal form, pre-populated when editing and included in the submission payload
- Display a styled "Sold Out" badge (tangerine-orange or muted red pill) on wine rows where `soldOut` is true in the wine list table
- Update the PDF export to show a visually distinct "SOLD OUT" marker next to wines where `soldOut` is true

**User-visible outcome:** Admins can mark any wine as sold out via the edit form; the sold-out status is visible as a badge in the wine table and as a clear marker in the exported PDF catalogue.
