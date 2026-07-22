import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authApi, tokenStore } from "@/lib/api";
import { useAuth, homeForRole } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-2fa")({
  head: () => ({ meta: [{ title: "Verify 2FA · FundNest" }] }),
  component: Verify2FA,
});

function Verify2FA() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempToken = typeof window !== "undefined" ? sessionStorage.getItem("tempToken") : null;
    if (!tempToken) return toast.error("Session expired. Please sign in again.");
    setLoading(true);
    try {
      const res = await authApi.verify2faLogin({ tempToken, code });
      tokenStore.set(res.data.accessToken || res.data.token);
      sessionStorage.removeItem("tempToken");
      setUser(res.data.user);
      toast.success("Welcome back!");
      navigate({ to: homeForRole(res.data.user?.role) });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid code");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Two-factor authentication" subtitle="Enter the 6-digit code from your authenticator app">
      <form onSubmit={submit} className="space-y-6">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" disabled={loading || code.length < 6} className="btn-gradient w-full">
          {loading ? "Verifying…" : "Verify"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Lost access? You can also paste a 10-character recovery code above.</p>
      </form>
    </AuthShell>
  );
}
