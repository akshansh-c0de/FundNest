import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bookmark, BookmarkCheck, Trash2, ArrowRight, ExternalLink } from "lucide-react";
import { api, investorApi } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

interface Startup {
  _id: string;
  name: string;
  sector: string;
  stage: string;
  targetAmount: number;
  raisedAmount: number;
  logo?: string;
  description?: string;
}

interface BookmarkItem {
  _id: string;
  startup: Startup;
  notes?: string;
  tags?: string[];
  interestLevel?: "Low" | "Medium" | "High";
  createdAt?: string;
}

export function Watchlist() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      // First try /api/bookmarks
      const res = await api.get("/bookmarks");
      if (res.data?.bookmarks && res.data.bookmarks.length > 0) {
        setBookmarks(res.data.bookmarks);
      } else {
        // Fall back to investor watchlist endpoint if any
        const invRes = await investorApi.getWatchlist();
        const list = invRes.data?.watchlist || [];
        const formatted: BookmarkItem[] = list.map((item: any) => ({
          _id: item._id,
          startup: item,
          interestLevel: "High",
        }));
        setBookmarks(formatted);
      }
    } catch (error) {
      // Try investor watchlist as fallback
      try {
        const invRes = await investorApi.getWatchlist();
        const list = invRes.data?.watchlist || [];
        const formatted: BookmarkItem[] = list.map((item: any) => ({
          _id: item._id,
          startup: item,
          interestLevel: "High",
        }));
        setBookmarks(formatted);
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemove = async (bookmark: BookmarkItem) => {
    try {
      try {
        await api.delete(`/bookmarks/${bookmark._id}`);
      } catch {
        // If not found in /bookmarks, try investor watchlist endpoint
        await investorApi.removeFromWatchlist(bookmark.startup?._id || bookmark._id);
      }
      setBookmarks((prev) => prev.filter((b) => b._id !== bookmark._id));
      toast.success("Removed from watchlist");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove bookmark");
    }
  };

  const calculateProgress = (raised: number = 0, target: number = 1) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((raised / target) * 100));
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-56 rounded-2xl glass" />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="glass rounded-3xl p-16 text-center max-w-xl mx-auto border border-dashed border-border mt-6">
        <div className="h-16 w-16 rounded-2xl bg-accent/60 grid place-items-center mx-auto mb-4">
          <BookmarkCheck className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Your Watchlist is Empty</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Keep track of promising startup investment opportunities. Bookmark deals from the startup marketplace to monitor their progress.
        </p>
        <Link to="/startups">
          <Button className="btn-gradient inline-flex items-center gap-2">
            <span>Explore Startups</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Tracked Opportunities:</span>
          <Badge variant="secondary" className="px-2.5 py-0.5 font-bold">
            {bookmarks.length}
          </Badge>
        </div>
        <Link to="/startups">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <span>Browse More</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {bookmarks.map((bookmark) => {
          const s = bookmark.startup || {};
          const raised = s.raisedAmount || 0;
          const target = s.targetAmount || 1;
          const pct = calculateProgress(raised, target);

          return (
            <div
              key={bookmark._id}
              className="glass rounded-2xl p-6 flex flex-col justify-between hover:translate-y-[-2px] transition-all relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent/70 border border-border grid place-items-center text-2xl font-bold text-primary">
                      {s.logo || s.name?.[0] || "🚀"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                        {s.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                          {s.sector || "Tech"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{s.stage || "Early"}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(bookmark)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {s.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {s.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 my-4">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full btn-gradient transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>${(raised / 1000).toLocaleString()}K raised</span>
                    <span>Goal: ${(target / 1000).toLocaleString()}K</span>
                  </div>
                </div>

                {bookmark.notes && (
                  <div className="mt-3 p-2.5 bg-muted/60 rounded-xl text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Note:</span> {bookmark.notes}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Round
                </span>
                <Link to="/startups">
                  <Button size="sm" className="btn-gradient text-xs h-8">
                    View Deal
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
