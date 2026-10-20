"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Alert } from "@/components/ui/Alert";
import { postSameOrigin } from "@/lib/http/same-origin";
import type { Money, OrderStatusView, PaypalOrderResult } from "@/lib/types/api";

/**
 * PayPal payment step.
 *
 * `clientId` comes from runtime config (returned only while PayPal is
 * enabled). Both calls go through our own route handlers:
 *  - `createOrder` -> `POST /api/payments/paypal/order`
 *  - `onApprove`   -> `POST /api/payments/paypal/capture`
 *
 * The backend captures and then INDEPENDENTLY verifies status, amount,
 * currency and the order reference before changing the payment status
 * (contract 6). This component therefore navigates to the return page on
 * approval and lets that page read the authoritative status - a PayPal
 * "approved" callback is never treated as proof of payment here.
 */

export interface PaypalPaymentStepProps {
  clientId: string;
  orderNumber: string;
  currency: string;
  amount: Money;
  testMode: boolean;
}

export function PaypalPaymentStep({
  clientId,
  orderNumber,
  currency,
  testMode,
}: PaypalPaymentStepProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      {testMode ? (
        <Alert tone="info" title="Sandbox mode">
          This store is in PayPal sandbox mode. No real money moves.
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" live title="Payment not completed">
          {error}
        </Alert>
      ) : null}

      <PayPalScriptProvider
        options={{
          clientId,
          currency,
          intent: "capture",
          components: "buttons",
        }}
      >
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "paypal" }}
          createOrder={async () => {
            setError(null);
            const result = await postSameOrigin<PaypalOrderResult>("/api/payments/paypal/order", {
              orderNumber,
            });

            if (!result.ok) {
              setError(result.error.message);
              throw new Error(result.error.code);
            }

            return result.data.paypalOrderId;
          }}
          onApprove={async (data) => {
            setError(null);
            const result = await postSameOrigin<OrderStatusView>(
              "/api/payments/paypal/capture",
              { orderNumber, paypalOrderId: data.orderID },
            );

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            // The return page re-reads the status server-side; nothing is
            // concluded from this response beyond "go and check".
            router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
          }}
          onCancel={() => {
            router.push(`/checkout/cancel?order=${encodeURIComponent(orderNumber)}`);
          }}
          onError={() => {
            setError(
              "PayPal reported a problem with this payment. Nothing has been charged - you can try again.",
            );
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
