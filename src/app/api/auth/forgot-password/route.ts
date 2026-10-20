import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, apiPost } from "@/lib/api/client";
import type { OkResult } from "@/lib/types/api";

/**
 * `POST /api/auth/forgot-password` (Next.js, same-origin).
 *
 * Follows the same pattern as the login/register handlers: the browser posts
 * here, the Next.js server calls Laravel.
 *
 * ACCOUNT ENUMERATION: Laravel always answers `200 {ok:true}` whether or not
 * the address exists (contract 2.5), and this handler preserves that - a
 * transport failure is reported as a transport failure, but a successful call
 * never reveals whether an account was found. The UI shows one success state
 * either way.
 */

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
});

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

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json(
      { message: "Please check the highlighted fields.", code: "VALIDATION_FAILED", errors },
      { status: 422 },
    );
  }

  try {
    await apiPost<OkResult>("/auth/forgot-password", { email: parsed.data.email }, { revalidate: false });
    return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) {
      // A rate limit or validation problem is still reported, but nothing in
      // these responses distinguishes a known address from an unknown one.
      return NextResponse.json(
        { message: error.message, code: error.code, errors: error.errors },
        { status: error.status === 0 ? 503 : error.status },
      );
    }
    return NextResponse.json(
      {
        message: "Password reset is unavailable right now.",
        code: "SERVICE_UNAVAILABLE",
        errors: null,
      },
      { status: 503 },
    );
  }
}
