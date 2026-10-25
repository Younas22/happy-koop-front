"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface FooterColumnProps {
  heading: string;
  /** Renders the column as a `<nav>` landmark, for link lists. */
  landmark?: boolean;
  /** `dark` for the ink footer. */
  tone?: "light" | "dark";
  className?: string;
  children: React.ReactNode;
}

/**
 * A footer column that is a disclosure on a phone and a plain column from
 * `sm` up.
 *
 * Five stacked columns of links are a wall of text on a 360px screen, so each
 * one collapses behind its heading there. The breakpoint is handled in CSS
 * rather than by measuring the viewport: the content carries `sm:block`, so it
 * is open on a desktop in the server-rendered HTML and the toggle button is
 * hidden - no media-query effect, and nothing jumps after hydration.
 *
 * The heading stays an `<h2>` at both sizes; only the control inside it
 * changes.
 */
export function FooterColumn({
  heading,
  landmark = false,
  tone = "light",
  className,
  children,
}: FooterColumnProps) {
  const dark = tone === "dark";
  const [open, setOpen] = React.useState(false);
  const contentId = React.useId();

  const Wrapper = landmark ? "nav" : "div";

  return (
    <Wrapper
      aria-label={landmark ? heading : undefined}
      className={cn("border-b sm:border-b-0", dark ? "border-white/10" : "border-line", className)}
    >
      <h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={contentId}
          className={cn(
            "label-eyebrow flex min-h-12 w-full items-center justify-between gap-3 text-left sm:hidden",
            dark ? "text-ink-inverse" : "text-ink",
          )}
        >
          {heading}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform duration-200 ease-(--ease-standard)",
              dark ? "text-ink-inverse/60" : "text-ink-muted",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <span className={cn("label-eyebrow hidden sm:block", dark && "text-ink-inverse/55")}>
          {heading}
        </span>
      </h2>

      <div
        id={contentId}
        className={cn("pb-4 sm:mt-3 sm:block sm:pb-0", open ? "block" : "hidden")}
      >
        {children}
      </div>
    </Wrapper>
  );
}
