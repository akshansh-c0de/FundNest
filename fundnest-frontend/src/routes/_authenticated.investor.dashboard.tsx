import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { transactionsApi, investorApi } from "@/lib/api";
import { DollarSign, TrendingUp, PieChart as PieIcon, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/investor/dashboard")({
  component: () => <RoleGate allow={["investor"]}><Page /></RoleGate>,
});

const COLORS = ["oklch(0.62 0.21 277)", "oklch(0.62 0.22 305)", "oklch(0.72 0.17 160)", "oklch(0.78 0.16 75)", "oklch(0.65 0.23 25)"];

function Page() {
  const { data: portfolioRes, isLoading: loadingPortfolio } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => transactionsApi.getPortfolio(),
  });

  const { data: transactionsRes, isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.list(),
  });

  const { data: recommendationsRes, isLoading: loadingRecs } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => investorApi.getRecommendations(),
  });

  const isLoading = loadingPortfolio || loadingTransactions || loadingRecs;

  const portfolio = portfolioRes?.data?.portfolio ?? [];
  const stats = portfolioRes?.data?.statistics ?? { totalInvested: 0, totalInvestments: 0, uniqueStartups: 0 };
  const transactions = transactionsRes?.data?.transactions ?? [];
  const recommendations = recommendationsRes?.data?.startups ?? [];

  // Prepare allocation data
  const allocation = portfolio.map((item: any) => ({
    name: item.startup?.sector || "Other",
    value: item.totalInvested,
  }));

  // Consolidate duplicate sectors for allocation pie chart
  const sectorMap: Record<string, number> = {};
  allocation.forEach((item: any) => {
    sectorMap[item.name] = (sectorMap[item.name] || 0) + item.value;
  });
  const allocationData = Object.keys(sectorMap).map((name) => ({
    name,
    value: sectorMap[name],
  }));

  // Prepare growth data (mock for monthly chart if no real transactions exist, otherwise map real)
  const growthData = transactions.length > 0 
    ? transactions.reduce((acc: any[], t: any) => {
        const date = new Date(t.createdAt);
        const month = date.toLocaleString("default", { month: "short" });
        const existing = acc.find((item) => item.m === month);
        if (existing) {
          existing.v += t.amount;
        } else {
          acc.push({ m: month, v: t.amount });
        }
        return acc;
      }, []).reverse()
    : [
        { m: "Jan", v: 0 }, { m: "Feb", v: 0 }, { m: "Mar", v: 0 },
        { m: "Apr", v: 0 }, { m: "May", v: 0 }, { m: "Jun", v: 0 }
      ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Investor dashboard" subtitle="Track your portfolio and discover new opportunities." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl glass" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl glass" />
          <Skeleton className="h-80 rounded-2xl glass" />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Investor dashboard" subtitle="Track your portfolio and discover new opportunities." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total invested" value={`$${stats.totalInvested.toLocaleString()}`} change={`${stats.totalInvestments} investments`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Unique Startups" value={String(stats.uniqueStartups)} change="Diversification level" icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Pending Investments" value={String(transactions.filter((t: any) => t.status === "Pending").length)} change="Needs confirmation" icon={<TrendingUp className="h-4 w-4" />} accent={transactions.some((t: any) => t.status === "Pending") ? "warning" : "primary"} />
        <StatCard label="Platform yield" value="12.4%" change="Est. platform IRR" icon={<PieIcon className="h-4 w-4" />} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Investment growth</h3>
          {transactions.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
              <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No investment history found.</p>
              <Link to="/startups" className="mt-4"><Button size="sm" className="btn-gradient">Browse startups</Button></Link>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.21 277)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.62 0.21 277)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" stroke="oklch(0.48 0.02 260)" fontSize={12} tickLine={false} />
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
                  <Area type="monotone" dataKey="v" stroke="oklch(0.62 0.21 277)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Portfolio allocation</h3>
          {portfolio.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
              <PieIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No assets in portfolio.</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Recent investments</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              You haven't made any investments yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 5).map((t: any) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-medium">
                      {t.startup?.name ?? "Unknown Startup"}
                    </TableCell>
                    <TableCell>${t.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "Completed" ? "default" : t.status === "Pending" ? "secondary" : "destructive"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {t.status === "Pending" && (
                        <Link to={`/transactions`} className="text-xs text-primary hover:underline">
                          Pay Now
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Recommended for you</h3>
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((s: any) => {
              const pct = Math.round(((s.raisedAmount || 0) / (s.targetAmount || 1)) * 100);
              return (
                <div key={s._id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{s.name}</h4>
                      <p className="text-xs text-muted-foreground">{s.sector} · {s.stage}</p>
                    </div>
                    <Link to={`/startups`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                    <div className="h-full btn-gradient" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>${(s.raisedAmount / 1000).toFixed(0)}K raised</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              );
            })}
            {recommendations.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recommended startups at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
