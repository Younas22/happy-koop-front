"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { selectableValueIds, type VariantSelection } from "@/lib/product/variants";
import type { ProductOption, ProductVariant } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface VariantSelectorProps {
  options: readonly ProductOption[];
  variants: readonly ProductVariant[];
  selection: VariantSelection;
  onChange: (optionId: number, valueId: number) => void;
}

/**
 * Variant option picker.
 *
 * Options and their values come straight from the API. The set of values that
 * is still reachable is derived from the real `variants` list, so no
 * combination is ever offered that the backend did not publish - and nothing
 * is synthesized from a cartesian product.
 *
 * A value that leads to no variant is rendered disabled rather than hidden,
 * so the customer can see the full range the product comes in.
 */
export function VariantSelector({ options, variants, selection, onChange }: VariantSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const reachable = selectableValueIds(variants, option.id, option, selection);
        const selectedId = selection[option.id];
        const selectedLabel = option.values.find((value) => value.id === selectedId)?.label ?? null;
        const groupId = `option-${option.id}`;

        return (
          <div key={option.id}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span id={groupId} className="text-sm font-medium text-ink">
                {option.name}
              </span>
              {selectedLabel ? (
                <span className="text-sm text-ink-muted">{selectedLabel}</span>
              ) : (
                <span className="text-sm text-ink-muted">Choose an option</span>
              )}
            </div>

            <div
              role="radiogroup"
              aria-labelledby={groupId}
              className="mt-2 flex flex-wrap gap-2"
            >
              {option.values.map((value) => {
                const selected = selectedId === value.id;
                const available = reachable.has(value.id);
                const hasSwatch = Boolean(value.swatchHex);

                return (
                  <button
                    key={value.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={!available || undefined}
                    disabled={!available}
                    onClick={() => onChange(option.id, value.id)}
                    title={available ? value.label : `${value.label} - not available`}
                    className={cn(
                      "tap-target inline-flex items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                      selected
                        ? "border-brand bg-brand-tint text-ink"
                        : "border-line-strong bg-surface text-ink hover:bg-sunken",
                      !available &&
                        "cursor-not-allowed border-line text-ink-subtle line-through hover:bg-surface",
                    )}
                  >
                    {hasSwatch ? (
                      <span
                        aria-hidden="true"
                        className="size-4 shrink-0 rounded-full border border-line-strong"
                        style={{ backgroundColor: value.swatchHex as string }}
                      />
                    ) : null}
                    <span>{value.label}</span>
                    {selected ? (
                      <Check className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
