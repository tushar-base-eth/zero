"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Profile } from "@/types/workouts";

interface UserProfile extends Profile {
  email: string;
}

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserProfile | null;
}

interface AuthContextType {
  state: AuthState;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void; // New method to update user state
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const { user } = await res.json();
        setState({ status: "authenticated", user });
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setState({ status: "unauthenticated", user: null });
    }
  };

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        await fetchSession();
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      setState({ status: "unauthenticated", user: null });
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (state.user) {
      setState((prev) => ({
        ...prev,
        user: { ...prev.user!, ...updates },
      }));
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const refreshProfile = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider value={{ state, refreshProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};