"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import apiClient from "@/lib/api-client";

export type UserRole = "ADMIN" | "EDITOR" | "PARTNER" | "GUEST";

type UserRoleContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, setAuth } = useAuthStore();
  const [role, setInternalRole] = useState<UserRole>(user?.role || "GUEST");
  const [isLoading, setIsLoading] = useState(false);

  // Sync role when user store changes
  useEffect(() => {
    if (user?.role) {
      setInternalRole(user.role);
    } else {
      setInternalRole("GUEST");
    }
  }, [user?.role]);

  // Optional: Dynamic refresh from backend
  useEffect(() => {
    const verifyRole = async () => {
      if (user) {
        try {
          // Assuming backend has a verify-global endpoint that returns latest user info
          const res = await apiClient.get("/auth/verify-global");
          if (res.data.role !== user.role) {
            // Update store if changed on server
            setAuth(res.data, useAuthStore.getState().access_token!, useAuthStore.getState().refresh_token!);
          }
        } catch (err) {
          console.error("Role verification failed", err);
        }
      }
    };

    verifyRole();
  }, []);

  // Periodic check for token expiration to sync UI
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const { access_token, isAuthenticated, clearAuth } = useAuthStore.getState();
      if (access_token && !isAuthenticated()) {
        console.log("Session expired, logging out...");
        clearAuth();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, []);

  const setRole = (newRole: UserRole) => {
    setInternalRole(newRole);
    // Note: In real app, this should probably only happen via API
  };

  return (
    <UserRoleContext.Provider value={{ role, setRole, isLoading }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error("useUserRole must be used within a UserRoleProvider");
  return context;
}
