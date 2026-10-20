import type { Metadata } from "next";
import Link from "next/link";

import { PasswordForm } from "@/components/account/PasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchProfile } from "@/lib/account/queries";
import { requireViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Profile",
    canonicalPath: "/account/profile",
    noindex: true,
  });
}

export default async function AccountProfilePage() {
  await requireViewer("/account/profile");
  const { data: profile, error } = await fetchProfile();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardBody>
          {profile ? (
            <ProfileForm profile={profile} />
          ) : (
            <ErrorState
              title="We could not load your profile"
              message={error?.message ?? null}
              unreachable={error?.isUnreachable() ?? false}
              className="border-0 px-0 py-6"
              action={
                <Button asChild variant="secondary">
                  <Link href="/account/profile">Try again</Link>
                </Button>
              }
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardBody>
          {/* Works independently of the profile read: changing a password does
              not need the current profile to have loaded. */}
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
