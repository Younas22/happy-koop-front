"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { updateProfileAction } from "@/app/account/actions";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import type { CustomerProfile } from "@/lib/types/api";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  phone: z.string().trim().max(32),
  acceptsMarketing: z.boolean(),
});

type Values = z.infer<typeof schema>;

const FIELDS = ["name", "phone", "acceptsMarketing"] as const;

/** Name, phone and marketing preference. The email address is not editable here. */
export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone ?? "",
      acceptsMarketing: profile.acceptsMarketing,
    },
  });

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await updateProfileAction({
      name: values.name,
      phone: values.phone.trim() === "" ? null : values.phone.trim(),
      acceptsMarketing: values.acceptsMarketing,
    });

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, FIELDS));
      toast.error("Your profile was not saved.");
      return;
    }

    form.reset(values);
    toast.success("Profile saved.");
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title="We could not save your profile">
          {formError}
        </Alert>
      ) : null}

      <FormField
        id="profile-name"
        label="Name"
        required
        error={form.formState.errors.name?.message ?? null}
      >
        {(field) => <Input {...field} autoComplete="name" {...form.register("name")} />}
      </FormField>

      <FormField
        id="profile-email"
        label="Email address"
        description="Contact us if you need to change the address on your account."
      >
        {(field) => <Input {...field} value={profile.email} readOnly disabled />}
      </FormField>

      <FormField
        id="profile-phone"
        label="Phone"
        description="Optional."
        error={form.formState.errors.phone?.message ?? null}
      >
        {(field) => (
          <Input {...field} type="tel" autoComplete="tel" {...form.register("phone")} />
        )}
      </FormField>

      <CheckboxField
        id="profile-accepts-marketing"
        label="Email me occasional store updates"
        checked={form.watch("acceptsMarketing")}
        onCheckedChange={(checked) =>
          form.setValue("acceptsMarketing", checked === true, { shouldDirty: true })
        }
      />

      <div className="flex items-center gap-3">
        <Button type="submit" loading={form.formState.isSubmitting} loadingLabel="Saving…">
          Save changes
        </Button>
        {form.formState.isDirty ? (
          <span className="text-xs text-ink-muted">You have unsaved changes.</span>
        ) : null}
      </div>
    </form>
  );
}
