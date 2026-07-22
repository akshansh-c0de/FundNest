import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { authApi, tokenStore } from "@/lib/api";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: Security,
});

function Security() {
  const { user, setUser, refresh, logout } = useAuth();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const r = await authApi.changePassword(pw.current, pw.next);
      tokenStore.set(r.data.accessToken || r.data.token);
      setUser(r.data.user);
      toast.success("Password updated");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  const logoutAll = async () => {
    try { await authApi.logoutAll(); tokenStore.clear(); toast.success("All sessions revoked"); window.location.href = "/login"; }
    catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
  };

  return (
    <>
      <PageHeader title="Security" subtitle="Protect your account." />
      <div className="grid lg:grid-cols-2 gap-4 max-w-5xl">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4"><KeyRound className="h-5 w-5" /><h3 className="font-semibold">Change password</h3></div>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-2"><Label>Current password</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
            <div className="space-y-2"><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Confirm new</Label><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></div>
            <Button type="submit" disabled={loading} className="btn-gradient">{loading ? "Updating…" : "Update password"}</Button>
          </form>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4"><ShieldCheck className="h-5 w-5" /><h3 className="font-semibold">Two-factor authentication</h3></div>
          <p className="text-sm text-muted-foreground mb-4">{user?.twoFactorEnabled ? "2FA is enabled on your account." : "Add a second layer of security."}</p>
          <Link to="/settings/two-factor"><Button variant="outline">{user?.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}</Button></Link>
        </div>
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4"><LogOut className="h-5 w-5" /><h3 className="font-semibold">Session control</h3></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={logout}>Log out this device</Button>
            <Button variant="destructive" onClick={logoutAll}>Log out all devices</Button>
          </div>
        </div>
      </div>
    </>
  );
}
