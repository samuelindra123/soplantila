"use server";

import { backendRequest } from "@/lib/server/backend-api";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction(formData: FormData) {
  try {
    await backendRequest("/onboarding/profile", {
      method: "POST",
      body: formData,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitOnboardingAction(formData: FormData) {
  try {
    await backendRequest("/onboarding/profile", {
      method: "POST",
      body: formData,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProfileAction(formData: FormData) {
  try {
    await backendRequest("/onboarding/profile", {
      method: "PATCH",
      body: formData,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProfileImageAction() {
  try {
    await backendRequest("/onboarding/profile-image", {
      method: "DELETE",
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
