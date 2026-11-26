import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { mockInvestments } from "@/lib/mock";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions · FundNest" }] }),
  component: () => <RoleGate allow={["investor", "admin"]}><Page /></RoleGate>,
});

function Page() {
  const { data: txRes, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.list(),
  });

  const apiTransactions = txRes?.data?.transactions || [];
  const hasRealData = apiTransactions.length > 0;

  const items = hasRealData
    ? apiTransactions.map((t: any) => ({
        id: t._id,
        date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        type: "Direct Investment",
        startup: t.startup?.name || "Startup Campaign",
        status: t.status === "InEscrow" ? "In Escrow" : t.status,
        amount: t.amount,
        badgeVariant: t.status === "Completed" ? "default" : t.status === "InEscrow" ? "secondary" : "outline",
      }))
    : mockInvestments.map((m) => ({
        id: m.id,
        date: m.date,
        type: "Investment",
        startup: m.startup,
        status: m.status,
        amount: m.amount,
        badgeVariant: m.status === "Active" ? "default" : "secondary",
      }));

  return (
    <>
      <PageHeader
        title="Transaction Ledger"
        subtitle="Complete, audited log of investments, escrow allocations, and settlements."
      />
      <div className="glass rounded-2xl p-6 shadow-sm border border-border">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No transactions recorded yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Startup</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i: any) => (
                <TableRow key={i.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs text-muted-foreground font-mono">{i.date}</TableCell>
                  <TableCell className="text-xs font-medium flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                    <span>{i.type}</span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{i.startup}</TableCell>
                  <TableCell>
                    <Badge variant={i.badgeVariant as any} className="text-xs font-semibold">
                      {i.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold font-mono text-sm">
                    ${i.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
