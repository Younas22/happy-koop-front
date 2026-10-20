"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { deleteProductAction } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/Button";

/** Soft-deletes a product, behind a confirmation that names it. */
export function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);

    const result = await deleteProductAction(id);
    setBusy(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setOpen(false);
    toast.success("Product deleted.");
    router.push("/admin/products");
  }

  return (
    <>
      <Button variant="ghost" className="text-danger" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this product?"
        recordName={name}
        description="It is removed from the storefront and the admin list. Orders that contain it keep their own item snapshots, so order history is unaffected."
        confirmLabel="Delete product"
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
