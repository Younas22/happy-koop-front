"use client";

import { SlidersHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

export interface FilterSheetProps {
  /** Shown on the trigger, so the count is visible without opening it. */
  activeCount: number;
  /** The filter form. Rendered inside the sheet. */
  children: React.ReactNode;
  className?: string;
}

/**
 * The phone entry point to the filter panel: a Material 3 bottom sheet.
 *
 * On a phone the sidebar panel sat above the grid, which put the first
 * product most of a screen below the fold on every listing page. The panel
 * now lives behind one button, which is also where M3 puts filters.
 *
 * The form inside is a plain GET form, so submitting it is a real navigation
 * and the sheet leaves with the old document - no state to reset.
 */
export function FilterSheet({ activeCount, children, className }: FilterSheetProps) {
  const { filters: t } = useMessages();
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          type="button"
          variant={activeCount > 0 ? "secondary" : "outline"}
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t.title}
          {activeCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-label-md font-semibold text-brand-ink tabular-nums">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </div>

      <DrawerContent side="bottom" aria-describedby={undefined}>
        <DrawerHeader>
          <DrawerTitle className="text-title-lg text-ink">{t.title}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="pb-6">{children}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
