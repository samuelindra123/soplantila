import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { ApiError, ApiSuccess } from "@/types/api";

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3001/api";

export class BackendRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly endpoint?: string,
    public readonly method?: string,
    public readonly responseBody?: string,
  ) {
    super(message);
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  token?: string | null;
};

export async function backendRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const sessionCookieStore = await cookies();
  const token = options.token ?? sessionCookieStore.get(SESSION_COOKIE_NAME)?.value;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (response.status === 204) {
    return {} as T;
  }

  const rawBody = await response.text();
  let payload: ApiSuccess<T> | ApiError | null = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as ApiSuccess<T> | ApiError;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = payload as ApiError | null;
    const fallbackMessage =
      rawBody.trim() || `Request failed with status ${response.status}.`;

    throw new BackendRequestError(
      error?.error?.message || fallbackMessage,
      response.status,
      error?.error?.code,
      endpoint,
      options.method ?? "GET",
      rawBody,
    );
  }

  if (!payload) {
    throw new BackendRequestError(
      "Backend returned invalid JSON payload.",
      502,
      "INVALID_BACKEND_RESPONSE",
      endpoint,
      options.method ?? "GET",
      rawBody,
    );
  }

  return (payload as ApiSuccess<T>).data;
}
