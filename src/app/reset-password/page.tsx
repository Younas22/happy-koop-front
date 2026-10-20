import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Set a new password",
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
    redirect("/account/profile");
  }

  const params = await searchParams;
  const token = first(params.token).trim();
  const email = first(params.email).trim();

  // The link is incomplete: say so instead of showing a form that cannot work.
  if (!token || !email) {
    return (
      <AuthShell title="Set a new password">
        <Alert tone="danger" title="This reset link is not complete">
          The link is missing the information needed to reset a password. Request a new one and open
          the most recent email.
        </Alert>
        <Button asChild className="mt-4" block>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      footer={
        <p>
          <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
        </p>
      }
    >
      <ResetPasswordForm token={token} email={email} />
    </AuthShell>
  );
}
