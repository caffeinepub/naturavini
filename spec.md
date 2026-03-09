# Naturavini Wine Price List

## Current State
A full-stack wine catalog app. Backend (Motoko) stores wines with fields: id, country, region, winery, wineName, grapeVariety, wineStyle, price, year, soldOut, hotPrice. Frontend displays wines grouped by country in a table, with PDF export. Admin can add/edit/delete wines via modal.

## Requested Changes (Diff)

### Add
- **Notes field**: Each wine gets an optional `notes` text field (tasting notes / description). In the app, a small Notes button per wine row opens a popover/dialog showing the notes. In the edit/add modal, a textarea for notes is included. Notes are NOT shown in the PDF export.
- **Search & filter bar**: Above the wine list, a search input and style/country filter dropdowns. Filters wines displayed in the app only. Not included in PDF export (PDF always exports all wines).
- **Winery banners**: Within each country section, wines are further grouped by winery. Each winery gets its own distinct banner header (like in the uploaded catalog images: bold winery name, region sub-text, olive/dark background). Wines for that winery appear in a table under their winery banner. This replaces the single country-level table with per-winery sub-sections.

### Modify
- `Wine` and `WineRecord` types in backend: add `notes: ?Text` field
- `addWine` and `updateWine` endpoints: accept `notes` parameter
- `WineFormModal`: add Notes textarea field
- `WineTable`: restructure grouping from country-only to country > winery. Add search/filter bar. Add notes popover button per row.
- PDF export: group by country then winery in output, but do not include notes or search state.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `main.mo`: add `notes: ?Text` to `WineRecord` and `Wine`, update `addWine`, `updateWine`, `toWine`, and sample data.
2. Update `WineFormModal.tsx`: add notes textarea to form.
3. Update `WineTable.tsx`:
   - Restructure grouping: country -> winery -> wines array
   - Render winery banners (olive header with winery name + region)
   - Add notes button per row that opens a popover with note text
   - Add search input + style/country filter bar (app-only)
   - PDF export unchanged in data (still exports all wines, no notes column)
