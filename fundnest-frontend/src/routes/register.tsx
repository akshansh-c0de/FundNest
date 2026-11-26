import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account · FundNest" }] }),
  component: RegisterPage,
});

const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "investor" as "investor" | "founder" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Name must be at least 2 characters");
    if (!pwRegex.test(form.password)) return toast.error("Password must be 8+ chars with upper, lower, number, special");
    setLoading(true);
    try {
      const res = await authApi.register(form);
      toast.success(
        res.data?.emailVerificationRequired
          ? "Account created — check your email to verify"
          : "Account created — you can now sign in"
      );
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join FundNest as an investor or founder"
      footer={<>Already have an account? <Link to="/login" className="text-foreground underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>I am a…</Label>
          <RadioGroup value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })} className="grid grid-cols-2 gap-2">
            {(["investor", "founder"] as const).map((r) => (
              <label key={r} className={`glass rounded-lg p-3 cursor-pointer flex items-center gap-2 text-sm capitalize ${form.role === r ? "ring-2 ring-primary" : ""}`}>
                <RadioGroupItem value={r} /> {r}
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <p className="text-xs text-muted-foreground">8+ chars with uppercase, lowercase, number, special.</p>
        </div>
        <Button type="submit" disabled={loading} className="btn-gradient w-full">
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
