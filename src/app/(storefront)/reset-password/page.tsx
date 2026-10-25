import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getI18n, localized } from "@/i18n/server";
import { getViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";
import { Link } from "@/i18n/Link";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.auth.reset.metaTitle,
    locale,
    canonicalPath: "/reset-password",
    noindex: true,
  });
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const viewer = await getViewer();
  if (viewer) {
    redirect(await localized("/account/profile"));
  }

  const { m } = await getI18n();
  const t = m.auth.reset;

  const params = await searchParams;
  const token = first(params.token).trim();
  const email = first(params.email).trim();

  // The link is incomplete: say so instead of showing a form that cannot work.
  if (!token || !email) {
    return (
      <AuthShell title={t.title}>
        <Alert tone="danger" title={t.incompleteTitle}>
          {t.incompleteBody}
        </Alert>
        <Button asChild className="mt-4" block>
          <Link href="/forgot-password">{t.requestNew}</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t.title}
      footer={
        <p>
          <AuthFooterLink href="/login">{t.back}</AuthFooterLink>
        </p>
      }
    >
      <ResetPasswordForm token={token} email={email} />
    </AuthShell>
  );
}
