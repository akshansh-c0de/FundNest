import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/founder/campaigns")({
  component: () => <RoleGate allow={["founder"]}><Page /></RoleGate>,
});

const campaigns = [
  { name: "Nimbus AI – Seed Round", raised: 312000, target: 500000, status: "Active", investors: 142, ends: "12 days" },
  { name: "Nimbus AI – Pre-launch", raised: 95000, target: 150000, status: "Active", investors: 41, ends: "5 days" },
  { name: "Beta MVP raise", raised: 60000, target: 60000, status: "Closed", investors: 28, ends: "—" },
];

function Page() {
  return (
    <>
      <PageHeader title="Campaigns" subtitle="Manage your active and past raises." />
      <div className="space-y-4">
        {campaigns.map((c) => {
          const pct = Math.round((c.raised / c.target) * 100);
          return (
            <div key={c.name} className="glass rounded-2xl p-6">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.investors} investors · ends in {c.ends}</p>
                </div>
                <Badge variant={c.status === "Active" ? "default" : "secondary"}>{c.status}</Badge>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>${(c.raised / 1000).toFixed(0)}K raised</span>
                <span>{pct}% of ${(c.target / 1000).toFixed(0)}K</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
