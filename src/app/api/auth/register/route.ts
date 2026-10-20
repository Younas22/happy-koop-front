import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, apiPost } from "@/lib/api/client";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/cookie";
import type { LoginResult, User } from "@/lib/types/api";

/**
 * `POST /api/auth/register` (Next.js, same-origin).
 * Same token handling as login: the bearer token goes straight into the
 * HttpOnly cookie and is never returned to the browser.
 */

export const dynamic = "force-dynamic";

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(255),
    email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    passwordConfirmation: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "The passwords do not match.",
    path: ["passwordConfirmation"],
  });

function sanitizeUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
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

  const parsed = registerSchema.safeParse(payload);
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
    const result = await apiPost<LoginResult>(
      "/auth/register",
      {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        passwordConfirmation: parsed.data.passwordConfirmation,
        deviceName: "web",
      },
      { revalidate: false },
    );

    const response = NextResponse.json({ data: { user: sanitizeUser(result.user) } }, { status: 201 });

    let maxAge: number | undefined;
    if (result.expiresAt) {
      const seconds = Math.floor((Date.parse(result.expiresAt) - Date.now()) / 1000);
      if (Number.isFinite(seconds) && seconds > 0) maxAge = seconds;
    }

    response.cookies.set(SESSION_COOKIE_NAME, result.token, sessionCookieOptions(maxAge));
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, code: error.code, errors: error.errors },
        { status: error.status === 0 ? 503 : error.status },
      );
    }
    return NextResponse.json(
      { message: "Registration is unavailable right now.", code: "SERVICE_UNAVAILABLE", errors: null },
      { status: 503 },
    );
  }
}
