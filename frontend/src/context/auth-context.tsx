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
  setUser: (u: UserInfo | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refetch: () => {},
  setUser: () => {},
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
  // Immediately read cached user from localStorage to prevent flash-to-login on refresh
  const cachedUser = (() => {
    try {
      const raw = localStorage.getItem("transitops_user");
      return raw ? (JSON.parse(raw) as UserInfo) : null;
    } catch { return null; }
  })();

  const [user, setUser] = useState<UserInfo | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser); // skip loading spinner if cache hit

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
    <AuthContext.Provider value={{ user, isLoading, refetch: fetchUser, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
