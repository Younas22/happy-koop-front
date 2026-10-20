"use client";

import * as React from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

/**
 * Confirmation for a destructive admin action.
 *
 * It always NAMES the record and says what happens, so no irreversible change
 * is one stray click away. The dialog is a Radix dialog, so focus is trapped,
 * Escape closes it and the title/description are announced.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  recordName,
  description,
  confirmLabel = "Delete",
  busy = false,
  error = null,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** The exact record being affected, shown verbatim. */
  recordName: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-ink">{recordName}</span>
            {description ? <span className="mt-1 block">{description}</span> : null}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <DialogBody>
            <Alert tone="danger" live title="That did not work">
              {error}
            </Alert>
          </DialogBody>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} loadingLabel="Working…" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
