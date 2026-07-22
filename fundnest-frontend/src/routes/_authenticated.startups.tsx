import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { startupsApi, transactionsApi, investorApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, Loader2, Heart, Globe, MapPin, Users, Calendar, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/startups")({
  component: () => <RoleGate allow={["investor"]}><Page /></RoleGate>,
});

function Page() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [investingStartup, setInvestingStartup] = useState<any>(null);

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
      toast.success("Investment request submitted. Simulating checkout...");
      
      // Auto-complete simulated payment for demo
      setTimeout(() => {
        completePaymentMutation.mutate({ transactionId, paymentId: `pay_${Math.random().toString(36).substr(2, 9)}` });
      }, 1000);
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
      toast.success(`Successfully invested in ${res.data.transaction?.startup?.name || "startup"}!`);
      setInvestingStartup(null);
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to complete payment simulation");
    },
  });

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
      <PageHeader title="Browse startups" subtitle="Discover vetted opportunities raising now." />
      
      <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          placeholder="Search by name, sector or description…" 
          className="border-0 bg-transparent focus-visible:ring-0" 
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
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          No active startups match your search criteria.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {startups.map((s: any) => {
            const pct = Math.min(Math.round(((s.raisedAmount || 0) / (s.targetAmount || 1)) * 100), 100);
            const isSaved = watchlistIds.has(s._id);

            return (
              <div key={s._id} className="glass rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-all group relative">
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
                  onClick={() => setSelectedStartup(s)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl grid place-items-center text-2xl bg-accent">
                      {s.logo || "🧠"}
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">{s.sector} · {s.stage}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                    {s.description}
                  </p>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full btn-gradient" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-6">
                    <span>${(s.raisedAmount || 0).toLocaleString()} raised</span>
                    <span>{pct}% of ${s.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedStartup(s)}
                  >
                    Details
                  </Button>
                  <Button 
                    className="btn-gradient flex-1"
                    onClick={() => {
                      setInvestingStartup(s);
                      setAmount(s.minInvestment || 100);
                    }}
                    disabled={s.status === "Closed" || s.raisedAmount >= s.targetAmount}
                  >
                    {s.status === "Closed" ? "Closed" : "Invest now"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Startup Details Sheet */}
      <Sheet open={!!selectedStartup} onOpenChange={(open) => !open && setSelectedStartup(null)}>
        {selectedStartup && (
          <SheetContent className="glass w-full sm:max-w-xl overflow-y-auto border-l border-border text-foreground">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-14 w-14 rounded-2xl grid place-items-center text-3xl bg-accent">
                  {selectedStartup.logo || "🧠"}
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold">{selectedStartup.name}</SheetTitle>
                  <SheetDescription>{selectedStartup.sector} · {selectedStartup.stage}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6 text-sm">
              <div className="glass rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block">Raised</span>
                  <span className="text-lg font-bold">${selectedStartup.raisedAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Target</span>
                  <span className="text-lg font-bold">${selectedStartup.targetAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Minimum Investment</span>
                  <span className="text-lg font-bold">${(selectedStartup.minInvestment || 100).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Investors</span>
                  <span className="text-lg font-bold">{selectedStartup.investorsCount}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">About the Company</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedStartup.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedStartup.location || "Silicon Valley, CA"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Team Size: {selectedStartup.teamSize || "1 - 10"}</span>
                </div>
                {selectedStartup.website && (
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <Globe className="h-4 w-4" />
                    <a href={selectedStartup.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedStartup.website}
                    </a>
                  </div>
                )}
              </div>

              {selectedStartup.milestones && selectedStartup.milestones.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-3">Milestones & Progress</h4>
                  <div className="space-y-3">
                    {selectedStartup.milestones.map((m: any) => (
                      <div key={m._id} className="glass p-3 rounded-lg flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-xs">{m.title}</p>
                          {m.description && <p className="text-[11px] text-muted-foreground mt-0.5">{m.description}</p>}
                        </div>
                        <Badge variant={m.status === "Completed" ? "default" : m.status === "InProgress" ? "secondary" : "outline"}>
                          {m.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-3">
                <Button 
                  className="btn-gradient flex-1 py-6"
                  onClick={() => {
                    setInvestingStartup(selectedStartup);
                    setAmount(selectedStartup.minInvestment || 100);
                    setSelectedStartup(null);
                  }}
                  disabled={selectedStartup.status === "Closed" || selectedStartup.raisedAmount >= selectedStartup.targetAmount}
                >
                  {selectedStartup.status === "Closed" ? "Closed Campaign" : "Invest in Startup"}
                </Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Invest sandbox Modal */}
      <Dialog open={!!investingStartup} onOpenChange={(open) => !open && setInvestingStartup(null)}>
        {investingStartup && (
          <DialogContent className="glass text-foreground border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span>Invest in {investingStartup.name}</span>
              </DialogTitle>
              <DialogDescription>
                FundNest Sandbox Checkout. Enter your investment parameters.
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
                  {investMutation.isPending ? "Processing..." : "Confirm Investment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
