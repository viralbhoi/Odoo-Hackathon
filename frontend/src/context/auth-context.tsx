import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FLEET_MANAGER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";
  status?: string;
}

interface AuthContextValue {
  user: UserInfo | null;
  isLoading: boolean;
  refetch: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refetch: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Permission helpers — single source of truth
export const canManageVehicles = (role?: string) =>
  role === "ADMIN" || role === "FLEET_MANAGER";

export const canManageDrivers = (role?: string) =>
  role === "ADMIN" || role === "FLEET_MANAGER";

export const canDispatchTrips = (role?: string) =>
  role === "ADMIN" || role === "FLEET_MANAGER";

export const canManageMaintenance = (role?: string) =>
  role === "ADMIN" || role === "FLEET_MANAGER";

export const canManageFinancials = (role?: string) =>
  role === "ADMIN" || role === "FLEET_MANAGER" || role === "FINANCIAL_ANALYST";

export const canManageSafety = (role?: string) =>
  role === "ADMIN" || role === "SAFETY_OFFICER";

export const canManageUsers = (role?: string) => role === "ADMIN";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = () => {
    const token = localStorage.getItem("transitops_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const json = await res.json();
        setUser(json.data ?? json);
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("transitops_token");
        localStorage.removeItem("transitops_user");
        setUser(null);
        setIsLoading(false);
      });
  };

  const logout = () => {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
