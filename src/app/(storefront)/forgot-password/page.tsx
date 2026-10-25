import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getI18n, localized } from "@/i18n/server";
import { getViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.auth.forgot.metaTitle,
    locale,
    canonicalPath: "/forgot-password",
    noindex: true,
  });
}

export default async function ForgotPasswordPage() {
  // Someone already signed in should change their password in the account
  // area, where the current password is required.
  const viewer = await getViewer();
  if (viewer) {
    redirect(await localized("/account/profile"));
  }

  const { m } = await getI18n();
  const t = m.auth.forgot;

  return (
    <AuthShell
      title={t.title}
      description={t.description}
      footer={
        <p>
          {t.remembered} <AuthFooterLink href="/login">{t.back}</AuthFooterLink>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
