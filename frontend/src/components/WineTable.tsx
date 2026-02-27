import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, Plus, Wine, AlertCircle, FileDown, Loader2 } from 'lucide-react';
import { useGetAllWines, useAddWine, useUpdateWine, useDeleteWine } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import WineFormModal from './WineFormModal';
import type { WineFormData } from './WineFormModal';
import DeleteWineDialog from './DeleteWineDialog';
import type { Wine as WineType } from '../backend';
import { WineStyle } from '../backend';

function generateId(country: string, winery: string, wineName: string): string {
  const base = `${country}-${winery}-${wineName}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
  return `${base}-${Date.now()}`;
}

function formatWineStyle(style: WineStyle): string {
  switch (style) {
    case WineStyle.red: return 'Red';
    case WineStyle.white: return 'White';
    case WineStyle.rose: return 'Rosé';
    case WineStyle.sparkling: return 'Sparkling';
    case WineStyle.orange: return 'Orange';
    case WineStyle.petNat: return 'Pét-Nat';
    default: return String(style);
  }
}

function wineStyleDotColor(style: WineStyle): string {
  switch (style) {
    case WineStyle.red: return 'bg-red-600';
    case WineStyle.white: return 'bg-yellow-200 border border-yellow-400';
    case WineStyle.rose: return 'bg-pink-400';
    case WineStyle.sparkling: return 'bg-sky-300';
    case WineStyle.orange: return 'bg-orange-400';
    case WineStyle.petNat: return 'bg-amber-200 border border-amber-400';
    default: return 'bg-muted';
  }
}

// Dynamically load a script from CDN and return a promise
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function exportToPDF(grouped: [string, WineType[]][]): Promise<void> {
  // Load jsPDF and autotable from CDN
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Brand colors (olive green)
  const oliveR = 74, oliveG = 93, oliveB = 35;
  const creamR = 250, creamG = 247, creamB = 240;
  const lightOliveR = 237, lightOliveG = 240, lightOliveB = 225;
  // Sold out color: muted red
  const soldOutR = 180, soldOutG = 50, soldOutB = 50;

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = 14;

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 110, 90);
  doc.text('NATURAL WINE PRICE LIST', marginLeft, currentY);
  currentY += 4;

  // Divider line
  doc.setDrawColor(oliveR, oliveG, oliveB);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 6;

  // Date
  const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(8);
  doc.setTextColor(150, 140, 120);
  doc.text(today, pageWidth - marginRight, currentY - 2, { align: 'right' });

  // Render each country section
  for (const [country, countryWines] of grouped) {
    // Country header band
    doc.setFillColor(oliveR, oliveG, oliveB);
    doc.rect(marginLeft, currentY, contentWidth, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(country.toUpperCase(), marginLeft + 3, currentY + 4.8);
    const wineCount = `${countryWines.length} ${countryWines.length === 1 ? 'wine' : 'wines'}`;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(wineCount, pageWidth - marginRight - 3, currentY + 4.8, { align: 'right' });
    currentY += 7;

    // Table rows: columns = Winery, Wine Name, Year, Style, Grape Variety, Region, Price, (Sold Out)
    const tableBody = countryWines.map((wine) => [
      wine.winery,
      wine.wineName,
      wine.year ?? '—',
      formatWineStyle(wine.wineStyle),
      wine.grapeVariety ?? '—',
      wine.region ?? '—',
      wine.price,
      wine.soldOut ? 'SOLD OUT' : '',
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: currentY,
      head: [['Winery', 'Wine Name', 'Year', 'Style', 'Grape Variety', 'Region', 'Price', '']],
      body: tableBody,
      margin: { left: marginLeft, right: marginRight },
      tableWidth: contentWidth,
      styles: {
        fontSize: 8,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        textColor: [50, 45, 35],
        lineColor: [220, 215, 200],
        lineWidth: 0.2,
        font: 'helvetica',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [lightOliveR, lightOliveG, lightOliveB],
        textColor: [oliveR, oliveG, oliveB],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
      alternateRowStyles: {
        fillColor: [creamR, creamG, creamB],
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 32 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 18 },
        4: { cellWidth: 26 },
        5: { cellWidth: 22 },
        6: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold', textColor: [oliveR, oliveG, oliveB] },
        7: { cellWidth: 18, halign: 'center', fontStyle: 'bold', textColor: [soldOutR, soldOutG, soldOutB], fontSize: 7 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 7 && data.cell.raw === 'SOLD OUT') {
          data.cell.styles.textColor = [soldOutR, soldOutG, soldOutB];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7;
        }
        // Dim the wine name text for sold-out rows
        if (data.section === 'body' && data.column.index === 1) {
          const rowData = data.row.raw as string[];
          if (rowData[7] === 'SOLD OUT') {
            data.cell.styles.textColor = [160, 140, 120];
          }
        }
      },
      didDrawPage: () => {
        // Footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(180, 170, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Natura Vini — Natural Wine Price List  |  Page ${pageNum} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Page break check
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      currentY = 14;
    }
  }

  doc.save('naturavini-pricelist.pdf');
}

export default function WineTable() {
  const { data: wines = [], isLoading, isError } = useGetAllWines();
  const { identity } = useInternetIdentity();
  const isAdmin = !!identity;

  const addWine = useAddWine();
  const updateWine = useUpdateWine();
  const deleteWine = useDeleteWine();

  const [addOpen, setAddOpen] = useState(false);
  const [editWine, setEditWine] = useState<WineType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WineType | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Group wines by country, sorted alphabetically.
  const grouped = useMemo(() => {
    const map = new Map<string, { displayName: string; wines: WineType[] }>();

    for (const wine of wines) {
      const normalizedKey = wine.country.trim().toLowerCase();
      const existing = map.get(normalizedKey);
      if (existing) {
        existing.wines.push(wine);
      } else {
        map.set(normalizedKey, { displayName: wine.country.trim(), wines: [wine] });
      }
    }

    // Sort wines within each country by winery then wine name
    for (const entry of map.values()) {
      entry.wines.sort(
        (a, b) => a.winery.localeCompare(b.winery) || a.wineName.localeCompare(b.wineName)
      );
    }

    return Array.from(map.values())
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((entry): [string, WineType[]] => [entry.displayName, entry.wines]);
  }, [wines]);

  const handleExportPDF = async () => {
    if (grouped.length === 0) return;
    setIsExporting(true);
    try {
      await exportToPDF(grouped);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdd = async (data: WineFormData) => {
    setMutationError(null);
    try {
      const id = generateId(data.country, data.winery, data.wineName);
      await addWine.mutateAsync({
        id,
        country: data.country,
        region: data.region.trim() || null,
        winery: data.winery,
        wineName: data.wineName,
        grapeVariety: data.grapeVariety.trim() || null,
        wineStyle: data.wineStyle,
        price: data.price,
        soldOut: data.soldOut,
        year: data.year.trim() || null,
      });
      setAddOpen(false);
    } catch (err: unknown) {
      const e = err as Error;
      setMutationError(e?.message ?? 'Failed to add wine.');
    }
  };

  const handleEdit = async (data: WineFormData) => {
    if (!editWine) return;
    setMutationError(null);
    try {
      await updateWine.mutateAsync({
        id: editWine.id,
        country: data.country,
        region: data.region.trim() || null,
        winery: data.winery,
        wineName: data.wineName,
        grapeVariety: data.grapeVariety.trim() || null,
        wineStyle: data.wineStyle,
        price: data.price,
        soldOut: data.soldOut,
        year: data.year.trim() || null,
      });
      setEditWine(null);
    } catch (err: unknown) {
      const e = err as Error;
      setMutationError(e?.message ?? 'Failed to update wine.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setMutationError(null);
    try {
      await deleteWine.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const e = err as Error;
      setMutationError(e?.message ?? 'Failed to delete wine.');
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="h-10 w-full mb-1" />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-12 w-full mb-px" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center gap-3 text-destructive bg-destructive/10 px-4 py-3 rounded-md">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">Failed to load wines. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {grouped.length > 0 && (
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            variant="outline"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isExporting ? 'Generating…' : 'Export PDF'}
          </Button>
        )}

        {grouped.length === 0 && <div />}

        {isAdmin && (
          <Button
            onClick={() => { setMutationError(null); setAddOpen(true); }}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Wine
          </Button>
        )}
      </div>

      {/* Mutation error */}
      {mutationError && (
        <div className="flex items-center gap-3 text-destructive bg-destructive/10 px-4 py-3 rounded-md mb-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{mutationError}</p>
        </div>
      )}

      {/* Empty state */}
      {grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Wine className="h-12 w-12 opacity-30" />
          <p className="text-base font-medium">No wines in the catalogue yet.</p>
          {isAdmin && (
            <p className="text-sm">Click "Add Wine" to get started.</p>
          )}
        </div>
      )}

      {/* Country sections */}
      {grouped.map(([country, countryWines]) => (
        <div key={country} className="mb-6">
          {/* Country banner */}
          <div className="country-banner flex items-center justify-between px-4 py-2 mb-0">
            <span className="font-serif font-bold text-sm tracking-widest uppercase text-primary-foreground">
              {country}
            </span>
            <span className="text-primary-foreground/70 text-xs font-sans">
              {countryWines.length} {countryWines.length === 1 ? 'wine' : 'wines'}
            </span>
          </div>

          {/* Wine table */}
          <div className="border border-border rounded-b-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[18%]">Winery</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[20%]">Wine Name</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[8%] text-center">Year</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[12%]">Style</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[16%] hidden md:table-cell">Grape Variety</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[14%] hidden sm:table-cell">Region</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[10%] text-right">Price</TableHead>
                  {isAdmin && (
                    <TableHead className="w-[8%]" />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {countryWines.map((wine) => (
                  <TableRow
                    key={wine.id}
                    className={`wine-row transition-colors ${wine.soldOut ? 'opacity-60' : ''}`}
                  >
                    <TableCell className="font-medium text-sm">{wine.winery}</TableCell>
                    <TableCell className="text-sm">
                      <span className={wine.soldOut ? 'line-through text-muted-foreground' : ''}>
                        {wine.wineName}
                      </span>
                      {wine.soldOut && (
                        <span className="ml-2 text-xs font-semibold text-destructive uppercase tracking-wide">
                          Sold Out
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-center text-muted-foreground">
                      {wine.year ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${wineStyleDotColor(wine.wineStyle)}`} />
                        {formatWineStyle(wine.wineStyle)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {wine.grapeVariety ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {wine.region ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-primary text-right">
                      {wine.price}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => { setMutationError(null); setEditWine(wine); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => { setMutationError(null); setDeleteTarget(wine); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Add Wine Modal */}
      <WineFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        isLoading={addWine.isPending}
      />

      {/* Edit Wine Modal */}
      <WineFormModal
        open={!!editWine}
        onClose={() => setEditWine(null)}
        onSubmit={handleEdit}
        isLoading={updateWine.isPending}
        initialData={editWine}
      />

      {/* Delete Confirmation */}
      <DeleteWineDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteWine.isPending}
        wine={deleteTarget}
      />
    </div>
  );
}
