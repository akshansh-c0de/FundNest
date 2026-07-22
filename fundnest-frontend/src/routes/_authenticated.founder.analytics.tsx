import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { mockGrowth } from "@/lib/mock";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { StatCard } from "@/components/StatCard";
import { Eye, MousePointerClick, Users, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/analytics")({
  component: () => <RoleGate allow={["founder"]}><Page /></RoleGate>,
});

const traffic = mockGrowth.map((d) => ({ m: d.m, views: d.v * 4, clicks: d.v }));

function Page() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Campaign performance at a glance." />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Page views" value="128.4K" icon={<Eye className="h-4 w-4" />} />
        <StatCard label="Click-through" value="6.2%" icon={<MousePointerClick className="h-4 w-4" />} />
        <StatCard label="Conversions" value="183" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Avg ticket" value="$2,224" icon={<DollarSign className="h-4 w-4" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Traffic</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={traffic}>
                <XAxis dataKey="m" stroke="oklch(0.72 0.02 270)" fontSize={12} />
                <YAxis stroke="oklch(0.72 0.02 270)" fontSize={12} />
                <Tooltip contentStyle={{ background: "oklch(0.17 0.04 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="views" stroke="oklch(0.62 0.21 277)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="oklch(0.62 0.22 305)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Investment volume</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={mockGrowth}>
                <XAxis dataKey="m" stroke="oklch(0.72 0.02 270)" fontSize={12} />
                <YAxis stroke="oklch(0.72 0.02 270)" fontSize={12} />
                <Tooltip contentStyle={{ background: "oklch(0.17 0.04 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12 }} />
                <Bar dataKey="v" fill="oklch(0.62 0.21 277)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
