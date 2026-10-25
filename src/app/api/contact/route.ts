import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, apiPost } from "@/lib/api/client";

/**
 * `POST /api/contact` - same-origin proxy to Laravel `POST /api/v1/contact`.
 *
 * The browser cannot call Laravel directly: the API base URL comes from the
 * server-validated runtime config, so no API origin or allowlist logic ships
 * to the client.
 *
 * The schema below strips unknown keys, so a recipient field someone adds by
 * hand never reaches the backend - and the backend would ignore it anyway,
 * because the administrator's address is resolved from store settings. The
 * real validation is Laravel's; this is a cheap first pass that keeps obvious
 * junk off the API.
 */

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(180).nullable().default(null),
  message: z.string().trim().min(10).max(5000),
  // The honeypot travels on: it is the backend that decides, so a bot cannot
  // get past it by talking to Laravel directly.
  website: z.string().max(0).optional(),
});

interface ContactAccepted {
  reference: string;
  receivedAt: string | null;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Malformed request body.", code: "BAD_REQUEST", errors: null },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Please check the form and try again.",
        code: "VALIDATION_FAILED",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const data = await apiPost<ContactAccepted>("/contact", parsed.data, { revalidate: false });
    return NextResponse.json({ data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) {
      // 422 field errors and the 429 from the rate limiter both belong to the
      // visitor, so they are passed through rather than flattened into one
      // generic failure.
      return NextResponse.json(
        { message: error.message, code: error.code, errors: error.errors },
        { status: error.status === 0 ? 503 : error.status },
      );
    }
    return NextResponse.json(
      {
        message: "We could not send your message right now. Please try again shortly.",
        code: "SERVICE_UNAVAILABLE",
        errors: null,
      },
      { status: 503 },
    );
  }
}
