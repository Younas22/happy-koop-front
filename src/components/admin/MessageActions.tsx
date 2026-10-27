"use client";

import { CheckCheck, Mail, Trash2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  deleteMessageAction,
  updateMessageStatusAction,
  type AdminActionResult,
} from "@/app/admin/actions";
import {
  reportBulkResult,
  useBulkSelection,
} from "@/components/admin/BulkSelection";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import type { AdminBulkResult, AdminContactMessage } from "@/lib/types/api";

/** Marks the selected messages handled. */
export function BulkMarkHandledButton({
  action,
}: {
  action: (ids: number[]) => Promise<AdminActionResult<AdminBulkResult>>;
}) {
  const router = useRouter();
  const { selected, clear } = useBulkSelection();
  const [busy, setBusy] = React.useState(false);

  async function run() {
    setBusy(true);
    const result = await action([...selected]);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    reportBulkResult(result.data, {
      done: (n) => `${n} ${n === 1 ? "message" : "messages"} marked handled.`,
      failed: (n) =>
        `${n} ${n === 1 ? "message" : "messages"} could not be updated.`,
    });
    clear();
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={busy}
      loadingLabel="Updating…"
      onClick={() => void run()}
    >
      <CheckCheck className="size-4" aria-hidden="true" />
      Mark handled
    </Button>
  );
}

/** Reply, mark handled / new and delete, on the message page. */
export function MessageActions({ message }: { message: AdminContactMessage }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handled = message.status === "handled";
  const replySubject = `Re: ${message.subject || "Your message"} [${message.reference}]`;
  const replyHref = `mailto:${message.email}?subject=${encodeURIComponent(replySubject)}`;

  async function toggle() {
    setBusy(true);
    const result = await updateMessageStatusAction(
      message.id,
      handled ? "new" : "handled",
    );
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    toast.success(handled ? "Marked as new." : "Marked as handled.");
    router.refresh();
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    setDeleteError(null);
    const result = await deleteMessageAction(message.id);
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleteOpen(false);
    toast.success("Message deleted.");
    router.push("/admin/messages");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <a href={replyHref}>
          <Mail className="size-4" aria-hidden="true" />
          Reply by email
        </a>
      </Button>
      <Button
        variant="secondary"
        loading={busy}
        loadingLabel="Saving…"
        onClick={() => void toggle()}
      >
        {handled ? (
          <Undo2 className="size-4" aria-hidden="true" />
        ) : (
          <CheckCheck className="size-4" aria-hidden="true" />
        )}
        {handled ? "Mark as new" : "Mark handled"}
      </Button>
      <Button
        variant="ghost"
        className="text-danger"
        onClick={() => {
          setDeleteError(null);
          setDeleteOpen(true);
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </Button>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this message?"
        recordName={`${message.name} - ${message.subject || "(no subject)"}`}
        description="It is removed permanently."
        confirmLabel="Delete message"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
