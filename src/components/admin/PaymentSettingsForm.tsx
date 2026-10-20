"use client";

import { Check, Copy, Lock, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { savePaymentSettingsAction, testPaymentConnectionAction } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import {
  buildPaymentSettingsPayload,
  requestsLiveMode,
  secretIntent,
  type PaymentSettingsFormValues,
} from "@/lib/admin/payment-settings-payload";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import type {
  AdminConnectionCheck,
  AdminPaymentSettings,
  AdminSecretStatus,
  PaypalMode,
  StripeMode,
} from "@/lib/types/api";
import { formatDateTime } from "@/lib/utils/datetime";

/**
 * Payment provider settings.
 *
 * SECRET HANDLING (contract 8.2), which this component exists to get right:
 *  - every secret input is `type="password"`, `autoComplete="off"` and starts
 *    EMPTY. The API only ever returns `{configured, maskedSuffix, updatedAt}`,
 *    so there is nothing to prefill and nothing to leak back;
 *  - submitting an empty secret field OMITS it from the payload, which the API
 *    reads as "leave unchanged";
 *  - the explicit "Clear" control sends `null`, which deletes the stored value;
 *  - no secret is written to localStorage, a cookie, a URL, a hidden field or
 *    a log. The values live in component state for the duration of the submit
 *    and are cleared immediately afterwards.
 *
 * Switching a provider to live mode requires the confirmation checkbox, which
 * is what sends `confirmLiveMode: true`. Without it the API answers
 * `423 LIVE_MODE_LOCKED`, and that is reported as what it is.
 */

interface SecretInput {
  value: string;
  clear: boolean;
}

const EMPTY_SECRET: SecretInput = { value: "", clear: false };

function SecretStatusLine({ status }: { status: AdminSecretStatus }) {
  if (!status.configured) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
        <X className="size-3.5 text-ink-subtle" aria-hidden="true" />
        Not configured
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
      <Check className="size-3.5 text-success" aria-hidden="true" />
      Configured
      {status.maskedSuffix ? (
        <span className="font-mono text-ink">&hellip;{status.maskedSuffix}</span>
      ) : null}
      {status.updatedAt ? (
        <span>· set {formatDateTime(status.updatedAt) ?? "previously"}</span>
      ) : null}
    </span>
  );
}

function SecretField({
  id,
  label,
  status,
  input,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  status: AdminSecretStatus;
  input: SecretInput;
  onChange: (next: SecretInput) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FormField
        id={id}
        label={label}
        description={
          status.configured
            ? "Leave blank to keep the stored value. Enter a new value to replace it."
            : "Enter the value from the provider dashboard."
        }
      >
        {(field) => (
          <Input
            {...field}
            // Never a readable field, never remembered by the browser, and it
            // always starts empty - the API cannot return the stored secret.
            type="password"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={status.configured ? "Unchanged" : ""}
            value={input.value}
            disabled={disabled || input.clear}
            onChange={(event) => onChange({ value: event.target.value, clear: false })}
          />
        )}
      </FormField>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SecretStatusLine status={status} />

        {status.configured ? (
          input.clear ? (
            <span className="flex items-center gap-2 text-xs text-danger">
              Will be cleared on save
              <button
                type="button"
                className="font-medium underline underline-offset-2"
                onClick={() => onChange(EMPTY_SECRET)}
              >
                Undo
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="text-xs font-medium text-danger underline underline-offset-2"
              disabled={disabled}
              onClick={() => onChange({ value: "", clear: true })}
            >
              Clear stored value
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

function WebhookUrl({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">Webhook URL</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-md border border-line bg-sunken px-3 py-2 text-xs text-ink">
          {url}
        </code>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              toast.success("Webhook URL copied.");
            } catch {
              toast.error("Copying is blocked in this browser. Select the URL and copy it.");
            }
          }}
        >
          <Copy className="size-4" aria-hidden="true" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-xs text-ink-muted">
        Read-only. Paste this into the provider dashboard. Changing settings here does not create or
        update the webhook at the provider.
      </p>
    </div>
  );
}

function LastCheck({ check }: { check: AdminConnectionCheck | null }) {
  if (!check) {
    return <p className="text-xs text-ink-muted">This connection has not been tested yet.</p>;
  }

  return (
    <p className={`text-xs ${check.ok ? "text-success" : "text-danger"}`}>
      {check.ok ? "Last test succeeded" : "Last test failed"}
      {": "}
      {check.message}
      {check.checkedAt ? ` (${formatDateTime(check.checkedAt) ?? check.checkedAt})` : ""}
    </p>
  );
}

export function PaymentSettingsForm({ settings }: { settings: AdminPaymentSettings }) {
  const [stripeEnabled, setStripeEnabled] = React.useState(settings.stripe.enabled);
  const [stripeMode, setStripeMode] = React.useState<StripeMode>(
    settings.stripe.mode === "live" ? "live" : "test",
  );
  const [publishableKey, setPublishableKey] = React.useState(settings.stripe.publishableKey ?? "");
  const [stripeSecret, setStripeSecret] = React.useState<SecretInput>(EMPTY_SECRET);
  const [stripeWebhookSecret, setStripeWebhookSecret] = React.useState<SecretInput>(EMPTY_SECRET);

  const [paypalEnabled, setPaypalEnabled] = React.useState(settings.paypal.enabled);
  const [paypalMode, setPaypalMode] = React.useState<PaypalMode>(
    settings.paypal.mode === "live" ? "live" : "sandbox",
  );
  const [clientId, setClientId] = React.useState(settings.paypal.clientId ?? "");
  const [paypalSecret, setPaypalSecret] = React.useState<SecretInput>(EMPTY_SECRET);
  const [paypalWebhookId, setPaypalWebhookId] = React.useState<SecretInput>(EMPTY_SECRET);

  const [confirmLiveMode, setConfirmLiveMode] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [liveLocked, setLiveLocked] = React.useState<string | null>(null);
  const [liveConfirmOpen, setLiveConfirmOpen] = React.useState(false);
  const [testing, setTesting] = React.useState<"stripe" | "paypal" | null>(null);

  function currentValues(): PaymentSettingsFormValues {
    return {
      stripe: {
        enabled: stripeEnabled,
        mode: stripeMode,
        publishableKey,
        secretKey: secretIntent(stripeSecret.value, stripeSecret.clear),
        webhookSecret: secretIntent(stripeWebhookSecret.value, stripeWebhookSecret.clear),
      },
      paypal: {
        enabled: paypalEnabled,
        mode: paypalMode,
        clientId,
        clientSecret: secretIntent(paypalSecret.value, paypalSecret.clear),
        webhookId: secretIntent(paypalWebhookId.value, paypalWebhookId.clear),
      },
      confirmLiveMode,
    };
  }

  const wantsLive = requestsLiveMode(currentValues());
  const switchingToLive =
    (stripeMode === "live" && settings.stripe.mode !== "live") ||
    (paypalMode === "live" && settings.paypal.mode !== "live");

  async function submit() {
    setSaving(true);
    setError(null);
    setLiveLocked(null);

    const payload = buildPaymentSettingsPayload(currentValues());

    const result = await savePaymentSettingsAction(payload);

    // Whatever happens, the entered secrets do not linger in state.
    setStripeSecret(EMPTY_SECRET);
    setStripeWebhookSecret(EMPTY_SECRET);
    setPaypalSecret(EMPTY_SECRET);
    setPaypalWebhookId(EMPTY_SECRET);
    setConfirmLiveMode(false);
    setSaving(false);
    setLiveConfirmOpen(false);

    if (!result.ok) {
      if (result.error.code === "LIVE_MODE_LOCKED") {
        setLiveLocked(result.error.message);
        toast.error("Live mode is locked.");
        return;
      }

      const details = flattenFieldErrors(result.error.errors);
      setError(details.length > 0 ? details.join(" ") : result.error.message);
      toast.error("Payment settings were not saved.");
      return;
    }

    toast.success("Payment settings saved.");
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (switchingToLive && !confirmLiveMode) {
      setError(
        "Tick the live-mode confirmation before saving. Live mode takes real payments from real customers.",
      );
      return;
    }

    if (switchingToLive) {
      setLiveConfirmOpen(true);
      return;
    }

    void submit();
  }

  async function test(provider: "stripe" | "paypal") {
    setTesting(provider);
    const result = await testPaymentConnectionAction(provider);
    setTesting(null);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    if (result.data.ok) {
      toast.success(result.data.message);
    } else {
      toast.error(result.data.message);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-6">
      <Alert tone="info" title="How secrets are handled here">
        Secret keys are never returned by the API, so these fields always start empty and show only
        whether a value is stored. Leave a field blank to keep the stored secret, type a value to
        replace it, or use &ldquo;Clear stored value&rdquo; to delete it. Nothing you type is saved
        in this browser.
      </Alert>

      {error ? (
        <Alert tone="danger" live title="Payment settings were not saved">
          {error}
        </Alert>
      ) : null}

      {liveLocked ? (
        <Alert tone="danger" live title="Live mode is locked">
          <p>{liveLocked}</p>
          <p className="mt-1">
            Live mode needs both the confirmation below and an admin account with the
            live-payments permission. Ask an administrator with that permission to make the change.
          </p>
        </Alert>
      ) : null}

      {/* ----------------------------- Stripe ----------------------------- */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Stripe</CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge tone={settings.stripe.enabled ? "success" : "neutral"}>
              {settings.stripe.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge tone={settings.stripe.mode === "live" ? "warning" : "info"}>
              {settings.stripe.mode}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <CheckboxField
            id="stripe-enabled"
            label="Offer card payments through Stripe"
            checked={stripeEnabled}
            onCheckedChange={(checked) => setStripeEnabled(checked === true)}
          />

          <FormField
            id="stripe-mode"
            label="Mode"
            description="Test mode never charges a real card. Keys must match the mode."
          >
            {(field) => (
              <select
                {...field}
                className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
                value={stripeMode}
                onChange={(event) => setStripeMode(event.target.value as StripeMode)}
              >
                <option value="test">Test</option>
                <option value="live">Live</option>
              </select>
            )}
          </FormField>

          <FormField
            id="stripe-publishable-key"
            label="Publishable key"
            description="Public value, safe in the browser. Must match the selected mode (pk_test_ or pk_live_)."
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="off"
                spellCheck={false}
                value={publishableKey}
                onChange={(event) => setPublishableKey(event.target.value)}
              />
            )}
          </FormField>

          <SecretField
            id="stripe-secret-key"
            label="Secret key"
            status={settings.stripe.secretKey}
            input={stripeSecret}
            onChange={setStripeSecret}
            disabled={saving}
          />

          <SecretField
            id="stripe-webhook-secret"
            label="Webhook signing secret"
            status={settings.stripe.webhookSecret}
            input={stripeWebhookSecret}
            onChange={setStripeWebhookSecret}
            disabled={saving}
          />

          <WebhookUrl url={settings.stripe.webhookUrl} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={testing === "stripe"}
              loadingLabel="Testing…"
              onClick={() => void test("stripe")}
            >
              Test connection
            </Button>
            <LastCheck check={settings.stripe.lastCheck} />
          </div>
        </CardBody>
      </Card>

      {/* ----------------------------- PayPal ----------------------------- */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>PayPal</CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge tone={settings.paypal.enabled ? "success" : "neutral"}>
              {settings.paypal.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge tone={settings.paypal.mode === "live" ? "warning" : "info"}>
              {settings.paypal.mode}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <CheckboxField
            id="paypal-enabled"
            label="Offer PayPal"
            checked={paypalEnabled}
            onCheckedChange={(checked) => setPaypalEnabled(checked === true)}
          />

          <FormField id="paypal-mode" label="Mode" description="Sandbox never moves real money.">
            {(field) => (
              <select
                {...field}
                className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
                value={paypalMode}
                onChange={(event) => setPaypalMode(event.target.value as PaypalMode)}
              >
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            )}
          </FormField>

          <FormField
            id="paypal-client-id"
            label="Client ID"
            description="Public value, safe in the browser."
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="off"
                spellCheck={false}
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              />
            )}
          </FormField>

          <SecretField
            id="paypal-client-secret"
            label="Client secret"
            status={settings.paypal.clientSecret}
            input={paypalSecret}
            onChange={setPaypalSecret}
            disabled={saving}
          />

          <SecretField
            id="paypal-webhook-id"
            label="Webhook ID"
            status={settings.paypal.webhookId}
            input={paypalWebhookId}
            onChange={setPaypalWebhookId}
            disabled={saving}
          />

          <WebhookUrl url={settings.paypal.webhookUrl} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={testing === "paypal"}
              loadingLabel="Testing…"
              onClick={() => void test("paypal")}
            >
              Test connection
            </Button>
            <LastCheck check={settings.paypal.lastCheck} />
          </div>
        </CardBody>
      </Card>

      {/* --------------------------- Live mode --------------------------- */}
      {wantsLive ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Lock className="size-4" aria-hidden="true" />
                Live mode authorization
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-ink-muted">
              Live mode takes real payments from real customers. The API refuses the change unless
              you confirm it here and your account has the live-payments permission.
            </p>
            <CheckboxField
              id="confirm-live-mode"
              label="I understand this enables real payments and I am authorized to do it"
              checked={confirmLiveMode}
              onCheckedChange={(checked) => setConfirmLiveMode(checked === true)}
            />
          </CardBody>
        </Card>
      ) : null}

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface py-3">
        <Button type="submit" loading={saving} loadingLabel="Saving…">
          Save payment settings
        </Button>
        <span className="text-xs text-ink-muted">
          Enabling or disabling a provider changes what customers see at checkout.
        </span>
      </div>

      <ConfirmDialog
        open={liveConfirmOpen}
        onOpenChange={setLiveConfirmOpen}
        title="Switch to live payments?"
        recordName={[
          stripeMode === "live" && settings.stripe.mode !== "live" ? "Stripe → live" : null,
          paypalMode === "live" && settings.paypal.mode !== "live" ? "PayPal → live" : null,
        ]
          .filter(Boolean)
          .join(", ")}
        description="Real customer payments will be taken from the moment this is saved. Make sure the live keys are correct and the provider webhook points at the URL shown above."
        confirmLabel="Switch to live"
        busy={saving}
        onConfirm={() => void submit()}
      />
    </form>
  );
}
