import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { MeResponse } from "@/types/api";
import { backendRequest, BackendRequestError } from "./backend-api";

/**
 * Get the current session user.
 * This function only READS cookies and NEVER modifies them.
 * It can be safely called from layouts, pages, and components.
 *
 * If the token is invalid, it returns null. Cookie clearing must be done
 * by Server Actions or Route Handlers on the client side.
 */
export async function getSessionUser(): Promise<MeResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await backendRequest<MeResponse>("/auth/me", { token });
  } catch (error) {
    if (error instanceof BackendRequestError) {
      // Don't clear cookie here - this function is called in layouts
      // Cookie clearing should only happen in Server Actions or Route Handlers
      // The client will handle logout via the logout action/route
      return null;
    }

    throw error;
  }
}
