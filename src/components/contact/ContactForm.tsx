"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { asApiErrorPayload, applyFieldErrors } from "@/lib/forms/api-errors";

/**
 * Contact form.
 *
 * Success is shown only after the API has accepted the message and returned a
 * reference - never optimistically - because the confirmation quotes that
 * reference, and a reference the store cannot look up would be worse than no
 * confirmation at all. A failure says so and keeps what was typed, so nothing
 * a visitor wrote is silently discarded.
 */

/** Built per render so the validation messages are in the page's language. */
function contactSchema(t: Messages["contact"]["errors"]) {
  return z.object({
    name: z.string().trim().min(2, t.name).max(160),
    email: z.string().trim().email(t.email).max(255),
    subject: z.string().trim().max(180),
    message: z.string().trim().min(10, t.message).max(5000),
    // Honeypot: hidden from people, left empty by them.
    website: z.string().max(0),
  });
}

type Values = z.infer<ReturnType<typeof contactSchema>>;

const KNOWN_FIELDS = ["name", "email", "subject", "message"] as const;

export function ContactForm() {
  const t = useMessages().contact;
  const schema = React.useMemo(() => contactSchema(t.errors), [t]);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [reference, setReference] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);

    let response: Response;
    try {
      response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          subject: values.subject === "" ? null : values.subject,
          message: values.message,
          website: values.website,
        }),
      });
    } catch {
      setFormError(t.errors.unreachable);
      return;
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const payload = asApiErrorPayload(body);

      if (response.status === 429) {
        setFormError(t.errors.rateLimited);
        return;
      }

      setFormError(
        payload
          ? applyFieldErrors(payload, form.setError, KNOWN_FIELDS)
          : t.errors.notSent,
      );
      return;
    }

    const accepted =
      body && typeof body === "object" && "data" in body
        ? ((body as { data?: { reference?: string } }).data ?? null)
        : null;

    setReference(accepted?.reference ?? null);
    form.reset();
  }

  if (reference !== null) {
    return (
      <Alert tone="success" live title={t.sentTitle}>
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{fmt(t.sentBody, { reference })}</span>
        </p>
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title={t.notSentTitle}>
          {formError}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="contact-name"
          label={t.name}
          required
          error={form.formState.errors.name?.message}
        >
          {(field) => <Input {...field} {...form.register("name")} autoComplete="name" />}
        </FormField>

        <FormField
          id="contact-email"
          label={t.email}
          required
          description={t.emailHint}
          error={form.formState.errors.email?.message}
        >
          {(field) => (
            <Input {...field} {...form.register("email")} type="email" autoComplete="email" />
          )}
        </FormField>
      </div>

      <FormField id="contact-subject" label={t.subject} error={form.formState.errors.subject?.message}>
        {(field) => <Input {...field} {...form.register("subject")} />}
      </FormField>

      <FormField
        id="contact-message"
        label={t.message}
        required
        error={form.formState.errors.message?.message}
      >
        {(field) => <Textarea {...field} {...form.register("message")} rows={6} />}
      </FormField>

      {/* Honeypot. Hidden from people and from assistive technology, so only a
          script fills it in; the backend rejects the submission if it is set. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" {...form.register("website")} />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          loadingLabel={t.sending}
        >
          {t.send}
        </Button>
      </div>
    </form>
  );
}
