import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getI18n, localized } from "@/i18n/server";
import { getViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";
import { safeInternalPath } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.auth.register.metaTitle,
    locale,
    canonicalPath: "/register",
    noindex: true,
  });
}

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  // Same relative-path-only guard as the sign-in screen.
  const next = safeInternalPath(raw, "/account");

  const viewer = await getViewer();
  if (viewer) {
    redirect(await localized(next));
  }

  const { m } = await getI18n();
  const t = m.auth.register;

  return (
    <AuthShell
      title={t.title}
      description={t.description}
      footer={
        <p>
          {t.haveAccount}{" "}
          <AuthFooterLink href={`/login?next=${encodeURIComponent(next)}`}>{t.signIn}</AuthFooterLink>
        </p>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
