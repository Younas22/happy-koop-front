"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/Link";
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
import { useMessages } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";

function createSchema(t: Messages["auth"]) {
  return z
    .object({
      password: z
        .string()
        .min(8, t.passwordMin)
        .regex(/[A-Za-z]/, t.passwordLetter)
        .regex(/[0-9]/, t.passwordNumber),
      passwordConfirmation: z.string().min(1, t.confirmNewRequired),
    })
    .refine((value) => value.password === value.passwordConfirmation, {
      message: t.mismatch,
      path: ["passwordConfirmation"],
    });
}

type Values = z.infer<ReturnType<typeof createSchema>>;

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
  const t = useMessages().auth;
  const schema = React.useMemo(() => createSchema(t), [t]);
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
        <h2 className="text-title-md text-ink">{t.reset.doneTitle}</h2>
        <p className="mt-1.5 max-w-sm text-body-md text-ink-muted">{t.reset.doneBody}</p>
        <Button asChild className="mt-5">
          <Link href="/login">{t.reset.goSignIn}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title={t.reset.failed}>
          {formError}
        </Alert>
      ) : null}

      <p className="text-body-md text-ink-muted">
        {t.reset.forEmail.split("{email}")[0]}
        <span className="font-medium text-ink">{email}</span>
        {t.reset.forEmail.split("{email}")[1] ?? ""}
      </p>

      <FormField
        id="reset-password"
        label={t.reset.newPassword}
        required
        description={t.passwordHint}
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
        label={t.reset.confirm}
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
        loadingLabel={t.reset.submitting}
      >
        {t.reset.submit}
      </Button>
    </form>
  );
}
