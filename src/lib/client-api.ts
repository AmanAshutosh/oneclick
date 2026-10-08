"use client";

export type FieldErrors = Record<string, string[] | undefined>;

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: FieldErrors = {},
  ) {
    super(message);
  }
}

/** fetch wrapper for the admin REST API: JSON in/out, typed errors, auth redirect. */
export async function api<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: "same-origin",
    });
  } catch {
    throw new ClientApiError(0, "Network error — check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    const fieldErrors = (data.fieldErrors ?? data.details?.fieldErrors ?? {}) as FieldErrors;
    throw new ClientApiError(res.status, data.error || `Request failed (${res.status})`, fieldErrors);
  }
  return data as T;
}
