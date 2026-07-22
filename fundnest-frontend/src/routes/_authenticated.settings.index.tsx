import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />
      <div className="glass rounded-2xl p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16"><AvatarFallback className="btn-gradient text-xl">{user.name?.[0]}</AvatarFallback></Avatar>
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Name</Label><Input defaultValue={user.name} /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue={user.email} disabled /></div>
          <div className="space-y-2"><Label>Role</Label><div><Badge variant="outline" className="capitalize">{user.role}</Badge></div></div>
          <div className="space-y-2"><Label>KYC status</Label><div><Badge variant={user.kycStatus === "Verified" ? "default" : "secondary"}>{user.kycStatus}</Badge></div></div>
          <div className="space-y-2"><Label>Email verified</Label><div><Badge variant={user.isEmailVerified ? "default" : "secondary"}>{user.isEmailVerified ? "Verified" : "Pending"}</Badge></div></div>
          <div className="space-y-2"><Label>2FA</Label><div><Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>{user.twoFactorEnabled ? "Enabled" : "Disabled"}</Badge></div></div>
        </div>
      </div>
    </>
  );
}
