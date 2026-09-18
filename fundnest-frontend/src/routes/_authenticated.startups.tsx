import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { startupsApi, transactionsApi, investorApi, aiApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Search, Loader2, Heart, Globe, MapPin, Users,
  Sparkles, Brain, ShieldAlert, BarChart3, Bot, CheckCircle2,
  Key, AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AIReportCard } from "@/components/AIReportCard";
import { AIChat } from "@/components/AIChat";

export const Route = createFileRoute("/_authenticated/startups")({
  component: () => <RoleGate allow={["investor", "founder", "admin"]}><Page /></RoleGate>,
});

function Page() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<string>("overview");
  const [investingStartup, setInvestingStartup] = useState<any>(null);

  // OpenAI Configuration Status & Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const { data: aiStatusRes, refetch: refetchAiStatus } = useQuery({
    queryKey: ["aiStatus"],
    queryFn: () => aiApi.getStatus(),
  });
  const aiStatus = aiStatusRes?.data?.status;

  // AI Diligence State for Selected Startup
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReports, setAiReports] = useState<{
    swot?: any;
    risk?: any;
    summary?: any;
    recommendation?: any;
  }>({});
  const [showStartupChat, setShowStartupChat] = useState(false);

  // Investment Form State
  const [amount, setAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState("Stripe");
  const [notes, setNotes] = useState("");

  const { data: startupsRes, isLoading } = useQuery({
    queryKey: ["startups", q],
    queryFn: () => startupsApi.list({ q }),
  });

  const { data: watchlistRes } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => investorApi.getWatchlist(),
  });

  const startups = startupsRes?.data?.startups || [];
  const watchlist = watchlistRes?.data?.watchlist || [];
  const watchlistIds = new Set(watchlist.map((w: any) => w._id));

  // Watchlist mutation
  const toggleWatchlistMutation = useMutation({
    mutationFn: async ({ id, isSaved }: { id: string; isSaved: boolean }) => {
      if (isSaved) {
        return investorApi.removeFromWatchlist(id);
      } else {
        return investorApi.addToWatchlist(id);
      }
    },
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update watchlist");
    },
  });

  // Invest creation mutation
  const investMutation = useMutation({
    mutationFn: (data: { startupId: string; amount: number; paymentMethod: string; notes?: string }) => 
      transactionsApi.create(data),
    onSuccess: (res) => {
      const transactionId = res.data.transaction._id;
      toast.success("Investment request submitted. Completing simulated settlement...");
      completePaymentMutation.mutate({ transactionId, paymentId: `pay_${Math.random().toString(36).substring(2, 9)}` });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit investment");
    },
  });

  // Invest completion mutation
  const completePaymentMutation = useMutation({
    mutationFn: ({ transactionId, paymentId }: { transactionId: string; paymentId: string }) =>
      transactionsApi.complete(transactionId, { paymentId }),
    onSuccess: (res) => {
      toast.success(`Successfully invested in ${res.data.transaction?.startup?.name || "startup"}! Funds placed in escrow.`);
      setInvestingStartup(null);
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to complete payment simulation");
    },
  });

  // Fetch AI reports for selected startup
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyInput.trim() || !customKeyInput.trim().startsWith("sk-")) {
      return toast.error("Please enter a valid OpenAI API key starting with sk-");
    }

    setSavingKey(true);
    try {
      const res = await aiApi.configureKey(customKeyInput.trim());
      toast.success(res.data.message || "OpenAI API key configured and live!");
      refetchAiStatus();
      setShowKeyModal(false);
      setCustomKeyInput("");
      if (selectedStartup) {
        runAiEvaluation(selectedStartup._id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to authenticate with OpenAI API");
    } finally {
      setSavingKey(false);
    }
  };

  const runAiEvaluation = async (startupId: string) => {
    setAiLoading(true);
    try {
      const [summaryRes, swotRes, riskRes, recRes] = await Promise.allSettled([
        aiApi.summary(startupId),
        aiApi.swot(startupId),
        aiApi.riskScore(startupId),
        aiApi.recommendation(startupId),
      ]);

      setAiReports({
        summary: summaryRes.status === "fulfilled" ? summaryRes.value.data.summary : null,
        swot: swotRes.status === "fulfilled" ? swotRes.value.data.swot : null,
        risk: riskRes.status === "fulfilled" ? riskRes.value.data.risk : null,
        recommendation: recRes.status === "fulfilled" ? recRes.value.data.recommendation : null,
      });
      toast.success("GenAI intelligence synthesized successfully!");
    } catch (err: any) {
      toast.error("Failed to generate complete AI reports.");
    } finally {
      setAiLoading(false);
    }
  };

  const openStartupDetails = (s: any, tab = "overview") => {
    setSelectedStartup(s);
    setActiveSheetTab(tab);
    setAiReports({});
    if (tab === "ai") {
      runAiEvaluation(s._id);
    }
  };

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investingStartup) return;
    if (amount < (investingStartup.minInvestment || 100)) {
      toast.error(`Minimum investment is $${investingStartup.minInvestment || 100}`);
      return;
    }
    const remaining = investingStartup.targetAmount - investingStartup.raisedAmount;
    if (amount > remaining) {
      toast.error(`Maximum allowed investment is $${remaining.toLocaleString()}`);
      return;
    }

    investMutation.mutate({
      startupId: investingStartup._id,
      amount,
      paymentMethod,
      notes,
    });
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <PageHeader title="Browse Startups" subtitle="Discover vetted ventures evaluated with GenAI intelligence." />
      </div>
      
      {/* Search Bar */}
      <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          placeholder="Search by venture name, sector, tech stack, or description…" 
          className="border-0 bg-transparent focus-visible:ring-0 text-sm" 
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />}
      </div>

      {isLoading && startups.length === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : startups.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground max-w-lg mx-auto">
          No active startups match your search criteria.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {startups.map((s: any) => {
            const pct = Math.min(Math.round(((s.raisedAmount || 0) / (s.targetAmount || 1)) * 100), 100);
            const isSaved = watchlistIds.has(s._id);

            return (
              <div key={s._id} className="glass rounded-3xl p-6 flex flex-col hover:border-primary/40 transition-all group relative">
                {/* Watchlist Toggle */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={`absolute top-4 right-4 h-8 w-8 hover:bg-transparent ${isSaved ? "text-red-500" : "text-muted-foreground"}`}
                  onClick={() => toggleWatchlistMutation.mutate({ id: s._id, isSaved })}
                  disabled={toggleWatchlistMutation.isPending}
                >
                  <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
                </Button>

                <div 
                  className="cursor-pointer flex-1"
                  onClick={() => openStartupDetails(s, "overview")}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl grid place-items-center text-2xl bg-accent shrink-0">
                      {s.logo || "🧠"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{s.sector} · {s.stage}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 text-amber-400" /> GenAI Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                    {s.description}
                  </p>

                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full btn-gradient" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mb-6">
                    <span className="font-medium text-foreground">${(s.raisedAmount || 0).toLocaleString()} raised</span>
                    <span>{pct}% of ${(s.targetAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => openStartupDetails(s, "overview")}
                  >
                    Details
                  </Button>

                  <Button 
                    variant="secondary"
                    size="sm"
                    className="text-xs flex items-center gap-1 border border-primary/30 hover:bg-primary/10 text-primary font-medium"
                    onClick={() => openStartupDetails(s, "ai")}
                  >
                    <Sparkles className="h-3 w-3 text-amber-400" /> AI Report
                  </Button>

                  <Button 
                    size="sm"
                    className="btn-gradient text-xs"
                    onClick={() => {
                      setInvestingStartup(s);
                      setAmount(s.minInvestment || 100);
                    }}
                    disabled={s.status === "Closed" || s.raisedAmount >= s.targetAmount}
                  >
                    {s.status === "Closed" ? "Closed" : "Invest"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Startup Details & AI Intelligence Sheet */}
      <Sheet open={!!selectedStartup} onOpenChange={(open) => !open && setSelectedStartup(null)}>
        {selectedStartup && (
          <SheetContent className="glass w-full sm:max-w-2xl overflow-y-auto border-l border-border text-foreground p-6">
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl grid place-items-center text-3xl bg-accent shrink-0">
                  {selectedStartup.logo || "🧠"}
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold">{selectedStartup.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
                    <span>{selectedStartup.sector} · {selectedStartup.stage}</span>
                    <span>·</span>
                    <span className="text-primary font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-400" /> GenAI Due Diligence Active
                    </span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Navigation Tabs */}
            <Tabs value={activeSheetTab} onValueChange={setActiveSheetTab} className="w-full">
              <TabsList className="grid grid-cols-2 glass mb-6 h-11 p-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm font-medium">
                  Venture Overview & Milestones
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs sm:text-sm font-medium flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-4 w-4 text-amber-400" /> AI Intelligence Suite
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Overview */}
              <TabsContent value="overview" className="space-y-6 text-sm">
                <div className="glass rounded-2xl p-5 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">Current Raised</span>
                    <span className="text-xl font-bold text-foreground">${selectedStartup.raisedAmount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Target Funding</span>
                    <span className="text-xl font-bold text-foreground">${selectedStartup.targetAmount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Minimum Investment</span>
                    <span className="text-xl font-bold text-foreground">${(selectedStartup.minInvestment || 100).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Escrow Protected</span>
                    <span className="text-xl font-bold text-emerald-400">100% Milestone-Gated</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-base">Executive Pitch</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedStartup.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{selectedStartup.location || "Global"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Team: {selectedStartup.teamSize || 4} Members</span>
                  </div>
                  {selectedStartup.website && (
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <a href={selectedStartup.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedStartup.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Milestones */}
                {selectedStartup.milestones && selectedStartup.milestones.length > 0 && (
                  <div className="border-t border-border/40 pt-4">
                    <h4 className="font-semibold mb-3">Escrow Milestones</h4>
                    <div className="space-y-3">
                      {selectedStartup.milestones.map((m: any, idx: number) => (
                        <div key={m._id || idx} className="glass p-4 rounded-xl flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-sm">{m.title}</p>
                            {m.deliverableDescription && (
                              <p className="text-xs text-muted-foreground mt-1">{m.deliverableDescription}</p>
                            )}
                            <span className="text-xs text-primary font-semibold block mt-1">
                              Tranche: ${(m.targetAmount || 0).toLocaleString()}
                            </span>
                          </div>
                          <Badge variant={m.status === "Verified" ? "default" : "outline"}>
                            {m.status || "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 py-6 flex items-center gap-2 border-primary/40 text-primary"
                    onClick={() => {
                      setActiveSheetTab("ai");
                      runAiEvaluation(selectedStartup._id);
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-amber-400" /> View AI Due Diligence
                  </Button>
                  <Button 
                    className="btn-gradient flex-1 py-6"
                    onClick={() => {
                      setInvestingStartup(selectedStartup);
                      setAmount(selectedStartup.minInvestment || 100);
                      setSelectedStartup(null);
                    }}
                    disabled={selectedStartup.status === "Closed" || selectedStartup.raisedAmount >= selectedStartup.targetAmount}
                  >
                    Invest in Startup
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: GenAI Intelligence Suite */}
              <TabsContent value="ai" className="space-y-5">
                {/* Engine Live Status Banner */}
                {aiStatus?.mode === "quota_exhausted" ? (
                  <div className="glass p-4 rounded-2xl border border-red-500/40 bg-red-500/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-red-400 block">OpenAI Quota Exhausted (0 Credits Remaining)</span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed">
                          Your key is authenticated, but your OpenAI account balance is $0.00. Add credits at{" "}
                          <a href="https://platform.openai.com/settings/organization/billing" target="_blank" rel="noreferrer" className="text-primary underline">
                            platform.openai.com/billing
                          </a>{" "}
                          or update with another active key.
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 h-7 shrink-0"
                      onClick={() => setShowKeyModal(true)}
                    >
                      Update Key
                    </Button>
                  </div>
                ) : aiStatus?.configured ? (
                  <div className="glass p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 block">Real-time OpenAI Engine Active</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Direct live analysis via {aiStatus.chatModel} ({aiStatus.maskedKey || "Key Active"})
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground hover:text-foreground h-7"
                      onClick={() => setShowKeyModal(true)}
                    >
                      Update Key
                    </Button>
                  </div>
                ) : (
                  <div className="glass p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-amber-400 block">OpenAI API Key Required for Live GenAI</span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed">
                          Provide your OpenAI API key to execute real-time SWOT, risk narrative, and investment thesis evaluations.
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="btn-gradient text-xs flex items-center gap-1.5"
                      onClick={() => setShowKeyModal(true)}
                    >
                      <Key className="h-3.5 w-3.5" /> Connect OpenAI Key
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 glass p-4 rounded-2xl border border-primary/30">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <div>
                      <span className="font-semibold text-sm block">GenAI Intelligence Engine</span>
                      <span className="text-xs text-muted-foreground">Powered by OpenAI gpt-4o-mini & Text Embeddings</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => runAiEvaluation(selectedStartup._id)}
                    disabled={aiLoading}
                    className="btn-gradient text-xs flex items-center gap-1.5"
                  >
                    {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-300" />}
                    {aiLoading ? "Synthesizing AI..." : "Re-run Live AI Evaluation"}
                  </Button>
                </div>

                {/* Sub-Tabs for AI Reports */}
                <Tabs defaultValue="swot" className="w-full">
                  <TabsList className="grid grid-cols-4 glass h-10 p-1 mb-4">
                    <TabsTrigger value="swot" className="text-xs">📊 SWOT</TabsTrigger>
                    <TabsTrigger value="risk" className="text-xs">🛡️ Risk Model</TabsTrigger>
                    <TabsTrigger value="summary" className="text-xs">🧠 Summary</TabsTrigger>
                    <TabsTrigger value="verdict" className="text-xs">🎯 VC Verdict</TabsTrigger>
                  </TabsList>

                  <TabsContent value="swot">
                    <AIReportCard type="swot_analysis" data={aiReports.swot} loading={aiLoading} />
                  </TabsContent>

                  <TabsContent value="risk">
                    <AIReportCard type="risk_score" data={aiReports.risk} loading={aiLoading} />
                  </TabsContent>

                  <TabsContent value="summary">
                    <AIReportCard type="summary" data={aiReports.summary} loading={aiLoading} />
                  </TabsContent>

                  <TabsContent value="verdict">
                    <AIReportCard type="recommendation" data={aiReports.recommendation} loading={aiLoading} />
                  </TabsContent>
                </Tabs>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full py-5 glass border-primary/30 hover:bg-primary/10 text-primary flex items-center justify-center gap-2"
                    onClick={() => setShowStartupChat(true)}
                  >
                    <Bot className="h-4 w-4" /> Ask AI Copilot Deep Questions About {selectedStartup.name}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        )}
      </Sheet>

      {/* Scoped Startup AI Copilot Dialog */}
      <Dialog open={showStartupChat} onOpenChange={setShowStartupChat}>
        <DialogContent className="glass text-foreground border-border max-w-lg p-0 overflow-hidden h-[600px] flex flex-col">
          <AIChat
            startupId={selectedStartup?._id}
            initialPrompt={`Analyze ${selectedStartup?.name} in terms of its ${selectedStartup?.sector} competitive advantages, valuation, and milestone risks.`}
          />
        </DialogContent>
      </Dialog>

      {/* Invest Sandbox Modal */}
      <Dialog open={!!investingStartup} onOpenChange={(open) => !open && setInvestingStartup(null)}>
        {investingStartup && (
          <DialogContent className="glass text-foreground border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span>Invest in {investingStartup.name}</span>
              </DialogTitle>
              <DialogDescription>
                FundNest Escrow Sandbox. Funds are held in milestone-contingent escrow.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInvestSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={investingStartup.minInvestment || 100}
                  max={investingStartup.targetAmount - investingStartup.raisedAmount}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="glass"
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Min: ${(investingStartup.minInvestment || 100).toLocaleString()} | Max: ${(investingStartup.targetAmount - investingStartup.raisedAmount).toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="glass">
                    <SelectValue placeholder="Select payment option" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="Stripe">Stripe (Simulated Card)</SelectItem>
                    <SelectItem value="PayPal">PayPal (Simulated Wallet)</SelectItem>
                    <SelectItem value="Bank Transfer">Direct Bank Wire</SelectItem>
                    <SelectItem value="Crypto">Crypto (USDC / Bitcoin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes to Founder (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Excited to support the team!"
                  className="glass"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setInvestingStartup(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="btn-gradient"
                  disabled={investMutation.isPending || completePaymentMutation.isPending}
                >
                  {investMutation.isPending ? "Locking in Escrow..." : "Confirm & Lock in Escrow"}
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Connect OpenAI Key Modal */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent className="glass text-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> Connect OpenAI API Key
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct integration through OpenAI key for real-time gpt-4o-mini completions & text-embedding-3-small vectors.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveApiKey} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="openaiKey" className="text-xs">OpenAI Secret API Key</Label>
              <Input
                id="openaiKey"
                type="password"
                placeholder="sk-proj-..."
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                className="glass font-mono text-xs"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Your key will be verified against the OpenAI API immediately, stored in <code>.env</code>, and kept strictly on your local machine.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowKeyModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingKey} className="btn-gradient">
                {savingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                {savingKey ? "Verifying with OpenAI..." : "Save & Activate Real-time AI"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
