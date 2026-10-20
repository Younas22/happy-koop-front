import { NextResponse } from "next/server";

import { ApiError, getApiBaseUrl } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session-token";
import { getViewer } from "@/lib/auth/session";
import type { AdminMediaAsset } from "@/lib/types/api";
import { joinUrl } from "@/lib/utils/url";

/**
 * `POST /api/admin/media` - same-origin multipart proxy to
 * `POST /api/v1/admin/media` (contract 9).
 *
 * A file upload cannot go through the JSON api client, so the multipart body
 * is streamed straight through with the bearer token attached server-side. The
 * browser still never sees the token or the API origin.
 *
 * Validation is deliberately NOT duplicated here: the backend detects the real
 * MIME type, enforces the size and dimension limits, rejects SVG and
 * executable extensions, and stores the file under a generated name. A check
 * in this handler would be advisory at best, so the only thing refused locally
 * is a request with no file at all.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // UI affordance check only; the API authorizes the upload itself.
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json(
      { message: "Sign in to upload media.", code: "UNAUTHENTICATED", errors: null },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "The upload could not be read.", code: "BAD_REQUEST", errors: null },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { message: "Choose a file to upload.", code: "VALIDATION_FAILED", errors: { file: ["Choose a file to upload."] } },
      { status: 422 },
    );
  }

  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { message: "Your session has expired. Sign in again.", code: "UNAUTHENTICATED", errors: null },
      { status: 401 },
    );
  }

  const upstream = new FormData();
  upstream.set("file", file, file.name);
  const alt = form.get("alt");
  if (typeof alt === "string" && alt.trim() !== "") upstream.set("alt", alt.trim());
  const folder = form.get("folder");
  if (typeof folder === "string" && folder.trim() !== "") upstream.set("folder", folder.trim());

  try {
    const base = await getApiBaseUrl();
    const response = await fetch(joinUrl(base, "/admin/media"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        // Content-Type is set by fetch, including the multipart boundary.
      },
      body: upstream,
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text.length > 0) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const body = (payload ?? {}) as Partial<{
        message: string;
        code: string;
        errors: Record<string, string[]>;
      }>;
      return NextResponse.json(
        {
          message: body.message ?? "The upload was rejected.",
          code: body.code ?? `HTTP_${response.status}`,
          errors: body.errors ?? null,
        },
        { status: response.status },
      );
    }

    const data =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as { data: AdminMediaAsset }).data
        : null;

    if (!data) {
      return NextResponse.json(
        { message: "The store returned an unexpected response.", code: "BAD_RESPONSE", errors: null },
        { status: 502 },
      );
    }

    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, code: error.code, errors: error.errors },
        { status: error.status === 0 ? 503 : error.status },
      );
    }
    return NextResponse.json(
      { message: "The upload could not be completed.", code: "SERVICE_UNAVAILABLE", errors: null },
      { status: 503 },
    );
  }
}
