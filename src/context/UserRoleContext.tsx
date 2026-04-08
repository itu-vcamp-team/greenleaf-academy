"use client";

import React, { createContext, useContext, useState } from "react";

export type UserRole = "GUEST" | "CUSTOMER" | "PARTNER" | "ADMIN";

type UserRoleContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("GUEST");

  return (
    <UserRoleContext.Provider value={{ role, setRole }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error("useUserRole must be used within a UserRoleProvider");
  return context;
}
