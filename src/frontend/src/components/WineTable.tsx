import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  FileDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Trash2,
  Wine,
  X,
} from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import type { Wine as WineType } from "../backend";
import { WineStyle } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddWine,
  useDeleteWine,
  useGetAllWines,
  useUpdateWine,
} from "../hooks/useQueries";
import { useWineNotes } from "../hooks/useWineNotes";
import DeleteWineDialog from "./DeleteWineDialog";
import WineFormModal from "./WineFormModal";
import type { WineFormData } from "./WineFormModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WineryGroup {
  winery: string;
  region: string | undefined;
  wines: WineType[];
}

interface CountryGroup {
  country: string;
  wineries: WineryGroup[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId(country: string, winery: string, wineName: string): string {
  const base = `${country}-${winery}-${wineName}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
  return `${base}-${Date.now()}`;
}

function formatWineStyle(style: WineStyle): string {
  switch (style) {
    case WineStyle.red:
      return "Red";
    case WineStyle.white:
      return "White";
    case WineStyle.rose:
      return "Rosé";
    case WineStyle.sparkling:
      return "Sparkling";
    case WineStyle.orange:
      return "Orange";
    case WineStyle.petNat:
      return "Pét-Nat";
    default:
      return String(style);
  }
}

function wineStyleDotColor(style: WineStyle): string {
  switch (style) {
    case WineStyle.red:
      return "bg-red-600";
    case WineStyle.white:
      return "bg-yellow-200 border border-yellow-400";
    case WineStyle.rose:
      return "bg-pink-400";
    case WineStyle.sparkling:
      return "bg-sky-300";
    case WineStyle.orange:
      return "bg-orange-400";
    case WineStyle.petNat:
      return "bg-amber-200 border border-amber-400";
    default:
      return "bg-muted";
  }
}

function groupWines(wines: WineType[]): CountryGroup[] {
  const countryMap = new Map<string, Map<string, WineryGroup>>();

  for (const wine of wines) {
    const ck = wine.country.trim().toLowerCase();
    if (!countryMap.has(ck)) {
      countryMap.set(ck, new Map());
    }
    const wineryMap = countryMap.get(ck)!;
    const wk = wine.winery.trim().toLowerCase();
    if (!wineryMap.has(wk)) {
      wineryMap.set(wk, {
        winery: wine.winery.trim(),
        region: wine.region ?? undefined,
        wines: [],
      });
    }
    wineryMap.get(wk)!.wines.push(wine);
  }

  const result: CountryGroup[] = [];
  for (const [, wineryMap] of Array.from(countryMap.entries()).sort(
    ([a], [b]) => a.localeCompare(b),
  )) {
    const wineries: WineryGroup[] = Array.from(wineryMap.values())
      .sort((a, b) => a.winery.localeCompare(b.winery))
      .map((wg) => ({
        ...wg,
        wines: [...wg.wines].sort((a, b) =>
          a.wineName.localeCompare(b.wineName),
        ),
      }));

    // Get display country from first wine in first winery
    const displayCountry = wineries[0]?.wines[0]?.country.trim() ?? "";
    result.push({ country: displayCountry, wineries });
  }

  return result;
}

// ─── PDF export ───────────────────────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function exportToPDF(groups: CountryGroup[]): Promise<void> {
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  );
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js",
  );

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const oliveR = 74;
  const oliveG = 93;
  const oliveB = 35;
  const creamR = 250;
  const creamG = 247;
  const creamB = 240;
  const lightOliveR = 237;
  const lightOliveG = 240;
  const lightOliveB = 225;
  const wineryBgR = 245;
  const wineryBgG = 247;
  const wineryBgB = 235;
  const soldOutR = 180;
  const soldOutG = 50;
  const soldOutB = 50;
  const hotPriceR = 220;
  const hotPriceG = 100;
  const hotPriceB = 20;

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = 14;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 110, 90);
  doc.text("NATURAL WINE PRICE LIST", marginLeft, currentY);
  currentY += 4;

  doc.setDrawColor(oliveR, oliveG, oliveB);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 6;

  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(8);
  doc.setTextColor(150, 140, 120);
  doc.text(today, pageWidth - marginRight, currentY - 2, { align: "right" });

  for (const { country, wineries } of groups) {
    // Country banner
    if (currentY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      currentY = 14;
    }

    doc.setFillColor(oliveR, oliveG, oliveB);
    doc.rect(marginLeft, currentY, contentWidth, 8, "F");
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(country.toUpperCase(), marginLeft + 3, currentY + 5.3);
    const totalWines = wineries.reduce((s, w) => s + w.wines.length, 0);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${totalWines} ${totalWines === 1 ? "wine" : "wines"}`,
      pageWidth - marginRight - 3,
      currentY + 5.3,
      { align: "right" },
    );
    currentY += 9;

    for (const wineryGroup of wineries) {
      if (currentY > doc.internal.pageSize.getHeight() - 35) {
        doc.addPage();
        currentY = 14;
      }

      // Winery sub-header
      doc.setFillColor(wineryBgR, wineryBgG, wineryBgB);
      doc.rect(marginLeft, currentY, contentWidth, 7, "F");
      doc.setDrawColor(oliveR, oliveG, oliveB);
      doc.setLineWidth(0.8);
      doc.line(marginLeft, currentY, marginLeft, currentY + 7);
      doc.setLineWidth(0.2);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(oliveR, oliveG, oliveB);
      doc.text(
        wineryGroup.winery.toUpperCase(),
        marginLeft + 4,
        currentY + 4.5,
      );

      if (wineryGroup.region) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 110, 80);
        const wineryNameWidth =
          doc.getTextWidth(wineryGroup.winery.toUpperCase()) *
          (8.5 / doc.internal.scaleFactor);
        doc.text(
          wineryGroup.region,
          marginLeft + 4 + wineryNameWidth + 4,
          currentY + 4.5,
        );
      }

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 110, 80);
      doc.text(
        `${wineryGroup.wines.length} ${wineryGroup.wines.length === 1 ? "wine" : "wines"}`,
        pageWidth - marginRight - 3,
        currentY + 4.5,
        { align: "right" },
      );
      currentY += 8;

      const tableBody = wineryGroup.wines.map((wine) => [
        wine.hotPrice ? "\ud83d\udd25 HOT" : "",
        wine.wineName,
        wine.year ?? "—",
        formatWineStyle(wine.wineStyle),
        wine.grapeVariety ?? "—",
        wine.region ?? "—",
        wine.price,
        wine.soldOut ? "SOLD OUT" : "",
      ]);

      (doc as any).autoTable({
        startY: currentY,
        head: [
          [
            "",
            "Wine Name",
            "Year",
            "Style",
            "Grape Variety",
            "Region",
            "Price",
            "",
          ],
        ],
        body: tableBody,
        margin: { left: marginLeft + 2, right: marginRight },
        tableWidth: contentWidth - 2,
        styles: {
          fontSize: 8,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          textColor: [50, 45, 35],
          lineColor: [220, 215, 200],
          lineWidth: 0.2,
          font: "helvetica",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [lightOliveR, lightOliveG, lightOliveB],
          textColor: [oliveR, oliveG, oliveB],
          fontStyle: "bold",
          fontSize: 7.5,
          cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        },
        alternateRowStyles: { fillColor: [creamR, creamG, creamB] },
        bodyStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
          0: {
            cellWidth: 14,
            halign: "center",
            fontStyle: "bold",
            fontSize: 7,
            textColor: [hotPriceR, hotPriceG, hotPriceB],
          },
          1: { cellWidth: 38 },
          2: { cellWidth: 13, halign: "center" },
          3: { cellWidth: 17 },
          4: { cellWidth: 26 },
          5: { cellWidth: 22 },
          6: {
            cellWidth: "auto",
            halign: "right",
            fontStyle: "bold",
            textColor: [oliveR, oliveG, oliveB],
          },
          7: {
            cellWidth: 17,
            halign: "center",
            fontStyle: "bold",
            textColor: [soldOutR, soldOutG, soldOutB],
            fontSize: 7,
          },
        },
        didParseCell: (data: any) => {
          if (
            data.section === "body" &&
            data.column.index === 7 &&
            data.cell.raw === "SOLD OUT"
          ) {
            data.cell.styles.textColor = [soldOutR, soldOutG, soldOutB];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fontSize = 7;
          }
        },
        didDrawPage: () => {
          const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(180, 170, 150);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Natura Vini — Natural Wine Price List  |  Page ${pageNum} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" },
          );
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;

      if (currentY > doc.internal.pageSize.getHeight() - 25) {
        doc.addPage();
        currentY = 14;
      }
    }

    currentY += 4;
  }

  doc.save("naturavini-pricelist.pdf");
}

// ─── Notes Popover ────────────────────────────────────────────────────────────
function NotesPopover({
  wineId,
  wineName,
  isAdmin,
  getNote,
  setNote,
}: {
  wineId: string;
  wineName: string;
  isAdmin: boolean;
  getNote: (id: string) => string;
  setNote: (id: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const note = getNote(wineId);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(note);
    setOpen(isOpen);
  };

  const handleSave = () => {
    setNote(wineId, draft);
    setOpen(false);
  };

  if (!isAdmin && !note) return null;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 transition-colors ${
            note
              ? "text-primary hover:text-primary hover:bg-primary/10"
              : "text-muted-foreground/50 hover:text-muted-foreground"
          }`}
          title={note ? "View tasting notes" : "Add tasting notes"}
          data-ocid="wine.open_modal_button"
        >
          <StickyNote className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 border border-border shadow-lg"
        align="end"
        data-ocid="wine.popover"
      >
        <div className="bg-[oklch(0.99_0.015_85)] rounded-md overflow-hidden">
          {/* Popover header */}
          <div className="bg-primary/8 border-b border-border px-4 py-2.5 flex items-center gap-2">
            <StickyNote className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                Tasting Notes
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {wineName}
              </p>
            </div>
          </div>

          <div className="px-4 py-3">
            {isAdmin ? (
              <>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="e.g. Earthy, cherry notes, long finish..."
                  rows={4}
                  className="text-sm resize-none border-border bg-white focus-visible:ring-primary text-foreground"
                  data-ocid="wine.textarea"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-border"
                    onClick={() => setOpen(false)}
                    data-ocid="wine.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSave}
                    data-ocid="wine.save_button"
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm italic text-foreground/80 leading-relaxed font-serif">
                {note || (
                  <span className="text-muted-foreground not-italic">
                    No notes available.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Search/Filter Bar ────────────────────────────────────────────────────────
const ALL_STYLES = "__all__";
const ALL_COUNTRIES = "__all__";

function SearchFilterBar({
  search,
  onSearch,
  styleFilter,
  onStyleFilter,
  countryFilter,
  onCountryFilter,
  countries,
}: {
  search: string;
  onSearch: (v: string) => void;
  styleFilter: string;
  onStyleFilter: (v: string) => void;
  countryFilter: string;
  onCountryFilter: (v: string) => void;
  countries: string[];
}) {
  const hasFilters =
    search || styleFilter !== ALL_STYLES || countryFilter !== ALL_COUNTRIES;

  return (
    <div
      className="flex flex-col sm:flex-row gap-2 mb-4"
      data-ocid="wine.search_input"
    >
      {/* Text search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search wine name, winery, grape…"
          className="pl-8 pr-8 h-9 text-sm bg-white border-border focus-visible:ring-primary"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Style filter */}
      <Select value={styleFilter} onValueChange={onStyleFilter}>
        <SelectTrigger
          className="h-9 w-full sm:w-36 text-sm bg-white border-border"
          data-ocid="wine.select"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border-border">
          <SelectItem value={ALL_STYLES}>All Styles</SelectItem>
          <SelectItem value={WineStyle.red}>Red</SelectItem>
          <SelectItem value={WineStyle.white}>White</SelectItem>
          <SelectItem value={WineStyle.rose}>Rosé</SelectItem>
          <SelectItem value={WineStyle.sparkling}>Sparkling</SelectItem>
          <SelectItem value={WineStyle.orange}>Orange</SelectItem>
          <SelectItem value={WineStyle.petNat}>Pét-Nat</SelectItem>
        </SelectContent>
      </Select>

      {/* Country filter */}
      {countries.length > 1 && (
        <Select value={countryFilter} onValueChange={onCountryFilter}>
          <SelectTrigger
            className="h-9 w-full sm:w-36 text-sm bg-white border-border"
            data-ocid="wine.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-border">
            <SelectItem value={ALL_COUNTRIES}>All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => {
            onSearch("");
            onStyleFilter(ALL_STYLES);
            onCountryFilter(ALL_COUNTRIES);
          }}
        >
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WineTable() {
  const { data: wines = [], isLoading, isError } = useGetAllWines();
  const { identity } = useInternetIdentity();
  const isAdmin = !!identity;
  const { getNote, setNote } = useWineNotes();

  const addWine = useAddWine();
  const updateWine = useUpdateWine();
  const deleteWine = useDeleteWine();

  const [addOpen, setAddOpen] = useState(false);
  const [editWine, setEditWine] = useState<WineType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WineType | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Search / filter state
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState(ALL_STYLES);
  const [countryFilter, setCountryFilter] = useState(ALL_COUNTRIES);

  // All countries for filter dropdown
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    for (const w of wines) set.add(w.country.trim());
    return Array.from(set).sort();
  }, [wines]);

  // Filtered wines (app only)
  const filteredWines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wines.filter((w) => {
      if (
        q &&
        ![w.wineName, w.winery, w.grapeVariety ?? ""].some((s) =>
          s.toLowerCase().includes(q),
        )
      )
        return false;
      if (styleFilter !== ALL_STYLES && w.wineStyle !== styleFilter)
        return false;
      if (countryFilter !== ALL_COUNTRIES && w.country.trim() !== countryFilter)
        return false;
      return true;
    });
  }, [wines, search, styleFilter, countryFilter]);

  // Grouped for display (filtered)
  const grouped = useMemo(() => groupWines(filteredWines), [filteredWines]);

  // All wines grouped for PDF (no filters)
  const allGrouped = useMemo(() => groupWines(wines), [wines]);

  const handleExportPDF = async () => {
    if (allGrouped.length === 0) return;
    setIsExporting(true);
    try {
      await exportToPDF(allGrouped);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdd = async (data: WineFormData) => {
    setMutationError(null);
    try {
      const id = generateId(data.country, data.winery, data.wineName);
      await (addWine.mutateAsync as any)({
        id,
        country: data.country,
        region: data.region.trim() || null,
        winery: data.winery,
        wineName: data.wineName,
        grapeVariety: data.grapeVariety.trim() || null,
        wineStyle: data.wineStyle,
        price: data.price,
        soldOut: data.soldOut,
        hotPrice: data.hotPrice,
        lowStock: data.lowStock,
        year: data.year.trim() || null,
        notes: data.notes.trim() || null,
      });
      if (data.notes.trim()) {
        setNote(id, data.notes);
      }
      setAddOpen(false);
    } catch (err: unknown) {
      const e = err as Error;
      setMutationError(e?.message ?? "Failed to add wine.");
    }
  };

  const handleEdit = async (data: WineFormData) => {
    if (!editWine) return;
    setMutationError(null);
    try {
      await (updateWine.mutateAsync as any)({
        id: editWine.id,
        country: data.country,
        region: data.region.trim() || null,
        winery: data.winery,
        wineName: data.wineName,
        grapeVariety: data.grapeVariety.trim() || null,
        wineStyle: data.wineStyle,
        price: data.price,
        soldOut: data.soldOut,
        hotPrice: data.hotPrice,
        lowStock: data.lowStock,
        year: data.year.trim() || null,
        notes: data.notes.trim() || null,
      });
      setNote(editWine.id, data.notes);
      setEditWine(null);
    } catch (err: unknown) {
      const e = err as Error;
      setMutationError(e?.message ?? "Failed to update wine.");
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
      setMutationError(e?.message ?? "Failed to delete wine.");
    }
  };

  const openEdit = useCallback((wine: WineType) => {
    setMutationError(null);
    setEditWine(wine);
  }, []);

  const openDelete = useCallback((wine: WineType) => {
    setMutationError(null);
    setDeleteTarget(wine);
  }, []);

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

  if (isError) {
    return (
      <div
        className="flex items-center gap-3 text-destructive bg-destructive/10 px-4 py-3 rounded-md"
        data-ocid="wine.error_state"
      >
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          Failed to load wines. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-3 gap-2">
        {wines.length > 0 && (
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            variant="outline"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            data-ocid="wine.secondary_button"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isExporting ? "Generating…" : "Export PDF"}
          </Button>
        )}
        {wines.length === 0 && <div />}
        {isAdmin && (
          <Button
            onClick={() => {
              setMutationError(null);
              setAddOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shadow-xs"
            data-ocid="wine.add_button"
          >
            <Plus className="h-4 w-4" /> Add Wine
          </Button>
        )}
      </div>

      {/* Search & filter (app only) */}
      {wines.length > 0 && (
        <SearchFilterBar
          search={search}
          onSearch={setSearch}
          styleFilter={styleFilter}
          onStyleFilter={setStyleFilter}
          countryFilter={countryFilter}
          onCountryFilter={setCountryFilter}
          countries={allCountries}
        />
      )}

      {/* Mutation error */}
      {mutationError && (
        <div
          className="flex items-center gap-3 text-destructive bg-destructive/10 px-4 py-3 rounded-md mb-2"
          data-ocid="wine.error_state"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{mutationError}</p>
        </div>
      )}

      {/* Empty state */}
      {wines.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3"
          data-ocid="wine.empty_state"
        >
          <Wine className="h-12 w-12 opacity-30" />
          <p className="text-base font-medium">
            No wines in the catalogue yet.
          </p>
          {isAdmin && (
            <p className="text-sm">Click "Add Wine" to get started.</p>
          )}
        </div>
      )}

      {/* No results from filter */}
      {wines.length > 0 && grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Search className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">No wines match your search.</p>
        </div>
      )}

      {/* Country → Winery → Table */}
      {grouped.map(({ country, wineries }) => (
        <div key={country} className="mb-8">
          {/* Country banner */}
          <div className="country-banner flex items-center justify-between px-5 py-3 mb-0 rounded-t-md">
            <span className="font-serif font-bold text-base tracking-widest uppercase text-primary-foreground">
              {country}
            </span>
            <span className="text-primary-foreground/70 text-xs font-sans">
              {wineries.reduce((s, w) => s + w.wines.length, 0)}{" "}
              {wineries.reduce((s, w) => s + w.wines.length, 0) === 1
                ? "wine"
                : "wines"}
            </span>
          </div>

          {/* Winery sections within country */}
          {wineries.map((wineryGroup, wi) => (
            <div
              key={wineryGroup.winery}
              className={wi < wineries.length - 1 ? "mb-1" : ""}
            >
              {/* Winery banner */}
              <div className="winery-banner flex items-center gap-3 px-5 py-2.5">
                <div className="flex-1 min-w-0">
                  <span className="font-serif font-bold text-sm tracking-wider uppercase text-primary">
                    {wineryGroup.winery}
                  </span>
                  {wineryGroup.region && (
                    <span className="ml-3 text-xs text-muted-foreground font-sans">
                      {wineryGroup.region}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-sans shrink-0">
                  {wineryGroup.wines.length}{" "}
                  {wineryGroup.wines.length === 1 ? "wine" : "wines"}
                </span>
              </div>

              {/* Wines table */}
              <div
                className={`border border-border overflow-hidden ${
                  wi === wineries.length - 1 ? "rounded-b-md" : ""
                }`}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[5%]" />
                      <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[22%]">
                        Wine Name
                      </TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[7%] text-center">
                        Year
                      </TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[12%]">
                        Style
                      </TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[17%] hidden md:table-cell">
                        Grape Variety
                      </TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[14%] hidden sm:table-cell">
                        Region
                      </TableHead>
                      <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground w-[10%] text-right">
                        Price
                      </TableHead>
                      <TableHead className="w-[13%]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wineryGroup.wines.map((wine, idx) => (
                      <TableRow
                        key={wine.id}
                        className={`wine-row transition-colors ${
                          wine.hotPrice
                            ? "bg-orange-50/60 hover:bg-orange-50"
                            : wine.soldOut
                              ? "opacity-60"
                              : ""
                        }`}
                        data-ocid={`wine.item.${idx + 1}`}
                      >
                        {/* Hot Price / Low Stock */}
                        <TableCell className="text-center px-1">
                          {wine.hotPrice && (
                            <span className="inline-flex flex-col items-center justify-center leading-none">
                              <span className="text-base leading-none">🔥</span>
                              <span
                                className="text-[8px] font-bold uppercase tracking-tight leading-none mt-0.5"
                                style={{ color: "#c05010" }}
                              >
                                HOT
                              </span>
                            </span>
                          )}
                          {(wine as any).lowStock && !wine.hotPrice && (
                            <span className="inline-flex flex-col items-center justify-center leading-none">
                              <span className="text-base leading-none">⚠️</span>
                              <span
                                className="text-[8px] font-bold uppercase tracking-tight leading-none mt-0.5"
                                style={{ color: "#92600a" }}
                              >
                                LOW
                              </span>
                            </span>
                          )}
                        </TableCell>

                        {/* Wine Name */}
                        <TableCell className="text-sm font-medium">
                          <span
                            className={
                              wine.soldOut
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {wine.wineName}
                          </span>
                          {wine.soldOut && (
                            <span className="ml-2 text-xs font-semibold text-destructive uppercase tracking-wide">
                              Sold Out
                            </span>
                          )}
                        </TableCell>

                        {/* Year */}
                        <TableCell className="text-sm text-center text-muted-foreground">
                          {wine.year ?? "—"}
                        </TableCell>

                        {/* Style */}
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${wineStyleDotColor(wine.wineStyle)}`}
                            />
                            {formatWineStyle(wine.wineStyle)}
                          </span>
                        </TableCell>

                        {/* Grape */}
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                          {wine.grapeVariety ?? "—"}
                        </TableCell>

                        {/* Region */}
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                          {wine.region ?? "—"}
                        </TableCell>

                        {/* Price */}
                        <TableCell className="text-sm font-semibold text-primary text-right">
                          {wine.price}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <NotesPopover
                              wineId={wine.id}
                              wineName={wine.wineName}
                              isAdmin={isAdmin}
                              getNote={getNote}
                              setNote={setNote}
                            />
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => openEdit(wine)}
                                  data-ocid="wine.edit_button"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => openDelete(wine)}
                                  data-ocid="wine.delete_button"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
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
        initialNotes={editWine ? getNote(editWine.id) : ""}
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
