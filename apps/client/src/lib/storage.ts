/**
 * Client-side token storage utilities.
 *
 * NOTE: In this app, we use httpOnly cookies for session management,
 * so this storage is mainly for backward compatibility or special cases.
 * The main authentication flow uses server-side cookies.
 */

const TOKEN_KEY = "auth_token";

export const tokenStorage = {
  /**
   * Get token from localStorage.
   * Returns null if no token or if running on server.
   */
  getToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error("Failed to get token from storage:", error);
      return null;
    }
  },

  /**
   * Set token in localStorage.
   * Does nothing if running on server.
   */
  setToken(token: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error("Failed to set token in storage:", error);
    }
  },

  /**
   * Remove token from localStorage.
   * Does nothing if running on server.
   */
  removeToken(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error("Failed to remove token from storage:", error);
    }
  },

  /**
   * Clear all storage.
   * Does nothing if running on server.
   */
  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  },
};
