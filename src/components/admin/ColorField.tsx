"use client";

import { Pipette, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { isValidHex } from "@/lib/utils/color";

export interface ColorFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string | null;
  /** The stored value: a `#rrggbb` string, or "" when not set. */
  value: string;
  onChange: (value: string) => void;
  /** Shown under the controls as one-tap options. */
  presets?: readonly string[];
}

/** What the native picker shows while the field is empty or half-typed. */
const PICKER_FALLBACK = "#2563EB";

/**
 * Colour field: a swatch that opens the operating system colour picker, next
 * to the hex code itself.
 *
 * Both halves edit the same value. Typing is not interrupted - a half-typed
 * `#25` stays exactly as typed and the swatch simply keeps the last valid
 * colour, because rewriting the input on every keystroke makes a hex field
 * impossible to edit. The picker always writes an uppercase `#rrggbb`, which
 * is the form the API validates.
 */
export function ColorField({
  id,
  label,
  description,
  error,
  value,
  onChange,
  presets,
}: ColorFieldProps) {
  const pickerId = `${id}-picker`;
  const valid = isValidHex(value);
  const swatch = valid ? value : PICKER_FALLBACK;

  return (
    <FormField id={id} label={label} description={description} error={error}>
      {(field) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* The native input is the picker. It is sized as the swatch
                itself, so the colour is both the preview and the control. */}
            <span className="relative inline-flex size-11 shrink-0">
              <label htmlFor={pickerId} className="sr-only">
                {label}: pick a colour
              </label>
              <input
                id={pickerId}
                type="color"
                value={swatch}
                onChange={(event) => onChange(event.target.value.toUpperCase())}
                className="size-11 cursor-pointer rounded-md border border-line-strong bg-surface p-1"
              />
              {valid ? null : (
                <Pipette
                  className="pointer-events-none absolute inset-0 m-auto size-4 text-ink-inverse mix-blend-difference"
                  aria-hidden="true"
                />
              )}
            </span>

            <Input
              {...field}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onBlur={() => {
                // Normalise only once the field is left, so "#2563eb" is
                // stored the way the API expects without fighting the typist.
                if (isValidHex(value)) onChange(value.trim().toUpperCase());
              }}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={7}
              placeholder={PICKER_FALLBACK}
              className="font-mono uppercase"
            />

            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange("")}
                title="Clear colour"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Clear {label}</span>
              </Button>
            ) : null}
          </div>

          {presets && presets.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {presets.map((preset) => {
                const selected = value.toUpperCase() === preset.toUpperCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange(preset.toUpperCase())}
                    aria-pressed={selected}
                    title={preset}
                    className={`size-7 rounded-full border-2 transition-transform ${
                      selected ? "border-ink scale-110" : "border-line-strong hover:scale-110"
                    }`}
                    style={{ backgroundColor: preset }}
                  >
                    <span className="sr-only">{preset}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </FormField>
  );
}
