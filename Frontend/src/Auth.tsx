import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";

export type Role =
  | "Applicant"
  | "Office"
  | "EducationReviewer"
  | "ExperienceReviewer";

export type User = {
  id?: string;
  name?: string;
  email: string;
  roles: Role[];
};

type AuthContextType = {
  user: User | null;
  setUserFromBackend: (user: User) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const setUserFromBackend = (u: User) => setUser(u);

  const refreshMe = async () => {
    try {
      const data = await apiFetch<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {
      // not logged in, ignore
    }
  };

  const logout = async () => {
    try {
      await apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
  };

  useEffect(() => {
    refreshMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUserFromBackend, refreshMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}