import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { MessageActions } from "@/components/admin/MessageActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { fetchAdminMessage } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Message",
    canonicalPath: "/admin/messages",
    noindex: true,
  });
}

export default async function AdminMessagePage({
  params,
}: PageProps<"/admin/messages/[id]">) {
  await requireAdmin("/admin/messages");
  const { id } = await params;
  const messageId = Number.parseInt(id, 10);

  if (!Number.isFinite(messageId) || messageId <= 0) {
    notFound();
  }

  const config = await getRuntimeConfig();
  const { data: message, error } = await fetchAdminMessage(messageId);

  if (error?.isNotFound()) {
    notFound();
  }

  if (error || !message) {
    return (
      <>
        <AdminPageHeader title="Message" />
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/messages">Back to messages</Link>
            </Button>
          }
        />
      </>
    );
  }

  const dateOptions = {
    locale: config.locale.locale,
    timeZone: config.locale.timezone,
  };

  return (
    <>
      <AdminPageHeader
        title={message.subject || "(no subject)"}
        description={`From ${message.name} · ${message.reference}`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/messages">All messages</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            {/* Plain text, as the visitor typed it; React escapes it. */}
            <p className="text-body-md leading-relaxed whitespace-pre-wrap break-words text-ink">
              {message.message}
            </p>
            <MessageActions message={message} />
          </CardBody>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-ink-muted">Status</dt>
                <dd className="mt-0.5">
                  <Badge tone={message.status === "new" ? "info" : "neutral"}>
                    {message.status === "new" ? "New" : "Handled"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Name</dt>
                <dd className="text-ink">{message.name}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Email</dt>
                <dd className="break-all">
                  <a
                    href={`mailto:${message.email}`}
                    className="text-brand hover:underline"
                  >
                    {message.email}
                  </a>
                </dd>
              </div>
              {message.userId ? (
                <div>
                  <dt className="text-ink-muted">Account</dt>
                  <dd>
                    <Link
                      href={`/admin/customers/${message.userId}`}
                      className="text-brand hover:underline"
                    >
                      View customer
                    </Link>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-ink-muted">Received</dt>
                <dd className="text-ink">
                  {formatDate(message.receivedAt, dateOptions) ?? "-"}
                </dd>
              </div>
              {message.handledAt ? (
                <div>
                  <dt className="text-ink-muted">Handled</dt>
                  <dd className="text-ink">
                    {formatDate(message.handledAt, dateOptions) ?? "-"}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-ink-muted">Reference</dt>
                <dd className="font-mono text-ink">{message.reference}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
