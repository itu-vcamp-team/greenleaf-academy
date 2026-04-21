"use client";

import { createContext, useContext, useEffect } from "react";
import { useTenantStore, TenantData } from "@/store/tenant.store";

interface TenantContextType {
  activeTenant: TenantData | null;
  availableTenants: TenantData[];
  setTenantBySlug: (slug: string) => void;
  loading: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { 
    activeTenant, 
    availableTenants, 
    setActiveTenant,
    fetchTenants,
    loading, 
    theme, 
    toggleTheme 
  } = useTenantStore();

  useEffect(() => {
    // Initial fetch from backend
    if (availableTenants.length === 0) {
      fetchTenants();
    }
  }, []);

  useEffect(() => {
    // Ensure dark mode class is present if theme is dark
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Apply colors
    if (activeTenant) {
      document.documentElement.style.setProperty("--color-primary", activeTenant.config.primary_color);
      document.documentElement.style.setProperty("--color-secondary", activeTenant.config.secondary_color);
    }
  }, [activeTenant, theme]);

  const setTenantBySlug = (slug: string) => {
    const tenant = availableTenants.find(t => t.slug === slug);
    if (tenant) {
      setActiveTenant(tenant);
    }
  };

  return (
    <TenantContext.Provider value={{ 
      activeTenant: activeTenant, 
      availableTenants, 
      setTenantBySlug, 
      loading, 
      theme, 
      toggleTheme 
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant must be used within TenantProvider");
  return context;
}
