import { ApiError, ApiSuccess } from "@/types/api";

const BASE_URL = "/api/backend";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers);

    // Don't set Content-Type if it's FormData, browser will do it with boundary
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    let data: unknown = null;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorData = data as ApiError | null;
      const error = new ApiClientError(
        errorData?.error?.message || "Something went wrong",
        response.status,
        errorData?.error?.code,
      );
      
      // Handle 401 globally - session expired
      if (response.status === 401) {
        console.warn('Session expired, redirecting to login...');
        // Dispatch custom event for session expiry
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }
      
      throw error;
    }

    return (data as ApiSuccess<T>).data;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
