import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, apiPost } from "@/lib/api/client";
import type { OkResult } from "@/lib/types/api";

/**
 * `POST /api/auth/reset-password` (Next.js, same-origin).
 *
 * The reset token arrives in the emailed link and is forwarded as-is. No
 * session is issued here: a successful reset sends the customer to the sign-in
 * page, so the new password is actually exercised.
 *
 * NOTE: `POST /api/v1/auth/reset-password` expects Laravel's native
 * `password_confirmation` key rather than the camelCase used elsewhere in the
 * contract. The mapping is done here so no component has to know about it.
 */

export const dynamic = "force-dynamic";

const schema = z
  .object({
    token: z.string().trim().min(1, "This reset link is incomplete."),
    email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
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
    await apiPost<OkResult>(
      "/auth/reset-password",
      {
        token: parsed.data.token,
        email: parsed.data.email,
        password: parsed.data.password,
        password_confirmation: parsed.data.passwordConfirmation,
      },
      { revalidate: false },
    );
    return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) {
      // Translate Laravel's snake_case field path back to the form's field.
      const errors = error.errors ? { ...error.errors } : null;
      if (errors && errors.password_confirmation) {
        errors.passwordConfirmation = errors.password_confirmation;
        delete errors.password_confirmation;
      }
      return NextResponse.json(
        { message: error.message, code: error.code, errors },
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
