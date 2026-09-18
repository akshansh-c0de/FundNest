import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { startupsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Building2, DollarSign, Target, Globe, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/create-startup")({
  component: () => <RoleGate allow={["founder"]}><Page /></RoleGate>,
});

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    sector: "AI / ML",
    stage: "Seed",
    target: "500000",
    website: "",
    location: "San Francisco, CA",
    teamSize: "5",
    annualRevenue: "150000",
    equity: "10",
    tags: "AI, DeepTech, Enterprise SaaS",
    milestoneTitle: "Beta Platform Launch & Initial Traction",
    milestoneDescription: "Deploy v1 platform to 50 enterprise pilot customers",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.sector || !form.stage || !form.target) {
      return toast.error("Please complete all required fields");
    }

    const targetAmount = Number(form.target);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return toast.error("Please provide a valid target funding amount");
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        sector: form.sector,
        stage: form.stage,
        targetAmount,
        website: form.website?.trim() || undefined,
        location: form.location?.trim() || "Global",
        teamSize: Number(form.teamSize) || 1,
        annualRevenue: Number(form.annualRevenue) || 0,
        equity: Number(form.equity) || 10,
        minInvestment: Math.min(500, Math.round(targetAmount * 0.01)),
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [form.sector],
        milestones: [
          {
            title: form.milestoneTitle || "Core Product Launch",
            deliverableDescription: form.milestoneDescription || "Release v1 and acquire first cohort",
            targetAmount: Math.round(targetAmount * 0.5),
            status: "Pending",
          },
          {
            title: "Market Expansion & Commercial Scale",
            deliverableDescription: "Expand go-to-market channels and reach revenue milestones",
            targetAmount: Math.round(targetAmount * 0.5),
            status: "Pending",
          },
        ],
      };

      const res = await startupsApi.create(payload);
      toast.success(res.data?.message || "Startup created and live on the marketplace!");

      // Invalidate cache so all dashboards reflect immediately
      await queryClient.invalidateQueries({ queryKey: ["startups"] });
      await queryClient.invalidateQueries({ queryKey: ["founderAnalytics"] });
      await queryClient.invalidateQueries({ queryKey: ["adminStats"] });

      // Navigate to explore directory so the founder sees their live startup
      navigate({ to: "/startups" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create startup campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Launch Startup Campaign"
        subtitle="Submit your venture to FundNest to tap into verified angel and institutional capital."
      />

      <form onSubmit={submit} className="glass rounded-3xl p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Startup Name */}
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Company Name *
            </Label>
            <Input
              placeholder="e.g. Synthetix AI"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Pitch & Description */}
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Venture Pitch & Description *
            </Label>
            <Textarea
              rows={4}
              placeholder="Describe your solution, value proposition, competitive moat, and customer traction..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Tip: Detailed pitches enable higher-fidelity OpenAI semantic matching and SWOT intelligence.
            </p>
          </div>

          {/* Sector */}
          <div className="space-y-2">
            <Label>Industry Sector *</Label>
            <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                {["FinTech", "AI / ML", "HealthTech", "CleanTech", "EdTech", "Robotics", "Other"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label>Funding Stage *</Label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {["Pre-Seed", "Seed", "Series A", "Series B"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Target Raise (USD) *
            </Label>
            <Input
              type="number"
              min="1000"
              step="1000"
              placeholder="500000"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              required
            />
          </div>

          {/* Equity */}
          <div className="space-y-2">
            <Label>Equity Offered (%)</Label>
            <Input
              type="number"
              min="1"
              max="49"
              placeholder="10"
              value={form.equity}
              onChange={(e) => setForm({ ...form, equity: e.target.value })}
            />
          </div>

          {/* Annual Revenue */}
          <div className="space-y-2">
            <Label>Annual Recurring Revenue (USD)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.annualRevenue}
              onChange={(e) => setForm({ ...form, annualRevenue: e.target.value })}
            />
          </div>

          {/* Team Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Full-Time Team Size
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="4"
              value={form.teamSize}
              onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Headquarters Location
            </Label>
            <Input
              placeholder="e.g. San Francisco, CA"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Website URL
            </Label>
            <Input
              type="url"
              placeholder="https://example.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2 md:col-span-2">
            <Label>Category Tags (comma separated)</Label>
            <Input
              placeholder="AI, Enterprise SaaS, Automation, DeepTech"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          {/* Milestone Setup */}
          <div className="space-y-4 md:col-span-2 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-base">Escrow Tranche 1 Milestone</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Milestone Title</Label>
                <Input
                  value={form.milestoneTitle}
                  onChange={(e) => setForm({ ...form, milestoneTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Key Deliverable / Success Proof</Label>
                <Input
                  value={form.milestoneDescription}
                  onChange={(e) => setForm({ ...form, milestoneDescription: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/founder/dashboard" })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="btn-gradient px-8">
            {loading ? "Publishing Campaign…" : "Publish Startup Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
}
