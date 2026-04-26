import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "ADMIN" | "EDITOR" | "PARTNER" | "GUEST";
  partner_id: string | null;
  profile_image_path: string | null;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  setAuth: (user: User, access_token: string, refresh_token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const { exp } = JSON.parse(jsonPayload);
    // exp is in seconds, Date.now() is in ms
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      setAuth: (user, access_token, refresh_token) => {
        set({ user, access_token, refresh_token });
        setCookie("access_token", access_token);
        setCookie("user_role", user.role);
      },
      clearAuth: () => {
        set({ user: null, access_token: null, refresh_token: null });
        deleteCookie("access_token");
        deleteCookie("user_role");
      },
      isAuthenticated: () => {
        const token = get().access_token;
        return !!token && !isTokenExpired(token);
      },
    }),
    {
      name: "greenleaf-auth",
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
      }),
    }
  )
);
