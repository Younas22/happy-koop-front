import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** 404. Offers real navigation rather than guessing what was wanted. */
export default function NotFound() {
  return (
    <div className="page-container py-16">
      <EmptyState
        icon={SearchX}
        title="We could not find that page"
        description="The link may be out of date, or the item may no longer be available."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/shop">Browse the shop</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Go to the home page</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
