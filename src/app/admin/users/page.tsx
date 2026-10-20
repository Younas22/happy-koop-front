import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { AdminUserManager } from "@/components/admin/AdminUserManager";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";
import { buildQuery } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Admin users",
    canonicalPath: "/admin/users",
    noindex: true,
  });
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const viewer = await requireAdmin("/admin/users");
  const config = await getRuntimeConfig();
  const params = await searchParams;

  const q = one(params.q).trim();
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAdminUsers({ q: q || null, page });

  return (
    <>
      <AdminPageHeader
        title="Users and roles"
        description="Accounts and the roles the API uses to authorize them."
      />

      <form
        method="get"
        action="/admin/users"
        className="surface-card mb-4 flex flex-wrap items-end gap-3 p-3"
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="user-q" className="mb-1 block text-xs font-medium text-ink-muted">
            Search name or email
          </label>
          <Input id="user-q" name="q" defaultValue={q} placeholder="Search users" />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/users">Clear</Link>
        </Button>
      </form>

      {error ? (
        <AdminError error={error} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title={q ? "No users match that search" : "No users found"}
          description={q ? "Try a different search term." : undefined}
        />
      ) : (
        <>
          <AdminUserManager
            users={data?.data ?? []}
            viewerId={viewer.id}
            locale={config.locale.locale}
            timeZone={config.locale.timezone}
          />

          {data ? (
            <Pagination
              className="mt-5"
              meta={data.meta}
              buildHref={(target) =>
                `/admin/users${buildQuery({ q: q || null, page: target <= 1 ? null : target })}`
              }
            />
          ) : null}
        </>
      )}
    </>
  );
}
