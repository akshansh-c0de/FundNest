import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify email · FundNest" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) || "" }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "fail">(token ? "loading" : "idle");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) return;
    authApi.verifyEmail(token)
      .then((r) => { setState("ok"); setMsg(r.data.message); })
      .catch((e) => { setState("fail"); setMsg(e.response?.data?.message || "Verification failed"); });
  }, [token]);

  const resend = async () => {
    try { await authApi.resendVerification(email); toast.success("Verification email sent"); }
    catch (e: any) { toast.error(e.response?.data?.message || "Failed to resend"); }
  };

  return (
    <AuthShell title="Verify email" subtitle="Confirm your FundNest account" footer={<Link to="/login" className="underline">Back to sign in</Link>}>
      {state === "loading" && <p className="text-sm text-muted-foreground">Verifying…</p>}
      {state === "ok" && (
        <div className="space-y-4">
          <p className="text-sm text-success">{msg || "Email verified!"}</p>
          <Link to="/login"><Button className="btn-gradient w-full">Continue to sign in</Button></Link>
        </div>
      )}
      {(state === "fail" || state === "idle") && (
        <div className="space-y-4">
          {state === "fail" && <p className="text-sm text-destructive">{msg}</p>}
          <p className="text-sm text-muted-foreground">Resend the verification link:</p>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={resend} className="btn-gradient w-full">Resend link</Button>
        </div>
      )}
    </AuthShell>
  );
}
