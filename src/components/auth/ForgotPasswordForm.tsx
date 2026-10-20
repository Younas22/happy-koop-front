"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { postSameOrigin } from "@/lib/http/same-origin";
import type { OkResult } from "@/lib/types/api";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
});

type Values = z.infer<typeof schema>;

/**
 * Password reset request.
 *
 * NO ACCOUNT ENUMERATION: on any successful call the same confirmation is
 * shown, whether or not an account exists for that address. The wording never
 * claims an email was definitely sent to an existing account, and no field
 * error is attached from the response.
 *
 * Only a transport/throttle failure (status 0, 429, 5xx) is surfaced, because
 * that tells the customer their request did not reach us - it says nothing
 * about the address.
 */
export function ForgotPasswordForm() {
  const [done, setDone] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await postSameOrigin<OkResult>("/api/auth/forgot-password", values);

    if (!result.ok && (result.status === 0 || result.status === 429 || result.status >= 500)) {
      setFormError(result.error.message);
      return;
    }

    // Everything else - including a 422 from the API - lands on the same
    // neutral confirmation.
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-success-tint">
          <MailCheck className="size-5.5 text-success" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-ink">Check your email</h2>
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
          If an account exists for that address, we have sent a link to reset the password. The link
          expires after a short time, so use it soon.
        </p>
        <p className="mt-3 max-w-sm text-xs text-ink-subtle">
          For your security we do not confirm whether an account exists.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title="We could not send the request">
          {formError}
        </Alert>
      ) : null}

      <FormField
        id="forgot-email"
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

      <Button
        type="submit"
        block
        size="lg"
        loading={form.formState.isSubmitting}
        loadingLabel="Sending…"
      >
        Send reset link
      </Button>
    </form>
  );
}
