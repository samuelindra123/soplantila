import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and returns success.
 * This is a Route Handler and can safely modify cookies.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
  }
}
