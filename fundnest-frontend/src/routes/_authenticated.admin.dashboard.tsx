import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Users, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: () => <RoleGate allow={["admin"]}><Page /></RoleGate>,
});

const COLORS = ["oklch(0.62 0.21 277)", "oklch(0.62 0.22 305)", "oklch(0.72 0.17 160)"];

function Page() {
  const queryClient = useQueryClient();

  const { data: statsRes, isLoading: loadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminApi.stats(),
  });

  const { data: pendingStartupsRes, isLoading: loadingStartups } = useQuery({
    queryKey: ["pendingStartups"],
    queryFn: () => adminApi.startups({ status: "Pending" }),
  });

  const { data: pendingKycRes, isLoading: loadingKyc } = useQuery({
    queryKey: ["pendingKycUsers"],
    queryFn: () => adminApi.users({ kycStatus: "Pending" }),
  });

  // Approve startup mutation
  const approveStartupMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveStartup(id),
    onSuccess: (data) => {
      toast.success(data.data.message || "Startup approved successfully");
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["pendingStartups"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to approve startup");
    },
  });

  // Reject startup mutation
  const rejectStartupMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.rejectStartup(id, reason),
    onSuccess: () => {
      toast.success("Startup rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["pendingStartups"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reject startup");
    },
  });

  // Approve/reject KYC mutation
  const updateKycMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateKyc(id, status),
    onSuccess: (data) => {
      toast.success(data.data.message || "KYC updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["pendingKycUsers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update KYC status");
    },
  });

  const isLoading = loadingStats || loadingStartups || loadingKyc;

  const stats = statsRes?.data?.stats ?? {
    users: { total: 0, founders: 0, investors: 0, pendingKyc: 0 },
    startups: { total: 0, pending: 0, approved: 0 },
    transactions: { total: 0, completed: 0, totalVolume: 0, platformRevenue: 0 },
    monthlyGrowth: [],
  };

  const pendingStartups = pendingStartupsRes?.data?.startups ?? [];
  const pendingKycUsers = pendingKycRes?.data?.users ?? [];

  const userBreakdown = [
    { name: "Investors", value: stats.users.investors },
    { name: "Founders", value: stats.users.founders },
    { name: "Admins", value: Math.max(0, stats.users.total - stats.users.investors - stats.users.founders) },
  ].filter((item) => item.value > 0);

  // Fallback to mock monthly growth if new server has no aggregation results
  const growthData = stats.monthlyGrowth.length > 0 
    ? stats.monthlyGrowth 
    : [
        { month: "Jan", users: 120 }, { month: "Feb", users: 240 }, { month: "Mar", users: 380 },
        { month: "Apr", users: 512 }, { month: "May", users: 684 }, { month: "Jun", users: stats.users.total || 800 }
      ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin dashboard" subtitle="Platform health and operations." />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl glass" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl glass" />
          <Skeleton className="h-80 rounded-2xl glass" />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Platform health and operations." />
      
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total users" value={stats.users.total.toLocaleString()} change={`+${stats.users.pendingKyc} pending KYC`} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Pending approvals" value={String(stats.startups.pending)} change="Startups waiting review" icon={<AlertCircle className="h-4 w-4" />} accent={stats.startups.pending > 0 ? "warning" : "primary"} />
        <StatCard label="Platform revenue" value={`$${stats.transactions.platformRevenue.toLocaleString()}`} change="2% flat fee on investments" icon={<DollarSign className="h-4 w-4" />} accent="success" />
        <StatCard label="Total investments" value={`$${stats.transactions.totalVolume.toLocaleString()}`} change={`${stats.transactions.completed} transactions`} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Platform growth (new users)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={growthData}>
                <XAxis dataKey="month" stroke="oklch(0.48 0.02 260)" fontSize={12} tickLine={false} />
                <YAxis stroke="oklch(0.48 0.02 260)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                  }}
                />
                <Line type="monotone" dataKey="users" stroke="oklch(0.55 0.22 277)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">User breakdown</h3>
          {userBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No user data available.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={userBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                    {userBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Pending startup approvals</h3>
          {pendingStartups.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              No startups waiting for approval.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Founder</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingStartups.map((s: any) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.founder?.name ?? "Unknown"}</TableCell>
                    <TableCell>${s.targetAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        className="btn-gradient" 
                        onClick={() => approveStartupMutation.mutate(s._id)}
                        disabled={approveStartupMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason !== null) {
                            rejectStartupMutation.mutate({ id: s._id, reason });
                          }
                        }}
                        disabled={rejectStartupMutation.isPending}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">KYC reviews</h3>
          {pendingKycUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              No KYC reviews pending.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingKycUsers.map((u: any) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        className="btn-gradient"
                        onClick={() => updateKycMutation.mutate({ id: u._id, status: "Verified" })}
                        disabled={updateKycMutation.isPending}
                      >
                        Verify
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateKycMutation.mutate({ id: u._id, status: "Rejected" })}
                        disabled={updateKycMutation.isPending}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
