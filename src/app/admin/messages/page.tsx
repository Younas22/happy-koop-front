import type { Metadata } from "next";
import Link from "next/link";

import {
  bulkDeleteMessagesAction,
  bulkMarkMessagesHandledAction,
} from "@/app/admin/actions";
import {
  AdminError,
  AdminPageHeader,
  AdminTableWrap,
  Td,
  Th,
} from "@/components/admin/AdminParts";
import {
  BulkActionBar,
  BulkDeleteButton,
  BulkSelectAll,
  BulkSelection,
  BulkSelectRow,
} from "@/components/admin/BulkSelection";
import { BulkMarkHandledButton } from "@/components/admin/MessageActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminMessages } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { ContactMessageStatus } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";
import { buildQuery } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Messages",
    canonicalPath: "/admin/messages",
    noindex: true,
  });
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const STATUSES: readonly ContactMessageStatus[] = ["new", "handled"];

/**
 * Contact form messages.
 *
 * The database record is the source of truth - the emails are only copies -
 * so every message sent through /contact is listed here, newest first.
 */
export default async function AdminMessagesPage({
  searchParams,
}: PageProps<"/admin/messages">) {
  await requireAdmin("/admin/messages");
  const config = await getRuntimeConfig();
  const params = await searchParams;

  const q = one(params.q).trim();
  const statusRaw = one(params.status);
  const status = (STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as ContactMessageStatus)
    : null;
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAdminMessages({
    q: q || null,
    status,
    page,
  });

  const buildHref = (overrides: Record<string, string | number | null>) =>
    `/admin/messages${buildQuery({ q: q || null, status, ...overrides })}`;
  const dateOptions = {
    locale: config.locale.locale,
    timeZone: config.locale.timezone,
  };

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description={
          data && data.newCount > 0
            ? `Sent through the contact form. ${data.newCount} new.`
            : "Sent through the contact form."
        }
      />

      <form
        method="get"
        action="/admin/messages"
        className="surface-card mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_12rem_auto]"
      >
        <div>
          <label
            htmlFor="message-q"
            className="mb-1 block text-xs font-medium text-ink-muted"
          >
            Search name, email, subject or reference
          </label>
          <Input
            id="message-q"
            name="q"
            defaultValue={q}
            placeholder="Search messages"
          />
        </div>
        <div>
          <label
            htmlFor="message-status"
            className="mb-1 block text-xs font-medium text-ink-muted"
          >
            Status
          </label>
          <select
            id="message-status"
            name="status"
            defaultValue={status ?? ""}
            className="h-12 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="handled">Handled</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/messages">Clear</Link>
          </Button>
        </div>
      </form>

      {error ? (
        <AdminError error={error} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title={q || status ? "No messages match" : "No messages yet"}
          description={
            q || status
              ? "Try a different search or clear the filters."
              : "Messages sent through the contact form will appear here."
          }
        />
      ) : (
        <BulkSelection ids={(data?.data ?? []).map((message) => message.id)}>
          <BulkActionBar>
            <BulkMarkHandledButton action={bulkMarkMessagesHandledAction} />
            <BulkDeleteButton
              action={bulkDeleteMessagesAction}
              singular="message"
              plural="messages"
              description="They are removed permanently. Replies you already sent are not affected."
            />
          </BulkActionBar>
          <AdminTableWrap>
            <thead>
              <tr>
                <Th className="w-10">
                  <BulkSelectAll />
                </Th>
                <Th>From</Th>
                <Th>Message</Th>
                <Th>Received</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((message) => {
                const unread = message.status === "new";
                return (
                  <tr key={message.id}>
                    <Td>
                      <BulkSelectRow
                        id={message.id}
                        label={`Select message from ${message.name}`}
                      />
                    </Td>
                    <Td>
                      <span
                        className={
                          unread ? "font-semibold text-ink" : "text-ink"
                        }
                      >
                        {message.name}
                      </span>
                      <span className="block text-xs break-all text-ink-muted">
                        {message.email}
                      </span>
                    </Td>
                    <Td className="max-w-md">
                      <Link
                        href={`/admin/messages/${message.id}`}
                        className={`hover:underline ${unread ? "font-semibold text-ink" : "text-ink"}`}
                      >
                        {message.subject || "(no subject)"}
                      </Link>
                      <span className="block truncate text-xs text-ink-muted">
                        {message.preview}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDate(message.receivedAt, dateOptions) ?? "-"}
                    </Td>
                    <Td>
                      <Badge tone={unread ? "info" : "neutral"}>
                        {unread ? "New" : "Handled"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/messages/${message.id}`}>Open</Link>
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>

          {data ? (
            <Pagination
              className="mt-5"
              meta={data.meta}
              buildHref={(target) =>
                buildHref({ page: target <= 1 ? null : target })
              }
            />
          ) : null}
        </BulkSelection>
      )}
    </>
  );
}
