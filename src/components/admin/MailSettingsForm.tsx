"use client";

import { CheckCircle2, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  saveMailSettingsAction,
  sendTestMailAction,
} from "@/app/admin/actions";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import type { AdminMailSettings } from "@/lib/types/api";

/**
 * Email sender settings: Resend API key, From address and From name.
 *
 * Saved on the server and applied over the environment, so the .env file
 * does not need editing. The API key is write-only: the page shows whether one
 * is stored and its last four characters, never the key itself, and an empty
 * key field keeps the stored one.
 */
export function MailSettingsForm({
  settings,
}: {
  settings: AdminMailSettings;
}) {
  const router = useRouter();

  const [apiKey, setApiKey] = React.useState("");
  const [clearKey, setClearKey] = React.useState(false);
  const [fromAddress, setFromAddress] = React.useState(
    settings.fromAddress ?? "",
  );
  const [fromName, setFromName] = React.useState(settings.fromName ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [testTo, setTestTo] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const lastTest = settings.lastTest;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await saveMailSettingsAction({
      ...(clearKey
        ? { clearResendApiKey: true }
        : apiKey.trim()
          ? { resendApiKey: apiKey.trim() }
          : {}),
      fromAddress: fromAddress.trim() || null,
      fromName: fromName.trim() || null,
    });
    setSaving(false);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setError(details.length > 0 ? details.join(" ") : result.error.message);
      return;
    }

    setApiKey("");
    setClearKey(false);
    toast.success("Email settings saved.");
    router.refresh();
  }

  async function sendTest() {
    setTesting(true);
    const result = await sendTestMailAction(testTo.trim() || null);
    setTesting(false);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      toast.error(
        details.length > 0 ? details.join(" ") : result.error.message,
      );
      return;
    }

    if (result.data.ok) toast.success(`Test email sent to ${result.data.to}.`);
    else
      toast.error("The test email was not sent.", {
        description: result.data.message,
      });
    router.refresh();
  }

  const key = settings.resendApiKey;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={(event) => void save(event)} className="min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Sender (Resend)</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            {error ? (
              <Alert tone="danger" live title="The settings were not saved">
                {error}
              </Alert>
            ) : null}

            <FormField
              id="mail-resend-key"
              label="Resend API key"
              description={
                key.configured
                  ? `A key is saved${key.maskedSuffix ? ` (ends in …${key.maskedSuffix})` : ""}. Leave this empty to keep it.`
                  : "Create one at resend.com → API Keys. It starts with re_."
              }
            >
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={key.configured ? "••••••••  (saved)" : "re_…"}
                  value={apiKey}
                  disabled={clearKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
              )}
            </FormField>

            {key.configured ? (
              <CheckboxField
                id="mail-clear-key"
                label="Remove the saved key (fall back to the server's .env settings)"
                checked={clearKey}
                onCheckedChange={(checked) => setClearKey(checked === true)}
              />
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="mail-from-address"
                label="From email"
                description="Must be on a domain verified in Resend."
              >
                {(field) => (
                  <Input
                    {...field}
                    type="email"
                    autoComplete="off"
                    placeholder="contact@yourdomain.com"
                    value={fromAddress}
                    onChange={(event) => setFromAddress(event.target.value)}
                  />
                )}
              </FormField>

              <FormField
                id="mail-from-name"
                label="From name"
                description="Shown as the sender in the inbox."
              >
                {(field) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder="Your store name"
                    value={fromName}
                    onChange={(event) => setFromName(event.target.value)}
                  />
                )}
              </FormField>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={saving} loadingLabel="Saving…">
                Save email settings
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>

      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>In use now</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="flex items-center justify-between gap-2">
              <span className="text-ink-muted">Mailer</span>
              <Badge
                tone={
                  settings.effective.mailer === "resend" ? "success" : "warning"
                }
              >
                {settings.effective.mailer}
              </Badge>
            </p>
            <p className="flex justify-between gap-2">
              <span className="text-ink-muted">From</span>
              <span className="min-w-0 truncate text-right text-ink">
                {settings.effective.fromName} &lt;
                {settings.effective.fromAddress}&gt;
              </span>
            </p>
            <p className="flex justify-between gap-2">
              <span className="text-ink-muted">Source</span>
              <span className="text-ink">
                {settings.effective.source === "admin"
                  ? "These settings"
                  : "Server .env"}
              </span>
            </p>
            {settings.effective.mailer === "log" ? (
              <p className="pt-1 text-xs text-warning">
                Emails are only written to the server log, not sent. Save a
                Resend API key to send them.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send a test email</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <FormField
              id="mail-test-to"
              label="Send to"
              description="Leave empty to send it to your own admin email."
            >
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="you@example.com"
                  value={testTo}
                  onChange={(event) => setTestTo(event.target.value)}
                />
              )}
            </FormField>
            <Button
              type="button"
              variant="secondary"
              loading={testing}
              loadingLabel="Sending…"
              onClick={() => void sendTest()}
            >
              <Send className="size-4" aria-hidden="true" />
              Send test email
            </Button>

            {lastTest ? (
              <div className="flex gap-2 rounded-md border border-line p-3 text-sm">
                {lastTest.ok ? (
                  <CheckCircle2
                    className="size-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="size-5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {lastTest.ok ? "Last test sent" : "Last test failed"} to{" "}
                    {lastTest.to}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-ink-muted">
                    {lastTest.message}
                  </p>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
