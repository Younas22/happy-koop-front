"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { cn } from "@/lib/utils/cn";

const INTERVAL_MS = 5000;

/**
 * Hero image slider.
 *
 * Advances on its own every few seconds and has previous/next arrows and dots.
 * Autoplay pauses while the pointer is over the slider or focus is inside it,
 * and never starts for visitors who prefer reduced motion. Only the first
 * slide is loaded with priority; the rest load lazily.
 */
export function HeroSlider({ images }: { images: readonly string[] }) {
  const { home: t } = useMessages();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const count = images.length;
  const current = count === 0 ? 0 : index % count;

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [count, paused, reducedMotion]);

  const go = (delta: number) =>
    setIndex((i) => (((i + delta) % count) + count) % count);

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t.heroSlides}
      className="group absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setPaused(false);
      }}
      onKeyDown={(event) => {
        if (count < 2) return;
        if (event.key === "ArrowLeft") go(-1);
        if (event.key === "ArrowRight") go(1);
      }}
    >
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          aria-roledescription="slide"
          aria-label={fmt(t.heroGoTo, { index: i + 1, total: count })}
          aria-hidden={i !== current}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-(--ease-standard) motion-reduce:transition-none",
            i === current ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ))}

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.heroPrevious}
            className="tap-target absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.heroNext}
            className="tap-target absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
            {images.map((src, i) => (
              <button
                key={`dot-${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={fmt(t.heroGoTo, { index: i + 1, total: count })}
                aria-current={i === current}
                className="flex size-6 items-center justify-center"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full bg-surface shadow transition-all duration-300 motion-reduce:transition-none",
                    i === current ? "w-6 opacity-100" : "w-2 opacity-60",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
