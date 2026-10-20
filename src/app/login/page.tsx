import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";
import { safeInternalPath } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Sign in",
    canonicalPath: "/login",
    // Account screens are never indexed.
    noindex: true,
  });
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;

  /**
   * OPEN REDIRECT GUARD: `?next=` is only honoured when it is a root-relative
   * path. `safeInternalPath` rejects `//evil.com`, `https://evil.com` and
   * backslash tricks, falling back to the account dashboard.
   */
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeInternalPath(raw, "/account");

  // An already signed-in visitor has no business here.
  const viewer = await getViewer();
  if (viewer) {
    redirect(next);
  }

  return (
    <AuthShell
      title="Sign in"
      description="Access your orders, addresses and account details."
      footer={
        <div className="space-y-1.5">
          <p>
            <AuthFooterLink href="/forgot-password">Forgot your password?</AuthFooterLink>
          </p>
          <p>
            New here?{" "}
            <AuthFooterLink href={`/register?next=${encodeURIComponent(next)}`}>
              Create an account
            </AuthFooterLink>
          </p>
        </div>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
