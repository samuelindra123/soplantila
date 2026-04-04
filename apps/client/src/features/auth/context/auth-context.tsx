"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useTransition } from "react";
import { User, NextStep } from "@/types/api";
import { useRouter, usePathname } from "next/navigation";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
  initialNextStep
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialNextStep?: NextStep | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleNextStep = (nextStep: NextStep) => {
    if (nextStep === "VERIFY_EMAIL") return;
    
    startTransition(() => {
      if (nextStep === "COMPLETE_ONBOARDING") {
        if (pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
        return;
      }
      if (nextStep === "DASHBOARD") {
        if (
          pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/verify-otp" ||
          pathname === "/onboarding" ||
          pathname === "/"
        ) {
          router.replace("/feed");
        }
        return;
      }
    });
  };

  const refreshUser = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
          handleNextStep(result.data.nextStep);
          return true;
        }
      }

      // If refresh fails, clear user state
      setUser(null);
      return false;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      startTransition(() => {
        router.replace("/login");
      });
    }
  };

  // Only run bootstrap if we don't have initial user from server
  useEffect(() => {
    if (!initialUser && !user) {
      setIsLoading(true);
      refreshUser();
    } else if (initialUser && initialNextStep) {
      handleNextStep(initialNextStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for session expiry events from API client
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('Session expired event received, logging out...');
      setUser(null);
      startTransition(() => {
        router.replace('/login?reason=session-expired');
      });
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
