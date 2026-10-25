"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import { postSameOrigin } from "@/lib/http/same-origin";
import type { SessionResult } from "@/lib/types/api";
import { useLocalizedRouter, useMessages } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";

/** Mirrors the API's own password rule: at least 8 chars, a letter and a digit. */
function createSchema(t: Messages["auth"]) {
  return z
    .object({
      name: z.string().trim().min(2, t.nameRequired).max(120),
      email: z.string().trim().min(1, t.emailRequired).email(t.emailInvalid),
      password: z
        .string()
        .min(8, t.passwordMin)
        .regex(/[A-Za-z]/, t.passwordLetter)
        .regex(/[0-9]/, t.passwordNumber),
      passwordConfirmation: z.string().min(1, t.confirmRequired),
      acceptsMarketing: z.boolean(),
    })
    .refine((value) => value.password === value.passwordConfirmation, {
      message: t.mismatch,
      path: ["passwordConfirmation"],
    });
}

type Values = z.infer<ReturnType<typeof createSchema>>;

const FIELDS = ["name", "email", "password", "passwordConfirmation", "acceptsMarketing"] as const;

export function RegisterForm({ next }: { next: string }) {
  const router = useLocalizedRouter();
  const t = useMessages().auth;
  const schema = React.useMemo(() => createSchema(t), [t]);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      acceptsMarketing: false,
    },
  });

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await postSameOrigin<SessionResult>("/api/auth/register", values);

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, FIELDS));
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title={t.register.failed}>
          {formError}
        </Alert>
      ) : null}

      <FormField
        id="register-name"
        label={t.name}
        required
        error={form.formState.errors.name?.message ?? null}
      >
        {(field) => <Input {...field} autoComplete="name" {...form.register("name")} />}
      </FormField>

      <FormField
        id="register-email"
        label={t.email}
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
        id="register-password"
        label={t.password}
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
        id="register-password-confirmation"
        label={t.register.confirm}
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

      <CheckboxField
        id="register-accepts-marketing"
        label={t.marketing}
        checked={form.watch("acceptsMarketing")}
        onCheckedChange={(checked) => form.setValue("acceptsMarketing", checked === true)}
      />

      <Button
        type="submit"
        block
        size="lg"
        loading={form.formState.isSubmitting}
        loadingLabel={t.register.submitting}
      >
        {t.register.submit}
      </Button>
    </form>
  );
}
