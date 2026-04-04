"use server";

import { cookies } from "next/headers";
import { backendRequest } from "@/lib/server/backend-api";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { AuthResponse, MeResponse } from "@/types/api";
import { redirect } from "next/navigation";

/**
 * Set session cookie with access token.
 * This is a Server Action and can safely modify cookies.
 */
async function setAccessTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

/**
 * Clear session cookie.
 * This is a Server Action and can safely modify cookies.
 */
async function clearAccessTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function registerAction(formData: any) {
  try {
    await backendRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginAction(credentials: { identifier: string; password: string }) {
  try {
    const data = await backendRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: { "Content-Type": "application/json" },
    });

    // Set the session cookie using our helper function
    await setAccessTokenCookie(data.accessToken);

    return { success: true, nextStep: data.nextStep };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyOtpAction(email: string, otpCode: string) {
  try {
    const data = await backendRequest<AuthResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otpCode }),
      headers: { "Content-Type": "application/json" },
    });

    // Set the session cookie using our helper function
    await setAccessTokenCookie(data.accessToken);

    return { success: true, nextStep: data.nextStep };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resendOtpAction(email: string) {
  try {
    await backendRequest("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutAction() {
  await clearAccessTokenCookie();
  redirect("/login");
}

export async function getMeAction() {
  try {
    const data = await backendRequest<MeResponse>("/auth/me");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
