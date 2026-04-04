import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { backendRequest, BackendRequestError } from "@/lib/server/backend-api";
import { MeResponse } from "@/types/api";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/refresh
 *
 * Validates the current session and returns user data.
 * If the token is invalid, clears the cookie and returns 401.
 * This is a Route Handler and can safely modify cookies.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    try {
      const user = await backendRequest<MeResponse>("/auth/me", { token });
      return NextResponse.json({ success: true, data: user }, { status: 200 });
    } catch (error) {
      if (error instanceof BackendRequestError) {
        // Clear invalid cookie
        cookieStore.delete(SESSION_COOKIE_NAME);
        return NextResponse.json(
          { success: false, error: "Invalid session" },
          { status: 401 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh session" },
      { status: 500 }
    );
  }
}
