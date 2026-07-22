import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { mockInvestments } from "@/lib/mock";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: () => <RoleGate allow={["investor"]}><Page /></RoleGate>,
});

function Page() {
  return (
    <>
      <PageHeader title="Transactions" subtitle="Every investment, dividend, and withdrawal." />
      <div className="glass rounded-2xl p-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Startup</TableHead>
            <TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {mockInvestments.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="text-muted-foreground">{i.date}</TableCell>
                <TableCell>Investment</TableCell>
                <TableCell className="font-medium">{i.startup}</TableCell>
                <TableCell><Badge variant={i.status === "Active" ? "default" : "secondary"}>{i.status}</Badge></TableCell>
                <TableCell className="text-right">${i.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
