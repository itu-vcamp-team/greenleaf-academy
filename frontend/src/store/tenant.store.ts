import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "@/lib/api-client";

export interface TenantConfig {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  support_links: Record<string, string>;
  social_media: Record<string, string>;
}

export interface TenantData {
  id: string;
  slug: string;
  name: string;
  logo: string;
  config: TenantConfig;
}

interface TenantState {
  activeTenant: TenantData | null;
  availableTenants: TenantData[];
  loading: boolean;
  theme: "light" | "dark";
  setActiveTenant: (tenant: TenantData) => void;
  setAvailableTenants: (tenants: TenantData[]) => void;
  setLoading: (loading: boolean) => void;
  toggleTheme: () => void;
  fetchTenants: () => Promise<void>;
  getTenantSlug: () => string;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      activeTenant: null,
      availableTenants: [],
      loading: false,
      theme: "dark",
      setActiveTenant: (tenant) => {
        set({ activeTenant: tenant });
        // Update CSS variables globally
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty("--color-primary", tenant.config.primary_color);
          document.documentElement.style.setProperty("--color-secondary", tenant.config.secondary_color);
        }
      },
      setAvailableTenants: (tenants) => set({ availableTenants: tenants }),
      setLoading: (loading) => set({ loading }),
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          if (typeof document !== 'undefined') {
            if (newTheme === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          return { theme: newTheme };
        });
      },
      fetchTenants: async () => {
        set({ loading: true });
        try {
          const res = await apiClient.get<TenantData[]>("/tenants");
          const tenants = res.data;
          set({ availableTenants: tenants });
          
          // If no active tenant selected yet, pick the first one or matching slug
          if (!get().activeTenant && tenants.length > 0) {
            set({ activeTenant: tenants[0] });
          }
        } catch (error) {
          console.error("Failed to fetch tenants:", error);
        } finally {
          set({ loading: false });
        }
      },
      getTenantSlug: () => get().activeTenant?.slug || "tr-TR",
    }),
    {
      name: "greenleaf-tenant",
      partialize: (state) => ({
        activeTenant: state.activeTenant,
        theme: state.theme,
      }),
    }
  )
);
