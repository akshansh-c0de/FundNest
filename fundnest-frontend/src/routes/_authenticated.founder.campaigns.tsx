import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { startupsApi } from "@/lib/api";
import { PlusCircle, Megaphone, DollarSign, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/campaigns")({
  component: () => <RoleGate allow={["founder"]}><Page /></RoleGate>,
});

function Page() {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ["founderAnalytics"],
    queryFn: () => startupsApi.getFounderAnalytics(),
  });

  const campaigns = analyticsRes?.data?.analytics?.startupBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <PageHeader title="Campaigns" subtitle="Manage your active and pending fundraising rounds." />
        <Link to="/founder/create-startup">
          <Button className="btn-gradient inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl glass" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center max-w-xl mx-auto border border-dashed border-border mt-8">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
          <p className="text-sm text-muted-foreground mb-6">
            You haven't launched any startup campaigns yet. Start fundraising from verified global investors.
          </p>
          <Link to="/founder/create-startup">
            <Button className="btn-gradient inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Create Your First Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c: any) => {
            const raised = c.raisedAmount || 0;
            const target = c.targetAmount || 1;
            const pct = Math.min(100, Math.round((raised / target) * 100));
            const statusColor =
              c.status === "Approved"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : c.status === "Pending"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30";

            return (
              <div key={c.id || c.name} className="glass rounded-2xl p-6 transition hover:border-primary/40">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{c.name}</h3>
                      <Badge className={statusColor}>
                        {c.status === "Approved" ? "Active / Approved" : c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.sector} · {c.stage} · Escrow Hold: ${(c.escrowBalance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-foreground">
                      ${raised.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      of ${target.toLocaleString()} goal
                    </span>
                  </div>
                </div>

                <Progress value={pct} className="h-2" />

                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{pct}% funded</span>
                  <span>Escrow Released: ${(c.releasedFunds || 0).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
