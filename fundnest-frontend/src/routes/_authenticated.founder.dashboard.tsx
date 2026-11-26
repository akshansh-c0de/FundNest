import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DollarSign, Megaphone, Users, Activity, PlusCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { startupsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/founder/dashboard")({
  component: () => <RoleGate allow={["founder"]}><Page /></RoleGate>,
});

function Page() {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ["founderAnalytics"],
    queryFn: () => startupsApi.getFounderAnalytics(),
  });

  const rawAnalytics = analyticsRes?.data?.analytics;
  const analytics = {
    totalStartups: rawAnalytics?.totalStartups ?? 0,
    totalTargetAmount: rawAnalytics?.totalTargetAmount ?? 0,
    totalRaisedAmount: rawAnalytics?.totalRaisedAmount ?? 0,
    totalInvestors: rawAnalytics?.totalInvestors ?? 0,
    averageFundingProgress: rawAnalytics?.averageFundingProgress ?? 0,
    startupsByStatus: {
      Pending: rawAnalytics?.startupsByStatus?.Pending ?? 0,
      Approved: rawAnalytics?.startupsByStatus?.Approved ?? 0,
      Rejected: rawAnalytics?.startupsByStatus?.Rejected ?? 0,
      Closed: rawAnalytics?.startupsByStatus?.Closed ?? 0,
    },
    recentActivity: rawAnalytics?.recentActivity ?? [],
    startupBreakdown: rawAnalytics?.startupBreakdown ?? [],
  };

  const activeCampaigns = analytics.startupBreakdown.filter((s: any) => s.status === "Approved" || s.status === "Pending").length;

  // Prepare data for bar chart
  const chartData = analytics.startupBreakdown.map((s: any) => ({
    name: s.name?.substring(0, 12) || "Startup",
    raised: s.raisedAmount || 0,
    target: s.targetAmount || 0,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Founder dashboard" subtitle="Monitor your raises and investor traction." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl glass" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <Skeleton className="h-80 rounded-2xl glass" />
          <Skeleton className="h-80 rounded-2xl glass" />
        </div>
      </div>
    );
  }

  const pendingCount = analytics.startupsByStatus?.Pending ?? 0;

  return (
    <>
      <PageHeader title="Founder dashboard" subtitle="Monitor your raises and investor traction." />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total raised" value={`$${(analytics.totalRaisedAmount || 0).toLocaleString()}`} change="Across all campaigns" icon={<DollarSign className="h-4 w-4" />} accent="success" />
        <StatCard label="Active campaigns" value={String(activeCampaigns)} change={`${pendingCount} pending approval`} icon={<Megaphone className="h-4 w-4" />} />
        <StatCard label="Total investors" value={String(analytics.totalInvestors || 0)} change="Unique backers" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Avg progress" value={`${analytics.averageFundingProgress || 0}%`} change="Across all campaigns" icon={<Activity className="h-4 w-4" />} />
      </div>

      {analytics.totalStartups === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-dashed border-border max-w-2xl mx-auto mt-10">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Startups Found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            You haven't listed a startup on FundNest yet. Register your startup to start raising capital from global investors.
          </p>
          <Link to="/founder/create-startup">
            <Button className="btn-gradient inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Create Startup Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Funding progress</h3>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No active funding campaigns.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" stroke="oklch(0.48 0.02 260)" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <YAxis type="category" dataKey="name" stroke="oklch(0.48 0.02 260)" fontSize={12} width={100} tickLine={false} />
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="target" fill="oklch(0.85 0.05 277)" radius={[0, 8, 8, 0]} name="Target" />
                    <Bar dataKey="raised" fill="oklch(0.55 0.22 277)" radius={[0, 8, 8, 0]} name="Raised" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Startup Campaigns</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.startupBreakdown.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.stage}</TableCell>
                    <TableCell>${s.raisedAmount.toLocaleString()} / ${s.targetAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Approved" ? "default" : s.status === "Pending" ? "secondary" : "destructive"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {analytics.recentActivity.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Recent Investor Activity</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Startup</TableHead>
                <TableHead>Investment Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.recentActivity.map((act: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{act.startupName}</TableCell>
                  <TableCell>${act.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(act.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
