import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Reset your password",
    canonicalPath: "/forgot-password",
    noindex: true,
  });
}

export default async function ForgotPasswordPage() {
  // Someone already signed in should change their password in the account
  // area, where the current password is required.
  const viewer = await getViewer();
  if (viewer) {
    redirect("/account/profile");
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email address on your account and we will send a reset link."
      footer={
        <p>
          Remembered it? <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
