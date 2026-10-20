"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { changePasswordAction } from "@/app/account/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { applyFieldErrors } from "@/lib/forms/api-errors";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
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

const FIELDS = ["currentPassword", "password", "passwordConfirmation"] as const;

/**
 * Change password.
 *
 * Separate from the profile form because it has different stakes: the current
 * password must be supplied, the server verifies it, and every other session
 * is revoked on success. The fields are cleared immediately afterwards and
 * nothing is kept in component state beyond the submit.
 */
export function PasswordForm() {
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", password: "", passwordConfirmation: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await changePasswordAction(values);

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, FIELDS));
      toast.error("Your password was not changed.");
      return;
    }

    form.reset({ currentPassword: "", password: "", passwordConfirmation: "" });
    toast.success("Password changed. Other devices have been signed out.");
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title="We could not change your password">
          {formError}
        </Alert>
      ) : null}

      <FormField
        id="password-current"
        label="Current password"
        required
        error={form.formState.errors.currentPassword?.message ?? null}
      >
        {(field) => (
          <Input
            {...field}
            type="password"
            autoComplete="current-password"
            {...form.register("currentPassword")}
          />
        )}
      </FormField>

      <FormField
        id="password-new"
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
        id="password-confirmation"
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

      <p className="text-xs text-ink-muted">
        Changing your password signs you out everywhere else. This device stays signed in.
      </p>

      <Button type="submit" loading={form.formState.isSubmitting} loadingLabel="Updating…">
        Change password
      </Button>
    </form>
  );
}
