import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/founder/create-startup")({
  component: () => <RoleGate allow={["founder"]}><Page /></RoleGate>,
});

function Page() {
  const [form, setForm] = useState({ name: "", description: "", sector: "", stage: "", target: "", website: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.sector || !form.stage || !form.target) return toast.error("Please complete all required fields");
    setLoading(true);
    setTimeout(() => {
      toast.success("Startup submitted for review");
      setForm({ name: "", description: "", sector: "", stage: "", target: "", website: "" });
      setLoading(false);
    }, 700);
  };
  return (
    <>
      <PageHeader title="Create startup" subtitle="Tell investors what you're building." />
      <form onSubmit={submit} className="glass rounded-2xl p-6 grid md:grid-cols-2 gap-4 max-w-4xl">
        <div className="space-y-2 md:col-span-2">
          <Label>Company name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description *</Label>
          <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Sector *</Label>
          <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["FinTech", "AI / ML", "HealthTech", "CleanTech", "EdTech", "Robotics", "Other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Stage *</Label>
          <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["Pre-Seed", "Seed", "Series A", "Series B"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Target raise (USD) *</Label>
          <Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input type="url" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={loading} className="btn-gradient">{loading ? "Submitting…" : "Submit for review"}</Button>
        </div>
      </form>
    </>
  );
}
