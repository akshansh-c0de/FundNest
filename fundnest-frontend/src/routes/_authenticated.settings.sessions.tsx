import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Session = { id: string; device: string; browser: string; ipAddress: string; lastActive: string; isCurrent: boolean };

export const Route = createFileRoute("/_authenticated/settings/sessions")({
  component: Sessions,
});

function Sessions() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [err, setErr] = useState("");

  const load = async () => {
    try { const r = await authApi.sessions(); setSessions(r.data.sessions); }
    catch (e: any) { setErr(e.response?.data?.message || "Failed to load sessions"); }
  };
  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    try {
      const r = await authApi.revokeSession(id);
      toast.success("Session revoked");
      if (r.data.loggedOutCurrent) { localStorage.removeItem("token"); window.location.href = "/login"; return; }
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
  };

  return (
    <>
      <PageHeader title="Active sessions" subtitle="Devices currently signed in to your account." />
      <div className="glass rounded-2xl p-6">
        {err && <p className="text-destructive text-sm mb-4">{err}</p>}
        {!sessions && !err && (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        )}
        {sessions && sessions.length === 0 && <p className="text-muted-foreground text-sm">No active sessions.</p>}
        {sessions && sessions.length > 0 && (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Device</TableHead><TableHead>Browser</TableHead><TableHead>IP</TableHead>
              <TableHead>Last active</TableHead><TableHead className="text-right">Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.device} {s.isCurrent && <Badge className="ml-2">Current</Badge>}</TableCell>
                  <TableCell>{s.browser}</TableCell>
                  <TableCell className="text-muted-foreground">{s.ipAddress}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(s.lastActive).toLocaleString()}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => revoke(s.id)}>Revoke</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
