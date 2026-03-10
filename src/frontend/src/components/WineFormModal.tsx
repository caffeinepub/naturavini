import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Wine } from "../backend";
import { WineStyle } from "../backend";

export interface WineFormData {
  country: string;
  region: string;
  winery: string;
  wineName: string;
  year: string;
  grapeVariety: string;
  wineStyle: WineStyle;
  price: string;
  soldOut: boolean;
  hotPrice: boolean;
  notes: string;
}

interface WineFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WineFormData) => Promise<void>;
  initialData?: Wine | null;
  initialNotes?: string;
  isLoading?: boolean;
  error?: string | null;
}

const WINE_STYLE_OPTIONS: { value: WineStyle; label: string }[] = [
  { value: WineStyle.red, label: "Red" },
  { value: WineStyle.white, label: "White" },
  { value: WineStyle.rose, label: "Rosé" },
  { value: WineStyle.sparkling, label: "Sparkling" },
  { value: WineStyle.orange, label: "Orange" },
  { value: WineStyle.petNat, label: "Pét-Nat" },
];

const EUROPEAN_COUNTRIES = [
  "Albania",
  "Andorra",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "United Kingdom",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: string[] = [];
for (let y = CURRENT_YEAR; y >= 1970; y--) {
  YEAR_OPTIONS.push(String(y));
}

const EMPTY_FORM: WineFormData = {
  country: "",
  region: "",
  winery: "",
  wineName: "",
  year: "",
  grapeVariety: "",
  wineStyle: WineStyle.red,
  price: "",
  soldOut: false,
  hotPrice: false,
  notes: "",
};

export default function WineFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  initialNotes = "",
  isLoading = false,
  error = null,
}: WineFormModalProps) {
  const [form, setForm] = useState<WineFormData>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          country: initialData.country,
          region: initialData.region ?? "",
          winery: initialData.winery,
          wineName: initialData.wineName,
          year: initialData.year ?? "",
          grapeVariety: initialData.grapeVariety ?? "",
          wineStyle: initialData.wineStyle,
          price: initialData.price,
          soldOut: initialData.soldOut ?? false,
          hotPrice: initialData.hotPrice ?? false,
          notes: initialNotes,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setValidationError(null);
    }
  }, [open, initialData, initialNotes]);

  const handleChange =
    (field: keyof WineFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setValidationError(null);
    };

  const handleSelectChange = (field: keyof WineFormData) => (value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === "__none__" ? "" : value,
    }));
    setValidationError(null);
  };

  const handleCheckboxChange =
    (field: "soldOut" | "hotPrice") => (checked: boolean | "indeterminate") => {
      setForm((prev) => ({ ...prev, [field]: checked === true }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.country.trim() ||
      !form.winery.trim() ||
      !form.wineName.trim() ||
      !form.price.trim()
    ) {
      setValidationError("Country, Winery, Wine Name, and Price are required.");
      return;
    }
    await onSubmit(form);
  };

  const displayError = validationError || error;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isLoading) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl bg-[oklch(0.99_0.008_80)] border border-border shadow-catalogue max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            {isEditing ? "Edit Wine" : "Add New Wine"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isEditing
              ? "Update the details for this wine entry."
              : "Fill in the details to add a new wine to the price list."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Country + Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="country"
                className="text-foreground font-medium text-sm"
              >
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.country || "__none__"}
                onValueChange={handleSelectChange("country")}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="country"
                  className="bg-white border-border focus:ring-primary w-full"
                  data-ocid="wine.select"
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border max-h-60">
                  <SelectItem value="__none__" disabled>
                    Select country
                  </SelectItem>
                  {EUROPEAN_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="region"
                className="text-foreground font-medium text-sm"
              >
                Region
              </Label>
              <Input
                id="region"
                value={form.region}
                onChange={handleChange("region")}
                placeholder="e.g. Dalmatia"
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Winery */}
          <div className="space-y-1.5">
            <Label
              htmlFor="winery"
              className="text-foreground font-medium text-sm"
            >
              Winery <span className="text-destructive">*</span>
            </Label>
            <Input
              id="winery"
              value={form.winery}
              onChange={handleChange("winery")}
              placeholder="e.g. Bibich"
              disabled={isLoading}
              className="bg-white border-border focus-visible:ring-primary"
            />
          </div>

          {/* Wine Name + Year */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label
                htmlFor="wineName"
                className="text-foreground font-medium text-sm"
              >
                Wine Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wineName"
                value={form.wineName}
                onChange={handleChange("wineName")}
                placeholder="e.g. R6 Riserva"
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="year"
                className="text-foreground font-medium text-sm"
              >
                Year
              </Label>
              <Select
                value={form.year || "__none__"}
                onValueChange={handleSelectChange("year")}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="year"
                  className="bg-white border-border focus:ring-primary w-full"
                  data-ocid="wine.year.select"
                >
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border max-h-60">
                  <SelectItem value="__none__">— No year —</SelectItem>
                  <SelectItem value="NV">NV</SelectItem>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grape Variety + Wine Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="grapeVariety"
                className="text-foreground font-medium text-sm"
              >
                Grape Variety
              </Label>
              <Input
                id="grapeVariety"
                value={form.grapeVariety}
                onChange={handleChange("grapeVariety")}
                placeholder="e.g. Babić"
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="wineStyle"
                className="text-foreground font-medium text-sm"
              >
                Wine Style <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.wineStyle}
                onValueChange={handleSelectChange("wineStyle")}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="wineStyle"
                  className="bg-white border-border focus:ring-primary w-full"
                  data-ocid="wine.style.select"
                >
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border">
                  {WINE_STYLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label
              htmlFor="price"
              className="text-foreground font-medium text-sm"
            >
              Price <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              value={form.price}
              onChange={handleChange("price")}
              placeholder="e.g. 150 HRK"
              disabled={isLoading}
              className="bg-white border-border focus-visible:ring-primary"
            />
          </div>

          {/* Tasting Notes */}
          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="text-foreground font-medium text-sm"
            >
              Tasting Notes
            </Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={handleChange("notes")}
              placeholder="e.g. Earthy, cherry notes, long finish..."
              disabled={isLoading}
              rows={3}
              className="bg-white border-border focus-visible:ring-primary resize-none text-sm"
              data-ocid="wine.textarea"
            />
          </div>

          {/* Flags: Hot Price + Sold Out */}
          <div className="space-y-2">
            {/* Hot Price */}
            <div className="flex items-center gap-3 rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
              <Checkbox
                id="hotPrice"
                checked={form.hotPrice}
                onCheckedChange={handleCheckboxChange("hotPrice")}
                disabled={isLoading}
                className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                data-ocid="wine.hotprice.checkbox"
              />
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor="hotPrice"
                  className="text-orange-800 font-medium text-sm cursor-pointer leading-none flex items-center gap-1.5"
                >
                  <span>🔥</span> Mark as Hot Price
                </Label>
                <p className="text-orange-700/70 text-xs">
                  Highlights this wine with a "Hot Price" badge on the list.
                </p>
              </div>
            </div>

            {/* Sold Out */}
            <div className="flex items-center gap-3 rounded-md border border-border bg-white px-4 py-3">
              <Checkbox
                id="soldOut"
                checked={form.soldOut}
                onCheckedChange={handleCheckboxChange("soldOut")}
                disabled={isLoading}
                className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                data-ocid="wine.soldout.checkbox"
              />
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor="soldOut"
                  className="text-foreground font-medium text-sm cursor-pointer leading-none"
                >
                  Mark as Sold Out
                </Label>
                <p className="text-muted-foreground text-xs">
                  This wine will be flagged as sold out in the list and PDF
                  export.
                </p>
              </div>
            </div>
          </div>

          {displayError && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
              {displayError}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-border"
              data-ocid="wine.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              data-ocid="wine.submit_button"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Wine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
