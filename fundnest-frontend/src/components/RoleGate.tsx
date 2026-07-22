import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, homeForRole, type Role } from "@/lib/auth";

export function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user && !allow.includes(user.role)) {
      navigate({ to: homeForRole(user.role) });
    }
  }, [loading, user, allow, navigate]);
  if (!user || !allow.includes(user.role)) {
    return <div className="glass rounded-xl p-6 text-sm text-muted-foreground">Checking access…</div>;
  }
  return <>{children}</>;
}
