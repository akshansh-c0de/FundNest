import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard, Briefcase, TrendingUp, Users, Settings, LogOut, Building2,
  ShieldCheck, FileCheck, PieChart, Megaphone, PlusCircle, BarChart3, Receipt,
  Sparkles,
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AIChat } from "./AIChat";

type NavItem = { to: string; label: string; icon: any };

const NAV: Record<Role, NavItem[]> = {
  investor: [
    { to: "/investor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/startups", label: "Browse Startups", icon: Building2 },
    { to: "/portfolio", label: "Portfolio", icon: PieChart },
    { to: "/transactions", label: "Transactions", icon: Receipt },
  ],
  founder: [
    { to: "/founder/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/startups", label: "Browse Startups", icon: Building2 },
    { to: "/founder/create-startup", label: "Create Startup", icon: PlusCircle },
    { to: "/founder/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/founder/analytics", label: "Analytics", icon: BarChart3 },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/startups", label: "Startups", icon: Briefcase },
    { to: "/admin/kyc", label: "KYC", icon: FileCheck },
  ],
};

const SETTINGS_ITEMS: NavItem[] = [
  { to: "/settings", label: "Profile", icon: Settings },
  { to: "/settings/security", label: "Security", icon: ShieldCheck },
  { to: "/settings/sessions", label: "Sessions", icon: TrendingUp },
];

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isAiOpen, setIsAiOpen] = useState(false);
  const items = user ? NAV[user.role] : [];

  return (
    <div className="min-h-screen flex relative">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
        <div className="p-5 border-b border-sidebar-border"><Logo to={user ? `/${user.role}/dashboard`.replace("/investor/dashboard", "/investor/dashboard") : "/"} /></div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
            <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Intelligence</p>
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition cursor-pointer font-medium"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" /> AI Copilot
            </button>
          </div>
          <div className="pt-4 mt-2 border-t border-sidebar-border space-y-1">
            <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Account</p>
            {SETTINGS_ITEMS.map((it) => {
              const active = pathname === it.to;
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="btn-gradient text-xs">{user?.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 border-b border-border bg-background/60 backdrop-blur-xl flex items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsAiOpen(true)}>
              <Sparkles className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] w-full mx-auto pb-24">
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Persistent Floating AI Copilot Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <Sheet open={isAiOpen} onOpenChange={setIsAiOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="btn-gradient shadow-2xl rounded-full px-5 py-3 flex items-center gap-2.5 border border-primary/40 hover:scale-105 transition-all text-white font-medium cursor-pointer group"
            >
              <div className="relative">
                <Sparkles className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
              <span className="text-sm font-semibold tracking-wide">Ask FundNest AI</span>
            </button>
          </SheetTrigger>
          <SheetContent className="glass w-full sm:max-w-md p-0 overflow-hidden flex flex-col border-l border-border h-full">
            <AIChat />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
