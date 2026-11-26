import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { transactionsApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as PieIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portfolio")({
  component: () => <RoleGate allow={["investor"]}><Page /></RoleGate>,
});

const COLORS = ["oklch(0.62 0.21 277)", "oklch(0.62 0.22 305)", "oklch(0.72 0.17 160)", "oklch(0.78 0.16 75)", "oklch(0.65 0.23 25)"];

function Page() {
  const { data: portfolioRes, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => transactionsApi.getPortfolio(),
  });

  const portfolio = portfolioRes?.data?.portfolio ?? [];

  // Group portfolio items by sector
  const sectorMap: Record<string, number> = {};
  portfolio.forEach((item: any) => {
    const sector = item.startup?.sector || "Other";
    sectorMap[sector] = (sectorMap[sector] || 0) + item.totalInvested;
  });

  const allocationData = Object.keys(sectorMap).map((name) => ({
    name,
    value: sectorMap[name],
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My portfolio" subtitle="Holdings across all active investments." />
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl glass" />
          <Skeleton className="h-80 rounded-2xl glass" />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="My portfolio" subtitle="Holdings across all active investments." />
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Holdings</h3>
          {portfolio.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              No holdings in your portfolio. Get started by exploring startup campaigns!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Amount Invested</TableHead>
                  <TableHead>Transaction Count</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.map((i: any) => (
                  <TableRow key={i.startup?._id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <span className="text-lg">{i.startup?.logo || "🧠"}</span>
                      {i.startup?.name || "Unknown Startup"}
                    </TableCell>
                    <TableCell>{i.startup?.sector || "Other"}</TableCell>
                    <TableCell>${i.totalInvested.toLocaleString()}</TableCell>
                    <TableCell>{i.transactionCount} transactions</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">By sector</h3>
          {allocationData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground text-sm">
              <PieIcon className="h-10 w-10 mb-2 text-muted-foreground" />
              <span>No sector allocation data.</span>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
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
    </>
  );
}
