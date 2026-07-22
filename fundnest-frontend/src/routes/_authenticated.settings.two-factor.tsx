import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/two-factor")({
  component: TwoFactor,
});

function TwoFactor() {
  const { user, refresh } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; qrCodeUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try { const r = await authApi.enable2fa(); setSetup({ secret: r.data.secret, qrCodeUri: r.data.qrCodeUri }); }
    catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const confirm = async () => {
    setLoading(true);
    try { const r = await authApi.confirm2fa(code); setRecovery(r.data.recoveryCodes); toast.success("2FA enabled"); refresh(); }
    catch (e: any) { toast.error(e.response?.data?.message || "Invalid code"); }
    finally { setLoading(false); }
  };

  const disable = async () => {
    setLoading(true);
    try { await authApi.disable2fa(code); toast.success("2FA disabled"); refresh(); setCode(""); }
    catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader title="Two-factor authentication" subtitle="Use an authenticator app to secure sign-in." />
      <div className="glass rounded-2xl p-8 max-w-xl">
        {user?.twoFactorEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">2FA is currently enabled. To disable it, enter a code from your authenticator app.</p>
            <div className="space-y-2"><Label>6-digit code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></div>
            <Button variant="destructive" disabled={loading || code.length !== 6} onClick={disable}>Disable 2FA</Button>
          </div>
        ) : !setup ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Scan a QR code with Google Authenticator, then enter the 6-digit code to enable.</p>
            <Button onClick={start} disabled={loading} className="btn-gradient">{loading ? "Loading…" : "Start setup"}</Button>
          </div>
        ) : recovery ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Save your recovery codes</h3>
            <p className="text-sm text-muted-foreground">Store these somewhere safe. They will not be shown again.</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-muted rounded-lg p-4">
              {recovery.map((c) => <div key={c}>{c}</div>)}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center"><img src={setup.qrCodeUri} alt="2FA QR code" className="rounded-lg bg-white p-2" /></div>
            <p className="text-xs text-center text-muted-foreground">Or enter secret manually: <code className="font-mono">{setup.secret}</code></p>
            <div className="space-y-2"><Label>Enter 6-digit code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></div>
            <Button onClick={confirm} disabled={loading || code.length !== 6} className="btn-gradient w-full">{loading ? "Verifying…" : "Confirm & enable"}</Button>
          </div>
        )}
      </div>
    </>
  );
}
