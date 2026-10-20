import { FileX2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CmsPageNotFound() {
  return (
    <div className="page-container py-16">
      <EmptyState
        icon={FileX2}
        title="This page is not available"
        description="The page may be unpublished or the link may be out of date."
        action={
          <Button asChild>
            <Link href="/">Go to the home page</Link>
          </Button>
        }
      />
    </div>
  );
}
