import { FolderX } from "lucide-react";
import { Link } from "@/i18n/Link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CategoryNotFound() {
  return (
    <div className="page-container py-16">
      <EmptyState
        icon={FolderX}
        title="This category is not available"
        description="It may have been renamed, removed or deactivated."
        action={
          <Button asChild>
            <Link href="/shop">Browse the shop</Link>
          </Button>
        }
      />
    </div>
  );
}
