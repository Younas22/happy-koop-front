import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader, AdminTableWrap, Td, Th } from "@/components/admin/AdminParts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAuditLogs } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDateTime } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";
import { buildQuery } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Audit log",
    canonicalPath: "/admin/audit-logs",
    noindex: true,
  });
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Audit log, read-only.
 *
 * Entries record changed key NAMES only - never values - so a settings write
 * can be audited without the log itself becoming a place secrets leak
 * (contract 8.2).
 */
export default async function AdminAuditLogsPage({ searchParams }: PageProps<"/admin/audit-logs">) {
  await requireAdmin("/admin/audit-logs");
  const config = await getRuntimeConfig();
  const params = await searchParams;

  const action = one(params.action).trim();
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAuditLogs({ action: action || null, page });
  const dateOptions = { locale: config.locale.locale, timeZone: config.locale.timezone };

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Who changed what, and when. Values are never recorded - only the names of the keys that changed."
      />

      <form
        method="get"
        action="/admin/audit-logs"
        className="surface-card mb-4 flex flex-wrap items-end gap-3 p-3"
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="audit-action" className="mb-1 block text-xs font-medium text-ink-muted">
            Filter by action
          </label>
          <Input
            id="audit-action"
            name="action"
            defaultValue={action}
            placeholder="e.g. settings.payments.updated"
          />
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/audit-logs">Clear</Link>
        </Button>
      </form>

      {error ? (
        <AdminError error={error} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title={action ? "No entries match that action" : "No audit entries yet"}
          description={
            action
              ? "Try a different action name."
              : "Administrative changes will be recorded here."
          }
        />
      ) : (
        <>
          <AdminTableWrap>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Action</Th>
                <Th>Actor</Th>
                <Th>Subject</Th>
                <Th>Changed keys</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap">
                    {formatDateTime(entry.createdAt, dateOptions) ?? "-"}
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-ink">{entry.action}</span>
                  </Td>
                  <Td>
                    {entry.actor ? (
                      <>
                        <span className="text-ink">{entry.actor.name}</span>
                        <span className="block break-words text-xs text-ink-muted">
                          {entry.actor.email}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-muted">System</span>
                    )}
                  </Td>
                  <Td>
                    {entry.subjectType ? (
                      <span className="text-xs text-ink-muted">
                        {entry.subjectType}
                        {entry.subjectId ? ` #${entry.subjectId}` : ""}
                      </span>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    {entry.changedKeys.length === 0 ? (
                      "-"
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {entry.changedKeys.map((key) => (
                          <Badge key={key} tone="neutral">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-ink-muted">{entry.ip ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>

          {data ? (
            <Pagination
              className="mt-5"
              meta={data.meta}
              buildHref={(target) =>
                `/admin/audit-logs${buildQuery({
                  action: action || null,
                  page: target <= 1 ? null : target,
                })}`
              }
            />
          ) : null}
        </>
      )}
    </>
  );
}
