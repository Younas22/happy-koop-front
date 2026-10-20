import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";
import { safeInternalPath } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Create an account",
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
    redirect(next);
  }

  return (
    <AuthShell
      title="Create an account"
      description="Keep track of your orders and save addresses for next time."
      footer={
        <p>
          Already have an account?{" "}
          <AuthFooterLink href={`/login?next=${encodeURIComponent(next)}`}>Sign in</AuthFooterLink>
        </p>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
