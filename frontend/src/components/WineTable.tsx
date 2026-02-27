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

interface WineFormData {
  country: string;
  region: string;
  winery: string;
  wineName: string;
  grapeVariety: string;
  wineStyle: WineStyle;
  price: string;
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

// Load logo as base64 for embedding in PDF
function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = 14;

  // Try to embed logo
  try {
    const logoBase64 = await loadImageAsBase64('/assets/generated/naturavini-logo.dim_400x120.png');
    // Logo dimensions: keep aspect ratio, max height 18mm
    const logoMaxH = 18;
    const logoMaxW = 60;
    const naturalW = 400, naturalH = 120;
    const ratio = Math.min(logoMaxW / naturalW, logoMaxH / naturalH);
    const logoW = naturalW * ratio;
    const logoH = naturalH * ratio;
    doc.addImage(logoBase64, 'PNG', marginLeft, currentY, logoW, logoH);
    currentY += logoH + 4;
  } catch {
    // Fallback: text logo
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(oliveR, oliveG, oliveB);
    doc.text('NATURA VINI', marginLeft, currentY + 8);
    currentY += 14;
  }

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

    // Table rows
    const tableBody = countryWines.map((wine) => [
      wine.winery,
      wine.wineName,
      formatWineStyle(wine.wineStyle),
      wine.grapeVariety ?? '—',
      wine.region ?? '—',
      wine.price,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: currentY,
      head: [['Winery', 'Wine Name', 'Style', 'Grape Variety', 'Region', 'Price']],
      body: tableBody,
      margin: { left: marginLeft, right: marginRight },
      tableWidth: contentWidth,
      styles: {
        fontSize: 8.5,
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
        0: { cellWidth: 32 },
        1: { cellWidth: 38 },
        2: { cellWidth: 22 },
        3: { cellWidth: 32 },
        4: { cellWidth: 28 },
        5: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold', textColor: [oliveR, oliveG, oliveB] },
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
  // Use a normalized key (trimmed, lowercased) to avoid duplicate sections
  // caused by subtle differences in country name casing or whitespace.
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

    // Return sorted array of [displayName, wines[]]
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
        {/* Export PDF button — always visible when there are wines */}
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

        {/* Spacer when no export button */}
        {grouped.length === 0 && <div />}

        {/* Add button — only for admins */}
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

      {/* Empty state */}
      {grouped.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Wine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-serif text-lg">No wines yet</p>
          {isAdmin && (
            <p className="text-sm mt-1">Click "Add Wine" to get started.</p>
          )}
        </div>
      )}

      {/* Country sections */}
      {grouped.map(([country, countryWines]) => (
        <section key={country} className="overflow-hidden rounded-sm shadow-xs border border-border">
          {/* Country banner */}
          <div className="country-banner flex items-center gap-2">
            <Wine className="h-4 w-4 opacity-70" />
            <span>{country}</span>
            <span className="ml-auto text-primary-foreground/60 text-xs font-normal normal-case tracking-normal">
              {countryWines.length} {countryWines.length === 1 ? 'wine' : 'wines'}
            </span>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
                <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[18%]">
                  Winery
                </TableHead>
                <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[18%]">
                  Wine Name
                </TableHead>
                <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[12%]">
                  Style
                </TableHead>
                <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[15%]">
                  Grape
                </TableHead>
                <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[15%]">
                  Region
                </TableHead>
                <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right w-[12%]">
                  Price
                </TableHead>
                {isAdmin && (
                  <TableHead className="w-[90px]" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {countryWines.map((wine) => (
                <TableRow key={wine.id} className="wine-row bg-card">
                  <TableCell className="font-medium text-foreground py-3.5 font-serif">
                    {wine.winery}
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-3.5 font-serif">
                    {wine.wineName}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground/80">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${wineStyleDotColor(wine.wineStyle)}`} />
                      {formatWineStyle(wine.wineStyle)}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground/70 py-3.5 text-sm">
                    {wine.grapeVariety ?? <span className="text-muted-foreground/50">—</span>}
                  </TableCell>
                  <TableCell className="text-foreground/70 py-3.5 text-sm">
                    {wine.region ?? <span className="text-muted-foreground/50">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-accent py-3.5 tabular-nums">
                    {wine.price}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => { setMutationError(null); setEditWine(wine); }}
                          title="Edit wine"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => { setMutationError(null); setDeleteTarget(wine); }}
                          title="Delete wine"
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
        </section>
      ))}

      {/* Mutation error banner */}
      {mutationError && (
        <div className="flex items-center gap-3 text-destructive bg-destructive/10 px-4 py-3 rounded-md mt-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{mutationError}</p>
        </div>
      )}

      {/* Add Wine Modal */}
      <WineFormModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setMutationError(null); }}
        onSubmit={handleAdd}
        isLoading={addWine.isPending}
        error={mutationError}
      />

      {/* Edit Wine Modal */}
      <WineFormModal
        open={!!editWine}
        onClose={() => { setEditWine(null); setMutationError(null); }}
        onSubmit={handleEdit}
        isLoading={updateWine.isPending}
        initialData={editWine}
        error={mutationError}
      />

      {/* Delete Confirmation */}
      <DeleteWineDialog
        open={!!deleteTarget}
        wine={deleteTarget}
        onClose={() => { setDeleteTarget(null); setMutationError(null); }}
        onConfirm={handleDelete}
        isLoading={deleteWine.isPending}
      />
    </div>
  );
}
