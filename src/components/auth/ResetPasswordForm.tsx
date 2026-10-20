"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import { postSameOrigin } from "@/lib/http/same-origin";
import type { OkResult } from "@/lib/types/api";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one number."),
    passwordConfirmation: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "The passwords do not match.",
    path: ["passwordConfirmation"],
  });

type Values = z.infer<typeof schema>;

const FIELDS = ["password", "passwordConfirmation"] as const;

/**
 * Sets a new password from an emailed link.
 *
 * `token` and `email` come from the link's query string and are forwarded
 * untouched; they are never written to storage. A successful reset does NOT
 * sign the customer in - they are sent to the sign-in page so the new password
 * is actually used.
 */
export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [done, setDone] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await postSameOrigin<OkResult>("/api/auth/reset-password", {
      token,
      email,
      password: values.password,
      passwordConfirmation: values.passwordConfirmation,
    });

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, FIELDS));
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-success-tint">
          <CheckCircle2 className="size-5.5 text-success" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-ink">Password updated</h2>
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
          You can now sign in with your new password.
        </p>
        <Button asChild className="mt-5">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title="We could not reset your password">
          {formError}
        </Alert>
      ) : null}

      <p className="text-sm text-ink-muted">
        Resetting the password for <span className="font-medium text-ink">{email}</span>.
      </p>

      <FormField
        id="reset-password"
        label="New password"
        required
        description="At least 8 characters, including a letter and a number."
        error={form.formState.errors.password?.message ?? null}
      >
        {(field) => (
          <Input
            {...field}
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        )}
      </FormField>

      <FormField
        id="reset-password-confirmation"
        label="Confirm new password"
        required
        error={form.formState.errors.passwordConfirmation?.message ?? null}
      >
        {(field) => (
          <Input
            {...field}
            type="password"
            autoComplete="new-password"
            {...form.register("passwordConfirmation")}
          />
        )}
      </FormField>

      <Button
        type="submit"
        block
        size="lg"
        loading={form.formState.isSubmitting}
        loadingLabel="Updating…"
      >
        Set new password
      </Button>
    </form>
  );
}
