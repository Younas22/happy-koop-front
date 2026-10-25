import { Skeleton } from "@/components/ui/Skeleton";

/** Product page shell. Mirrors the real layout so nothing jumps on load. */
export default function ProductLoading() {
  return (
    <div className="page-container py-5 sm:py-8" aria-busy="true">
      <span className="sr-only">Loading product</span>
      <Skeleton className="h-4 w-56" />
      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <Skeleton shape="block" className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-11 w-48" />
          <Skeleton className="h-12 w-full sm:w-64" />
        </div>
      </div>
    </div>
  );
}
