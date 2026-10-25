"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface AppBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Material 3 top app bar.
 *
 * M3 app bars are flat while the page is at the top and lift to a tonal,
 * elevated surface once the content scrolls under them - that transition is
 * the whole point of the component, because it is what tells you the bar is
 * floating above the page rather than part of it.
 *
 * This is the only client code in the header: the brand mark and the
 * navigation stay in the server-rendered shell and are passed in as children.
 * The listener is passive and only flips a boolean, so it does no layout work
 * on scroll.
 */
export function AppBar({ children, className }: AppBarProps) {
  const [lifted, setLifted] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-lifted={lifted || undefined}
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-200 ease-(--ease-standard)",
        "border-b bg-surface/90 backdrop-blur-md backdrop-saturate-150",
        lifted ? "border-line bg-surface-container/95 elevation-2" : "border-transparent",
        className,
      )}
    >
      {children}
    </header>
  );
}
