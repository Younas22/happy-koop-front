import { Skeleton } from "@/components/ui/Skeleton";

/** Root loading shell: a neutral page frame, no fake content. */
export default function Loading() {
  return (
    <div className="page-container py-8" aria-busy="true">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-5 w-40" />
      <Skeleton shape="block" className="mt-4 h-64 sm:h-80" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} shape="block" className="h-56" />
        ))}
      </div>
    </div>
  );
}
