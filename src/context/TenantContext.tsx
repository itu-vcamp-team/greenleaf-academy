"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  logo: string;
  region: string;
};

const tenants: Tenant[] = [
  {
    id: "tr-01",
    name: "Greenleaf Türkiye",
    slug: "tr",
    primaryColor: "#10b981",
    logo: "TR",
    region: "Türkiye Akademi",
  },
  {
    id: "de-02",
    name: "Greenleaf Germany",
    slug: "de",
    primaryColor: "#3b82f6",
    logo: "DE",
    region: "Germany Academy",
  },
];

type TenantContextType = {
  activeTenant: Tenant;
  setTenantBySlug: (slug: string) => void;
  availableTenants: Tenant[];
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeTenant, setActiveTenant] = useState<Tenant>(tenants[0]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const setTenantBySlug = (slug: string) => {
    const found = tenants.find((t) => t.slug === slug);
    if (found) setActiveTenant(found);
  };

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  return (
    <TenantContext.Provider value={{ activeTenant, setTenantBySlug, availableTenants: tenants, theme, toggleTheme }}>
      <div style={{ "--primary": activeTenant.primaryColor } as React.CSSProperties}>
        {children}
      </div>
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant must be used within a TenantProvider");
  return context;
}
