"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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

/** Mirrors the API's own password rule: at least 8 chars, a letter and a digit. */
const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(120),
    email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one number."),
    passwordConfirmation: z.string().min(1, "Confirm your password."),
    acceptsMarketing: z.boolean(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "The passwords do not match.",
    path: ["passwordConfirmation"],
  });

type Values = z.infer<typeof schema>;

const FIELDS = ["name", "email", "password", "passwordConfirmation", "acceptsMarketing"] as const;

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
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
        <Alert tone="danger" live title="We could not create your account">
          {formError}
        </Alert>
      ) : null}

      <FormField
        id="register-name"
        label="Name"
        required
        error={form.formState.errors.name?.message ?? null}
      >
        {(field) => <Input {...field} autoComplete="name" {...form.register("name")} />}
      </FormField>

      <FormField
        id="register-email"
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
        id="register-password"
        label="Password"
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
        id="register-password-confirmation"
        label="Confirm password"
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
        label="Email me occasional store updates"
        checked={form.watch("acceptsMarketing")}
        onCheckedChange={(checked) => form.setValue("acceptsMarketing", checked === true)}
      />

      <Button
        type="submit"
        block
        size="lg"
        loading={form.formState.isSubmitting}
        loadingLabel="Creating account…"
      >
        Create account
      </Button>
    </form>
  );
}
