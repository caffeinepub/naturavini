import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import type { Wine } from '../backend';
import { WineStyle } from '../backend';

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
}

interface WineFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WineFormData) => Promise<void>;
  initialData?: Wine | null;
  isLoading?: boolean;
  error?: string | null;
}

const WINE_STYLE_OPTIONS: { value: WineStyle; label: string }[] = [
  { value: WineStyle.red, label: 'Red' },
  { value: WineStyle.white, label: 'White' },
  { value: WineStyle.rose, label: 'Rosé' },
  { value: WineStyle.sparkling, label: 'Sparkling' },
  { value: WineStyle.orange, label: 'Orange' },
  { value: WineStyle.petNat, label: 'Pét-Nat' },
];

const EMPTY_FORM: WineFormData = {
  country: '',
  region: '',
  winery: '',
  wineName: '',
  year: '',
  grapeVariety: '',
  wineStyle: WineStyle.red,
  price: '',
  soldOut: false,
};

export default function WineFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
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
          region: initialData.region ?? '',
          winery: initialData.winery,
          wineName: initialData.wineName,
          year: initialData.year ?? '',
          grapeVariety: initialData.grapeVariety ?? '',
          wineStyle: initialData.wineStyle,
          price: initialData.price,
          soldOut: initialData.soldOut ?? false,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setValidationError(null);
    }
  }, [open, initialData]);

  const handleChange = (field: keyof WineFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setValidationError(null);
  };

  const handleSelectChange = (field: keyof WineFormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleSoldOutChange = (checked: boolean | 'indeterminate') => {
    setForm((prev) => ({ ...prev, soldOut: checked === true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.country.trim() || !form.winery.trim() || !form.wineName.trim() || !form.price.trim()) {
      setValidationError('Country, Winery, Wine Name, and Price are required.');
      return;
    }
    await onSubmit(form);
  };

  const displayError = validationError || error;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-[oklch(0.99_0.008_80)] border border-border shadow-catalogue">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            {isEditing ? 'Edit Wine' : 'Add New Wine'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isEditing
              ? 'Update the details for this wine entry.'
              : 'Fill in the details to add a new wine to the price list.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Country + Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-foreground font-medium text-sm">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                value={form.country}
                onChange={handleChange('country')}
                placeholder="e.g. Croatia"
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region" className="text-foreground font-medium text-sm">
                Region
              </Label>
              <Input
                id="region"
                value={form.region}
                onChange={handleChange('region')}
                placeholder="e.g. Dalmatia"
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Winery */}
          <div className="space-y-1.5">
            <Label htmlFor="winery" className="text-foreground font-medium text-sm">
              Winery <span className="text-destructive">*</span>
            </Label>
            <Input
              id="winery"
              value={form.winery}
              onChange={handleChange('winery')}
              placeholder="e.g. Bibich"
              disabled={isLoading}
              className="bg-white border-border focus-visible:ring-primary"
            />
          </div>

          {/* Wine Name + Year */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="wineName" className="text-foreground font-medium text-sm">
                Wine Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wineName"
                value={form.wineName}
                onChange={handleChange('wineName')}
                placeholder="e.g. R6 Riserva"
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year" className="text-foreground font-medium text-sm">
                Year
              </Label>
              <Input
                id="year"
                value={form.year}
                onChange={handleChange('year')}
                placeholder="e.g. 2022"
                maxLength={4}
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Grape Variety + Wine Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="grapeVariety" className="text-foreground font-medium text-sm">
                Grape Variety
              </Label>
              <Input
                id="grapeVariety"
                value={form.grapeVariety}
                onChange={handleChange('grapeVariety')}
                placeholder="e.g. Babić"
                disabled={isLoading}
                className="bg-white border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wineStyle" className="text-foreground font-medium text-sm">
                Wine Style <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.wineStyle}
                onValueChange={handleSelectChange('wineStyle')}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="wineStyle"
                  className="bg-white border-border focus:ring-primary w-full"
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
            <Label htmlFor="price" className="text-foreground font-medium text-sm">
              Price <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              value={form.price}
              onChange={handleChange('price')}
              placeholder="e.g. 150 HRK"
              disabled={isLoading}
              className="bg-white border-border focus-visible:ring-primary"
            />
          </div>

          {/* Sold Out toggle */}
          <div className="flex items-center gap-3 rounded-md border border-border bg-white px-4 py-3">
            <Checkbox
              id="soldOut"
              checked={form.soldOut}
              onCheckedChange={handleSoldOutChange}
              disabled={isLoading}
              className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
            />
            <div className="flex flex-col gap-0.5">
              <Label
                htmlFor="soldOut"
                className="text-foreground font-medium text-sm cursor-pointer leading-none"
              >
                Mark as Sold Out
              </Label>
              <p className="text-muted-foreground text-xs">
                This wine will be flagged as sold out in the list and PDF export.
              </p>
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Wine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
