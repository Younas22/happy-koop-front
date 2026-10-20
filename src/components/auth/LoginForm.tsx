"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import { postSameOrigin } from "@/lib/http/same-origin";
import type { SessionResult } from "@/lib/types/api";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type Values = z.infer<typeof schema>;

const FIELDS = ["email", "password"] as const;

/**
 * Sign-in form.
 *
 * Posts to the same-origin `POST /api/auth/login`, which calls Laravel and
 * writes the bearer token into the HttpOnly `hk_session` cookie. The token is
 * never returned to this component.
 *
 * The server's 422 message for bad credentials is shown exactly as received -
 * the API deliberately returns the same text for an unknown address and a
 * wrong password, so nothing here may reword it or hint at which was wrong.
 *
 * `next` has already been validated as a relative path by the page
 * (`safeInternalPath`), so it cannot be an off-site redirect.
 */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await postSameOrigin<SessionResult>("/api/auth/login", values);

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, FIELDS));
      return;
    }

    // A full navigation so every Server Component re-reads the session cookie.
    router.replace(next);
    router.refresh();
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title="We could not sign you in">
          {formError}
        </Alert>
      ) : null}

      <FormField
        id="login-email"
        label="Email address"
        required
        error={form.formState.errors.email?.message ?? null}
      >
        {(field) => (
          <Input
            {...field}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            {...form.register("email")}
          />
        )}
      </FormField>

      <FormField
        id="login-password"
        label="Password"
        required
        error={form.formState.errors.password?.message ?? null}
      >
        {(field) => (
          <Input
            {...field}
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
        )}
      </FormField>

      <Button type="submit" block size="lg" loading={submitting} loadingLabel="Signing in…">
        Sign in
      </Button>
    </form>
  );
}
