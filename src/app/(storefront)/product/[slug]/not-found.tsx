import { PackageX } from "lucide-react";
import { Link } from "@/i18n/Link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** A product slug that is not published, or no longer exists. */
export default function ProductNotFound() {
  return (
    <div className="page-container py-16">
      <EmptyState
        icon={PackageX}
        title="This product is not available"
        description="It may have been removed or is not currently published."
        action={
          <Button asChild>
            <Link href="/shop">Browse the shop</Link>
          </Button>
        }
      />
    </div>
  );
}
