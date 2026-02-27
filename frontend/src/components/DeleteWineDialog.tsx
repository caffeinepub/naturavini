import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { Wine } from '../backend';

interface DeleteWineDialogProps {
  open: boolean;
  wine: Wine | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export default function DeleteWineDialog({
  open,
  wine,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteWineDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v && !isLoading) onClose(); }}>
      <AlertDialogContent className="bg-card border-border shadow-catalogue sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl text-foreground">
            Remove Wine
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-foreground">
              {wine?.wineName}
            </span>{' '}
            by{' '}
            <span className="font-semibold text-foreground">
              {wine?.winery}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="border-border"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
