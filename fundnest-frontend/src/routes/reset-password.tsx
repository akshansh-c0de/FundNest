import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password · FundNest" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) || "" }),
  component: ResetPage,
});

function ResetPage() {
  const { token: searchToken } = Route.useSearch();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (searchToken) setToken(searchToken); }, [searchToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success("Password reset. Please sign in.");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password" footer={<Link to="/login" className="underline">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4">
        {!searchToken && (
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cf">Confirm password</Label>
          <Input id="cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="btn-gradient w-full">{loading ? "Resetting…" : "Reset password"}</Button>
      </form>
    </AuthShell>
  );
}
