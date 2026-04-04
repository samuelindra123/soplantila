"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme | "system";
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  toggleTheme: () => null,
  mounted: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function getInitialTheme(defaultTheme: Theme | "system", storageKey: string): Theme {
  if (typeof window === "undefined") {
    return defaultTheme === "system" ? "light" : defaultTheme;
  }
  
  const savedTheme = localStorage.getItem(storageKey) as Theme | null;
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  
  if (defaultTheme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  
  return defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "soplantila-social-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize with SSR-safe value
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme === "system" ? "light" : defaultTheme;
    }
    return getInitialTheme(defaultTheme, storageKey);
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync theme from localStorage/system on mount
    const correctTheme = getInitialTheme(defaultTheme, storageKey);
    if (correctTheme !== theme) {
      setThemeState(correctTheme);
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // For social area, we apply theme to body with a special attribute
    // This allows CSS to scope theme to social pages only via :has() selector on :root
    document.body.setAttribute('data-social-theme', theme);
    
    // Remove dark-system class if exists (for clean state in social area)
    document.body.classList.remove('dark-system');
    
    // Save to localStorage
    localStorage.setItem(storageKey, theme);

    // Cleanup when component unmounts (user leaves social area)
    return () => {
      document.body.removeAttribute('data-social-theme');
      
      // Re-apply system dark mode if needed for public pages
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-system');
      }
    };
  }, [theme, mounted, storageKey]);

  const value = {
    theme,
    mounted,
    setTheme: (theme: Theme) => {
      setThemeState(theme);
    },
    toggleTheme: () => {
      setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
