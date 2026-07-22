import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, tokenStore } from "./api";

export type Role = "investor" | "founder" | "admin";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  kycStatus: string;
  verificationStatus: string;
  accountStatus: string;
  createdAt: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  setToken: (t: string, u?: User) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const t = tokenStore.get();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const r = await authApi.profile();
      setUser(r.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setToken = (t: string, u?: User) => {
    tokenStore.set(t);
    if (u) setUser(u);
    else refresh();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    tokenStore.clear();
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  return (
    <Ctx.Provider value={{ user, loading, setUser, setToken, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export function homeForRole(role?: Role) {
  if (role === "founder") return "/founder/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/investor/dashboard";
}
