import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authApi, tokenStore } from "@/lib/api";
import { useAuth, homeForRole } from "@/lib/auth";
import { toast } from "sonner";
import { UserCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · FundNest" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fillAndSubmit = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password are required");
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.data.require2FA) {
        sessionStorage.setItem("tempToken", res.data.tempToken);
        toast.info("Enter your 2FA code");
        navigate({ to: "/verify-2fa" });
        return;
      }
      tokenStore.set(res.data.accessToken || res.data.token);
      setUser(res.data.user);
      toast.success("Welcome back!");
      navigate({ to: homeForRole(res.data.user?.role) });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your FundNest account"
      footer={<>Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Create one</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="btn-gradient w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        {/* 1-Click Quick Demo Switcher */}
        <div className="pt-3 mt-2 border-t border-border">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" /> Test with a Demo Persona
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillAndSubmit("investor@fundnest.com", "password123")}
              className="text-xs h-8 px-1 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              Investor
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillAndSubmit("founder@fundnest.com", "password123")}
              className="text-xs h-8 px-1 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              Founder
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillAndSubmit("admin@fundnest.com", "password123")}
              className="text-xs h-8 px-1 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              Admin
            </Button>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
